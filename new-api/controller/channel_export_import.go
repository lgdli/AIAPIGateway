package controller

import (
	"bytes"
	"encoding/csv"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"

	"github.com/gin-gonic/gin"
)

func ExportChannels(c *gin.Context) {
	var req dto.ChannelExportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误: " + err.Error()})
		return
	}

	if req.Format != "json" && req.Format != "csv" {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "不支持的平台格式，仅支持 json 或 csv"})
		return
	}

	var channels []*model.Channel
	var err error

	if req.All {
		channels, err = model.GetAllChannels(0, 0, true, false)
	} else if len(req.Ids) > 0 {
		if len(req.Ids) > dto.MaxExportCount {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "单次最多导出 " + strconv.Itoa(dto.MaxExportCount) + " 条渠道",
			})
			return
		}
		channels, err = model.GetChannelsByIds(req.Ids)
	} else {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "请指定要导出的渠道或选择导出全部"})
		return
	}

	if err != nil {
		common.SysError("failed to get channels for export: " + err.Error())
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "获取渠道数据失败"})
		return
	}

	if len(channels) == 0 {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "没有可导出的渠道"})
		return
	}

	exportItems := make([]dto.ChannelExportItem, len(channels))
	for i, ch := range channels {
		exportItems[i] = dto.ChannelExportItem{
			Id:                 ch.Id,
			Type:               ch.Type,
			Key:                ch.Key,
			Name:               ch.Name,
			Status:             ch.Status,
			Weight:             ch.Weight,
			BaseURL:            ch.BaseURL,
			Models:             ch.Models,
			Group:              ch.Group,
			ModelMapping:       ch.ModelMapping,
			Priority:           ch.Priority,
			AutoBan:            ch.AutoBan,
			Tag:                ch.Tag,
			Setting:            ch.Setting,
			ParamOverride:      ch.ParamOverride,
			HeaderOverride:     ch.HeaderOverride,
			TestModel:          ch.TestModel,
			StatusCodeMapping:  ch.StatusCodeMapping,
			Other:              ch.Other,
			OtherSettings:      ch.OtherSettings,
			OpenAIOrganization: ch.OpenAIOrganization,
			Remark:             ch.Remark,
		}
	}

	resp := dto.ChannelExportResponse{
		TotalCount: len(exportItems),
		Warning:    "导出文件包含渠道密钥(Key)，请妥善保管，避免泄露",
	}

	timestamp := time.Now().Format("20060102_150405")

	if req.Format == "json" {
		jsonData, err := common.Marshal(exportItems)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{"success": false, "message": "生成JSON失败"})
			return
		}
		resp.Data = exportItems
		resp.Content = string(jsonData)
		resp.Filename = "channels_export_" + timestamp + ".json"
	} else {
		var csvBuf bytes.Buffer
		csvBuf.Write([]byte{0xEF, 0xBB, 0xBF})

		writer := csv.NewWriter(&csvBuf)
		headers := []string{
			"id", "type", "key", "name", "status", "weight", "base_url",
			"models", "group", "model_mapping", "priority", "auto_ban",
			"tag", "setting", "param_override", "header_override",
			"test_model", "status_code_mapping", "other", "settings",
			"openai_organization", "remark",
		}
		if err := writer.Write(headers); err != nil {
			c.JSON(http.StatusOK, gin.H{"success": false, "message": "生成CSV失败"})
			return
		}

		for _, item := range exportItems {
			record := []string{
				strconv.Itoa(item.Id),
				strconv.Itoa(item.Type),
				item.Key,
				item.Name,
				strconv.Itoa(item.Status),
				ptrToUint(item.Weight),
				ptrToString(item.BaseURL),
				item.Models,
				item.Group,
				ptrToString(item.ModelMapping),
				ptrToInt64(item.Priority),
				ptrToInt(item.AutoBan),
				ptrToString(item.Tag),
				ptrToString(item.Setting),
				ptrToString(item.ParamOverride),
				ptrToString(item.HeaderOverride),
				ptrToString(item.TestModel),
				ptrToString(item.StatusCodeMapping),
				item.Other,
				item.OtherSettings,
				ptrToString(item.OpenAIOrganization),
				ptrToString(item.Remark),
			}
			if err := writer.Write(record); err != nil {
				c.JSON(http.StatusOK, gin.H{"success": false, "message": "生成CSV失败"})
				return
			}
		}
		writer.Flush()
		if writer.Error() != nil {
			c.JSON(http.StatusOK, gin.H{"success": false, "message": "生成CSV失败"})
			return
		}
		resp.Content = csvBuf.String()
		resp.Filename = "channels_export_" + timestamp + ".csv"
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    resp,
	})
}

func ImportChannels(c *gin.Context) {
	strategy := c.PostForm("duplicate_strategy")
	if strategy != "skip" && strategy != "update" && strategy != "create_new" {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "重复处理策略无效，可选值: skip, update, create_new"})
		return
	}

	testConnectivity := c.PostForm("test_connectivity") == "true"
	format := c.PostForm("format")
	if format != "json" && format != "csv" {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "格式无效，仅支持 json 或 csv"})
		return
	}

	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "请上传文件"})
		return
	}
	defer file.Close()

	var items []dto.ChannelExportItem

	if format == "json" {
		content, err := io.ReadAll(file)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{"success": false, "message": "读取文件失败"})
			return
		}
		if err := common.Unmarshal(content, &items); err != nil {
			c.JSON(http.StatusOK, gin.H{"success": false, "message": "JSON解析失败: " + err.Error()})
			return
		}
	} else {
		reader := csv.NewReader(file)
		reader.LazyQuotes = true
		reader.FieldsPerRecord = -1

		records, err := reader.ReadAll()
		if err != nil {
			c.JSON(http.StatusOK, gin.H{"success": false, "message": "CSV解析失败: " + err.Error()})
			return
		}
		if len(records) < 2 {
			c.JSON(http.StatusOK, gin.H{"success": false, "message": "CSV文件为空或缺少表头"})
			return
		}

		for _, record := range records[1:] {
			if len(record) < 22 {
				continue
			}
			items = append(items, dto.ChannelExportItem{
				Type:               safeAtoi(record[1]),
				Key:                record[2],
				Name:               record[3],
				Status:             safeAtoi(record[4]),
				Weight:             stringToPtrUint(record[5]),
				BaseURL:            stringToPtrString(record[6]),
				Models:             record[7],
				Group:              record[8],
				ModelMapping:       stringToPtrString(record[9]),
				Priority:           stringToPtrInt64(record[10]),
				AutoBan:            stringToPtrInt(record[11]),
				Tag:                stringToPtrString(record[12]),
				Setting:            stringToPtrString(record[13]),
				ParamOverride:      stringToPtrString(record[14]),
				HeaderOverride:     stringToPtrString(record[15]),
				TestModel:          stringToPtrString(record[16]),
				StatusCodeMapping:  stringToPtrString(record[17]),
				Other:              record[18],
				OtherSettings:      record[19],
				OpenAIOrganization: stringToPtrString(record[20]),
				Remark:             stringToPtrString(record[21]),
			})
		}
	}

	if len(items) == 0 {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "没有可导入的渠道数据"})
		return
	}
	if len(items) > dto.MaxImportCount {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "单次最多导入 " + strconv.Itoa(dto.MaxImportCount) + " 条渠道",
		})
		return
	}

	resp := dto.ChannelImportResponse{
		Details: make([]dto.ChannelImportDetail, 0),
	}

	var channelsToInsert []model.Channel
	var channelsToUpdate []model.Channel

	for _, item := range items {
		if item.Name == "" || item.Key == "" {
			resp.Failed++
			resp.Details = append(resp.Details, dto.ChannelImportDetail{
				Name:    item.Name,
				Status:  "failed",
				Message: "名称或Key为空",
			})
			continue
		}

		existingByName, _ := model.GetChannelByName(item.Name)
		existingByKey, _ := model.GetChannelByKey(item.Key)
		isDuplicate := (existingByName != nil) || (existingByKey != nil)

		if isDuplicate && strategy == "skip" {
			resp.Skipped++
			resp.Details = append(resp.Details, dto.ChannelImportDetail{
				Name:    item.Name,
				Status:  "skipped",
				Message: "渠道已存在（名称或Key重复）",
			})
			continue
		}

		ch := model.Channel{
			Type:               item.Type,
			Key:                item.Key,
			Name:               item.Name,
			Status:             item.Status,
			Weight:             item.Weight,
			BaseURL:            item.BaseURL,
			Models:             item.Models,
			Group:              item.Group,
			ModelMapping:       item.ModelMapping,
			Priority:           item.Priority,
			AutoBan:            item.AutoBan,
			Tag:                item.Tag,
			Setting:            item.Setting,
			ParamOverride:      item.ParamOverride,
			HeaderOverride:     item.HeaderOverride,
			TestModel:          item.TestModel,
			StatusCodeMapping:  item.StatusCodeMapping,
			Other:              item.Other,
			OtherSettings:      item.OtherSettings,
			OpenAIOrganization: item.OpenAIOrganization,
			Remark:             item.Remark,
			CreatedTime:        common.GetTimestamp(),
		}
		if ch.Group == "" {
			ch.Group = "default"
		}
		if ch.Status == 0 {
			ch.Status = common.ChannelStatusEnabled
		}

		if isDuplicate && strategy == "update" {
			if existingByName != nil {
				ch.Id = existingByName.Id
			} else if existingByKey != nil {
				ch.Id = existingByKey.Id
			}
			channelsToUpdate = append(channelsToUpdate, ch)
		} else {
			ch.Id = 0
			channelsToInsert = append(channelsToInsert, ch)
		}
	}

	for _, ch := range channelsToUpdate {
		if err := ch.Update(); err != nil {
			resp.Failed++
			resp.Details = append(resp.Details, dto.ChannelImportDetail{
				Name:    ch.Name,
				Status:  "failed",
				Message: "更新失败: " + err.Error(),
			})
		} else {
			resp.Updated++
			resp.Details = append(resp.Details, dto.ChannelImportDetail{
				Name:      ch.Name,
				Status:    "updated",
				ChannelId: ch.Id,
			})
		}
	}

	if len(channelsToInsert) > 0 {
		if err := model.BatchInsertChannels(channelsToInsert); err != nil {
			common.SysError("batch insert channels failed: " + err.Error())
			for _, ch := range channelsToInsert {
				resp.Failed++
				resp.Details = append(resp.Details, dto.ChannelImportDetail{
					Name:    ch.Name,
					Status:  "failed",
					Message: "批量插入失败",
				})
			}
		} else {
			for _, ch := range channelsToInsert {
				resp.Success++
				resp.Details = append(resp.Details, dto.ChannelImportDetail{
					Name:      ch.Name,
					Status:    "success",
					ChannelId: ch.Id,
				})
			}
		}
	}

	if testConnectivity && (resp.Success > 0 || resp.Updated > 0) {
		for i, detail := range resp.Details {
			if detail.Status != "success" && detail.Status != "updated" {
				continue
			}
			if detail.ChannelId == 0 {
				continue
			}
			ch, err := model.GetChannelById(detail.ChannelId, true)
			if err != nil {
				continue
			}
			result := testChannel(ch, "", "", false)
			testSuccess := result.localErr == nil && result.newAPIError == nil
			resp.Details[i].TestSuccess = &testSuccess
			if !testSuccess {
				resp.TestFailed++
			}
		}
	}

	model.InitChannelCache()
	service.ResetProxyClientCache()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    resp,
	})
}

func ptrToString(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

func ptrToInt(p *int) string {
	if p == nil {
		return ""
	}
	return strconv.Itoa(*p)
}

func ptrToInt64(p *int64) string {
	if p == nil {
		return ""
	}
	return strconv.FormatInt(*p, 10)
}

func ptrToUint(p *uint) string {
	if p == nil {
		return ""
	}
	return strconv.FormatUint(uint64(*p), 10)
}

func safeAtoi(s string) int {
	v, _ := strconv.Atoi(s)
	return v
}

func stringToPtrString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func stringToPtrInt(s string) *int {
	if s == "" {
		return nil
	}
	v, _ := strconv.Atoi(s)
	return &v
}

func stringToPtrInt64(s string) *int64 {
	if s == "" {
		return nil
	}
	v, _ := strconv.ParseInt(s, 10, 64)
	return &v
}

func stringToPtrUint(s string) *uint {
	if s == "" {
		return nil
	}
	v, _ := strconv.ParseUint(s, 10, 32)
	u := uint(v)
	return &u
}
