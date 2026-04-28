package controller

import (
	"net/http"
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

func GetNewsList(c *gin.Context) {
	category := c.Query("category")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "4"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	news, total, err := model.GetNewsList(category, limit, offset)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    news,
		"total":   total,
	})
}

func GetNewsDetail(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	news, err := model.GetNewsById(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "News not found",
		})
		return
	}
	if news.Status != 1 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "News not found",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    news,
	})
}

func GetNewsManageList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	news, total, err := model.GetNewsManageList(page, pageSize)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    news,
		"total":   total,
	})
}

func CreateNews(c *gin.Context) {
	var news model.News
	if err := c.ShouldBindJSON(&news); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.CreateNews(&news); err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Created successfully",
		"data":    gin.H{"id": news.ID},
	})
}

func UpdateNews(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	var news model.News
	if err := c.ShouldBindJSON(&news); err != nil {
		common.ApiError(c, err)
		return
	}
	news.ID = uint(id)
	if err := model.UpdateNews(&news); err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Updated successfully",
	})
}

func DeleteNews(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.DeleteNewsById(uint(id)); err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Deleted successfully",
	})
}
