package model

import "errors"

// GetEnabledChannelForBalance 取一条启用中的渠道，用于查询上游余额
func GetEnabledChannelForBalance() (*Channel, error) {
	var channel Channel
	err := DB.Where("status = ?", 1).Order("priority desc, id asc").First(&channel).Error
	if err != nil {
		return nil, errors.New("没有启用中的渠道")
	}
	return &channel, nil
}

// PlatformStat 平台累计口径：用当前余额的增量推算累计充值与累计消耗
type PlatformStat struct {
	Id          int     `json:"id" gorm:"primaryKey"`
	LastBalance float64 `json:"last_balance"`
	CumTopUp    float64 `json:"cum_topup"`
	CumUsed     float64 `json:"cum_used"`
	UpdatedAt   int64   `json:"updated_at"`
}

func (PlatformStat) TableName() string { return "platform_stats" }

// RecordPlatformBalance 用最新余额推算累计充值与累计消耗，返回统计快照
func RecordPlatformBalance(balance float64) (*PlatformStat, error) {
	if err := DB.AutoMigrate(&PlatformStat{}); err != nil {
		return nil, err
	}
	stat := PlatformStat{Id: 1}
	err := DB.First(&stat, 1).Error
	if err != nil {
		// 首次记录：把当前余额当作起点，累计充值即当前余额
		stat = PlatformStat{Id: 1, LastBalance: balance, CumTopUp: balance, CumUsed: 0, UpdatedAt: 0}
		if err := DB.Create(&stat).Error; err != nil {
			return nil, err
		}
		return &stat, nil
	}
	delta := balance - stat.LastBalance
	if delta > 0 {
		stat.CumTopUp += delta
	}
	stat.LastBalance = balance
	DB.Model(&stat).Updates(map[string]any{
		"last_balance": stat.LastBalance,
		"cum_topup":    stat.CumTopUp,
		"cum_used":     stat.CumUsed,
	})
	return &stat, nil
}

// AddPlatformCost 记录一笔平台成本（人民币），用于精确统计累计消耗
func AddPlatformCost(costCNY float64) error {
	if costCNY <= 0 {
		return nil
	}
	if err := DB.AutoMigrate(&PlatformStat{}); err != nil {
		return err
	}
	stat := PlatformStat{Id: 1}
	if err := DB.First(&stat, 1).Error; err != nil {
		stat = PlatformStat{Id: 1}
		if err := DB.Create(&stat).Error; err != nil {
			return err
		}
	}
	return DB.Model(&stat).Update("cum_used", stat.CumUsed+costCNY).Error
}
