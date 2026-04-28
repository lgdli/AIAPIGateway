package controller

import (
	"net/http"
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/QuantumNous/new-api/model"
	cronsvc "github.com/QuantumNous/new-api/service/cron"
)

func GetAllCronTasks(c *gin.Context) {
	tasks, err := model.GetAllCronTasks()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	var result []gin.H
	for _, task := range tasks {
		lastExec, _ := model.GetLastCronTaskExecution(task.Id)
		item := gin.H{
			"id":              task.Id,
			"name":            task.Name,
			"display_name":    task.DisplayName,
			"description":     task.Description,
			"cron_expression": task.CronExpression,
			"enabled":         task.Enabled,
			"timeout_seconds": task.TimeoutSeconds,
			"created_at":      task.CreatedAt,
			"updated_at":      task.UpdatedAt,
		}
		if lastExec != nil {
			item["last_execution"] = gin.H{
				"status":        lastExec.Status,
				"started_at":    lastExec.StartedAt,
				"finished_at":   lastExec.FinishedAt,
				"duration_ms":   lastExec.DurationMs,
				"result_message": lastExec.ResultMessage,
			}
		}
		result = append(result, item)
	}
	c.JSON(http.StatusOK, result)
}

func GetCronTask(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	task, err := model.GetCronTaskByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}
	c.JSON(http.StatusOK, task)
}

func UpdateCronTask(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var req struct {
		CronExpression string `json:"cron_expression"`
		Enabled        *bool  `json:"enabled"`
		TimeoutSeconds *int   `json:"timeout_seconds"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	task, err := model.GetCronTaskByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}
	updates := make(map[string]interface{})
	if req.CronExpression != "" {
		updates["cron_expression"] = req.CronExpression
		task.CronExpression = req.CronExpression
	}
	if req.Enabled != nil {
		updates["enabled"] = *req.Enabled
		task.Enabled = *req.Enabled
	}
	if req.TimeoutSeconds != nil {
		updates["timeout_seconds"] = *req.TimeoutSeconds
		task.TimeoutSeconds = *req.TimeoutSeconds
	}
	if err := model.UpdateCronTask(id, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if _, ok := updates["enabled"]; ok || updates["cron_expression"] != "" {
		cronsvc.UpdateTask(task)
	}
	c.JSON(http.StatusOK, task)
}

func TriggerCronTask(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := cronsvc.TriggerTask(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "task triggered"})
}

func GetCronTaskExecutions(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	status := c.Query("status")
	offset := (page - 1) * pageSize
	executions, total, err := model.GetCronTaskExecutions(id, offset, pageSize, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data":  executions,
		"total": total,
		"page":  page,
		"page_size": pageSize,
	})
}
