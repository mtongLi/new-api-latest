package controller

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

const avatarDir = "./data/avatars"

// UploadAvatar 当前用户上传头像，保存到 data/avatars 并写入 users.avatar
func UploadAvatar(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		common.ApiErrorT(c, "请选择图片")
		return
	}
	if file.Size > 2<<20 {
		common.ApiErrorT(c, "图片不能超过 2MB")
		return
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	switch ext {
	case ".png", ".jpg", ".jpeg", ".webp", ".gif":
	default:
		common.ApiErrorT(c, "只支持 png/jpg/webp/gif")
		return
	}
	if err := os.MkdirAll(avatarDir, 0o755); err != nil {
		common.ApiError(c, err)
		return
	}

	userId := c.GetInt("id")
	name := fmt.Sprintf("%d-%d%s", userId, time.Now().Unix(), ext)
	full := filepath.Join(avatarDir, name)
	if err := c.SaveUploadedFile(file, full); err != nil {
		common.ApiError(c, err)
		return
	}

	urlPath := "/avatars/" + name
	if err := model.DB.Model(&model.User{}).Where("id = ?", userId).
		Update("avatar", urlPath).Error; err != nil {
		common.ApiError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "", "data": gin.H{"avatar": urlPath}})
}
