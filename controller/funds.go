package controller

import (
	"encoding/json"
	"io"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/gin-gonic/gin"
)

// perYuanQuota 返回「1 元人民币对应多少额度」
func perYuanQuota() float64 {
	rate := operation_setting.USDExchangeRate
	if rate <= 0 {
		rate = 7.3
	}
	return common.QuotaPerUnit / rate
}

func toCNY(quota float64) float64 {
	per := perYuanQuota()
	if per <= 0 {
		return 0
	}
	return math.Round(quota/per*100) / 100
}

// GetUpstreamBalance 用启用中的渠道 Key 查询上游账户余额（仅管理员）
func GetUpstreamBalance(c *gin.Context) {
	channel, err := model.GetEnabledChannelForBalance()
	if err != nil {
		common.ApiError(c, err)
		return
	}

	baseURL := "https://api.deepseek.com"
	if channel.BaseURL != nil && *channel.BaseURL != "" {
		baseURL = strings.TrimRight(*channel.BaseURL, "/")
	}

	// 忽略进程代理：本机常设 http_proxy，会导致连不上官方接口
	transport := &http.Transport{Proxy: nil, ForceAttemptHTTP2: false}
	client := &http.Client{Timeout: 20 * time.Second, Transport: transport}
	req, err := http.NewRequest(http.MethodGet, baseURL+"/user/balance", nil)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	req.Header.Set("Authorization", "Bearer "+channel.Key)
	req.Header.Set("User-Agent", "new-api-funds/1.0")
	req.Header.Set("Accept", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "查询上游余额失败：" + err.Error()})
		return
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "上游返回 " + resp.Status, "data": string(body)})
		return
	}
	c.Data(http.StatusOK, "application/json; charset=utf-8", body)
}

// GetFundsOverview 账号资金总览，金额一律用人民币（仅管理员）
func GetFundsOverview(c *gin.Context) {
	type userRow struct {
		Id           int    `json:"id"`
		Username     string `json:"username"`
		Role         int    `json:"role"`
		Status       int    `json:"status"`
		RequestCount int    `json:"request_count"`
		Quota        int    `json:"-"`
		UsedQuota    int    `json:"-"`
	}

	var users []userRow
	if err := model.DB.Table("users").
		Select("id, username, role, status, used_quota, quota, request_count").
		Find(&users).Error; err != nil {
		common.ApiError(c, err)
		return
	}

	type topupSum struct {
		UserId int     `json:"user_id"`
		Money  float64 `json:"money"`
	}
	var sums []topupSum
	model.DB.Table("top_ups").
		Select("user_id, SUM(money) as money").
		Where("status = ?", common.TopUpStatusSuccess).
		Group("user_id").
		Scan(&sums)

	paid := make(map[int]float64, len(sums))
	for _, item := range sums {
		paid[item.UserId] = math.Round(item.Money*100) / 100
	}

	type outRow struct {
		Id           int     `json:"id"`
		Username     string  `json:"username"`
		Role         int     `json:"role"`
		Status       int     `json:"status"`
		RequestCount int     `json:"request_count"`
		ToppedUp     float64 `json:"topped_up"`
		Balance      float64 `json:"balance"`
		Used         float64 `json:"used"`
		Total        float64 `json:"total"`
	}

	out := make([]outRow, 0, len(users))
	for _, user := range users {
		balance := toCNY(float64(user.Quota))
		used := toCNY(float64(user.UsedQuota))
		out = append(out, outRow{
			Id:           user.Id,
			Username:     user.Username,
			Role:         user.Role,
			Status:       user.Status,
			RequestCount: user.RequestCount,
			ToppedUp:     paid[user.Id],
			Balance:      balance,
			Used:         used,
			Total:        math.Round((balance+used)*100) / 100,
		})
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"users": out}})
}

// AdjustUserQuota 管理员直接用人民币设置用户余额
func AdjustUserQuota(c *gin.Context) {
	var req struct {
		UserId int     `json:"user_id"`
		Amount float64 `json:"amount"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.UserId == 0 || req.Amount < 0 {
		common.ApiErrorT(c, "Invalid parameters")
		return
	}
	user, err := model.GetUserById(req.UserId, false)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	quota := int(math.Round(req.Amount * perYuanQuota()))
	delta := quota - user.Quota
	if err := model.DB.Model(&model.User{}).Where("id = ?", req.UserId).
		Update("quota", quota).Error; err != nil {
		common.ApiError(c, err)
		return
	}
	model.RecordLog(req.UserId, model.LogTypeManage,
		common.NewMessage("Quota changed by admin: {{delta}}", map[string]any{
			"delta": logger.FormatQuota(delta),
		}))
	c.JSON(http.StatusOK, gin.H{"success": true, "message": ""})
}

// GetUsageDetail 某个用户最近若干天的用量明细，金额用人民币（仅管理员）
func GetUsageDetail(c *gin.Context) {
	username := c.Query("username")
	days := 30
	if v := c.Query("days"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 && n <= 365 {
			days = n
		}
	}
	if username == "" {
		common.ApiErrorT(c, "Invalid parameters")
		return
	}

	var logs []model.Log
	start := time.Now().AddDate(0, 0, -days).Unix()
	err := model.DB.Where("username = ? AND created_at >= ?", username, start).
		Order("created_at DESC").Limit(100).Find(&logs).Error
	if err != nil {
		common.ApiError(c, err)
		return
	}

	type item struct {
		CreatedAt    int64   `json:"created_at"`
		ModelName    string  `json:"model_name"`
		PromptTokens int     `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		Cost         float64 `json:"cost"`
	}
	out := make([]item, 0, len(logs))
	for _, log := range logs {
		out = append(out, item{
			CreatedAt:        log.CreatedAt,
			ModelName:        log.ModelName,
			PromptTokens:     log.PromptTokens,
			CompletionTokens: log.CompletionTokens,
			Cost:             toCNY(float64(log.Quota)),
		})
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"items": out}})
}

// GetPlatformOverview 平台总量 + 用户汇总，金额一律人民币（仅管理员）
func GetPlatformOverview(c *gin.Context) {
	channel, chanErr := model.GetEnabledChannelForBalance()

	keyMasked := ""
	baseURL := ""
	if chanErr == nil {
		k := channel.Key
		if len(k) > 12 {
			keyMasked = k[:8] + "…" + k[len(k)-4:]
		} else {
			keyMasked = "…"
		}
		if channel.BaseURL != nil {
			baseURL = *channel.BaseURL
		}
	}

	// 上游账户
	type balanceInfo struct {
		Currency        string `json:"currency"`
		TotalBalance    string `json:"total_balance"`
		GrantedBalance  string `json:"granted_balance"`
		ToppedUpBalance string `json:"topped_up_balance"`
	}
	var info balanceInfo
	if chanErr == nil {
		url := strings.TrimRight(baseURL, "/")
		if url == "" {
			url = "https://api.deepseek.com"
		}
		transport := &http.Transport{Proxy: nil, ForceAttemptHTTP2: false}
		client := &http.Client{Timeout: 15 * time.Second, Transport: transport}
		req, err := http.NewRequest(http.MethodGet, url+"/user/balance", nil)
		if err == nil {
			req.Header.Set("Authorization", "Bearer "+channel.Key)
			req.Header.Set("User-Agent", "new-api-funds/1.0")
			if resp, err := client.Do(req); err == nil {
				var body struct {
					BalanceInfos []balanceInfo `json:"balance_infos"`
				}
				_ = json.NewDecoder(resp.Body).Decode(&body)
				resp.Body.Close()
				if len(body.BalanceInfos) > 0 {
					info = body.BalanceInfos[0]
				}
			}
		}
	}

	f := func(s string) float64 {
		v, _ := strconv.ParseFloat(s, 64)
		return v
	}
	upBalance := f(info.TotalBalance)
	// 累计口径：充值只在余额上涨时增加，消耗按余额下降累计
	stat, statErr := model.RecordPlatformBalance(upBalance)
	upToppedUp, upUsed := upBalance, 0.0
	if statErr == nil && stat != nil {
		upUsed = math.Round(stat.CumUsed*100) / 100
		upToppedUp = math.Round((upBalance+upUsed)*100) / 100
	}

	// 站内用户汇总
	type row struct {
		Quota     int `json:"quota"`
		UsedQuota int `json:"used_quota"`
		Role      int `json:"role"`
	}
	var rows []row
	model.DB.Table("users").Select("quota, used_quota, role").Find(&rows)

	type sumRow struct {
		UserId int     `json:"user_id"`
		Money  float64 `json:"money"`
	}
	var sums []sumRow
	model.DB.Table("top_ups").Select("user_id, SUM(money) as money").
		Where("status = ?", common.TopUpStatusSuccess).Group("user_id").Scan(&sums)
	paidTotal := 0.0
	for _, item := range sums {
		paidTotal += item.Money
	}

	userPaid, userUsed, userBalance, userTotal := 0.0, 0.0, 0.0, 0.0
	allUsedQuota := 0
	for _, r := range rows {
		allUsedQuota += r.UsedQuota
		if r.Role >= 100 {
			continue // 管理员额度不计入用户汇总
		}
		userUsed += toCNY(float64(r.UsedQuota))
		userBalance += toCNY(float64(r.Quota))
		userTotal += toCNY(float64(r.Quota + r.UsedQuota))
	}

	// 平台消耗 = 全部用户已消耗额度 ÷ 倍率（倍率是官方成本的加成）
	ratio := ratio_setting.GetGroupRatio("default")
	if ratio <= 0 {
		ratio = 1
	}
	upUsed = math.Round(toCNY(float64(allUsedQuota))/ratio*100) / 100
	upToppedUp = math.Round((upBalance+upUsed)*100) / 100

	// 用户实付：按用户分组累加（排除管理员需查 role）
	if paidTotal > 0 {
		var paidRows []struct {
			UserId int     `json:"user_id"`
			Money  float64 `json:"money"`
			Role   int     `json:"role"`
		}
		model.DB.Table("top_ups").
			Select("top_ups.user_id as user_id, SUM(top_ups.money) as money, users.role as role").
			Joins("JOIN users ON users.id = top_ups.user_id").
			Where("top_ups.status = ?", common.TopUpStatusSuccess).
			Group("top_ups.user_id, users.role").
			Scan(&paidRows)
		userPaid = 0
		for _, r := range paidRows {
			if r.Role < 100 {
				userPaid += r.Money
			}
		}
	}

	userGift := math.Round((userTotal-userPaid)*100) / 100
	gross := math.Round((userUsed-upUsed)*100) / 100
	net := math.Round((gross-userGift)*100) / 100

	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{
		"key_masked":     keyMasked,
		"base_url":       baseURL,
		"upstream_topped_up": math.Round(upToppedUp*100) / 100,
		"upstream_snapshot_at": time.Now().Unix(),
		"upstream_balance":   math.Round(upBalance*100) / 100,
		"upstream_used":      upUsed,
		"user_paid":      math.Round(userPaid*100) / 100,
		"user_used":      math.Round(userUsed*100) / 100,
		"user_balance":   math.Round(userBalance*100) / 100,
		"user_gift":      userGift,
		"gross_profit":   gross,
		"net_profit":     net,
	}})
}

// GetPlatformSettings / UpdatePlatformSettings 新用户赠金与消费倍率
func GetPlatformSettings(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{
		"new_user_gift": math.Round(float64(common.QuotaForNewUser)/perYuanQuota()*100) / 100,
		"group_ratio":   ratio_setting.GetGroupRatio("default"),
	}})
}

func UpdatePlatformSettings(c *gin.Context) {
	var req struct {
		NewUserGift *float64 `json:"new_user_gift"`
		GroupRatio  *float64 `json:"group_ratio"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorT(c, "Invalid parameters")
		return
	}
	if req.NewUserGift != nil {
		if *req.NewUserGift < 0 {
			common.ApiErrorT(c, "Invalid parameters")
			return
		}
		quota := int(math.Round(*req.NewUserGift * perYuanQuota()))
		if err := model.UpdateOption("QuotaForNewUser", strconv.Itoa(quota)); err != nil {
			common.ApiError(c, err)
			return
		}
	}
	if req.GroupRatio != nil {
		if *req.GroupRatio <= 0 {
			common.ApiErrorT(c, "Invalid parameters")
			return
		}
		payload, _ := json.Marshal(map[string]float64{"default": *req.GroupRatio})
		if err := model.UpdateOption("GroupRatio", string(payload)); err != nil {
			common.ApiError(c, err)
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": ""})
}
