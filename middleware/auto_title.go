package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

type titleRequest struct {
	Title *struct {
		Enabled bool `json:"enabled"`
	} `json:"title"`
	Messages []struct {
		Role    string          `json:"role"`
		Content json.RawMessage `json:"content"`
	} `json:"messages"`
}

func extractText(raw json.RawMessage) string {
	var s string
	if err := json.Unmarshal(raw, &s); err == nil {
		return s
	}
	var blocks []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	}
	if err := json.Unmarshal(raw, &blocks); err == nil {
		for _, b := range blocks {
			if b.Type == "text" && b.Text != "" {
				return b.Text
			}
		}
	}
	return ""
}

// askUpstreamTitle 用渠道 Key 调一次上游，让模型给会话起标题
func askUpstreamTitle(question, answer string) string {
	channel, err := model.GetEnabledChannelForBalance()
	if err != nil {
		return ""
	}
	base := "https://api.deepseek.com"
	if channel.BaseURL != nil && *channel.BaseURL != "" {
		base = strings.TrimRight(*channel.BaseURL, "/")
	}
	hint := "用户：" + truncateRunes(question, 200)
	if answer != "" {
		hint += "\n助手：" + truncateRunes(answer, 300)
	}
	payload := map[string]any{
		"model": "deepseek-chat",
		"messages": []map[string]string{
			{"role": "system", "content": "根据这轮问答概括会话主题，只输出不超过 12 个汉字，不要标点，不要解释。"},
			{"role": "user", "content": hint},
		},
		"max_tokens": 32,
		"stream":     false,
	}
	body, _ := json.Marshal(payload)
	req, err := http.NewRequest(http.MethodPost, base+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return ""
	}
	req.Header.Set("Authorization", "Bearer "+channel.Key)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 20 * time.Second, Transport: &http.Transport{Proxy: nil}}
	resp, err := client.Do(req)
	if err != nil {
		return ""
	}
	defer resp.Body.Close()
	var out struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if json.NewDecoder(resp.Body).Decode(&out) != nil || len(out.Choices) == 0 {
		return ""
	}
	title := strings.TrimSpace(out.Choices[0].Message.Content)
	title = strings.Map(func(r rune) rune {
		if strings.ContainsRune("\n\r\"“”《》【】", r) {
			return -1
		}
		return r
	}, title)
	if len([]rune(title)) > 14 {
		title = string([]rune(title)[:14])
	}
	return title
}

// teeWriter 把流内容同时写进缓冲区，用来提取首轮回答
type teeWriter struct {
	gin.ResponseWriter
	buf bytes.Buffer
}

func (w *teeWriter) Write(data []byte) (int, error) {
	if w.buf.Len() < 64*1024 {
		w.buf.Write(data)
	}
	return w.ResponseWriter.Write(data)
}

// extractReply 从 SSE 里取出回答文本（Anthropic 的 text_delta）
func extractReply(raw string) string {
	var out strings.Builder
	for _, line := range strings.Split(raw, "\n") {
		line = strings.TrimPrefix(line, "data: ")
		if !strings.Contains(line, "text_delta") {
			continue
		}
		var event struct {
			Delta struct {
				Text string `json:"text"`
			} `json:"delta"`
		}
		if json.Unmarshal([]byte(line), &event) == nil {
			out.WriteString(event.Delta.Text)
		}
	}
	return out.String()
}

// AutoTitle 处理 title.enabled：流结束后补一条 message_delta，带 title 字段
func AutoTitle() gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.Next()
			return
		}
		c.Request.Body = io.NopCloser(bytes.NewReader(raw))

		var req titleRequest
		if json.Unmarshal(raw, &req) != nil || req.Title == nil || !req.Title.Enabled {
			c.Next()
			return
		}

		question := ""
		for _, msg := range req.Messages {
			if msg.Role == "user" {
				if text := extractText(msg.Content); text != "" {
					question = text
					break
				}
			}
		}

		tee := &teeWriter{ResponseWriter: c.Writer}
		c.Writer = tee
		c.Next()

		if question == "" || !strings.Contains(c.Writer.Header().Get("Content-Type"), "text/event-stream") {
			return
		}
		answer := extractReply(tee.buf.String())
		title := askUpstreamTitle(question, answer)
		if title == "" {
			return
		}
		payload, _ := json.Marshal(gin.H{
			"type":  "message_delta",
			"delta": gin.H{"title": title},
		})
		_, _ = c.Writer.Write([]byte("\nevent: message_delta\ndata: " + string(payload) + "\n\n"))
		c.Writer.Flush()
	}
}


func truncateRunes(text string, limit int) string {
	runes := []rune(strings.TrimSpace(text))
	if len(runes) <= limit {
		return string(runes)
	}
	return string(runes[:limit])
}
