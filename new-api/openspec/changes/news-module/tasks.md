## 1. 后端数据模型

- [ ] 1.1 创建 model/news.go - News 数据模型
- [ ] 1.2 修改 model/main.go - AutoMigrate 添加 &News{}

## 2. 后端 API

- [ ] 2.1 创建 controller/news.go - GetNewsList (公开)
- [ ] 2.2 创建 controller/news.go - GetNewsDetail (公开)
- [ ] 2.3 创建 controller/news.go - ManageNewsList (管理)
- [ ] 2.4 创建 controller/news.go - CreateNews (管理)
- [ ] 2.5 创建 controller/news.go - UpdateNews (管理)
- [ ] 2.6 创建 controller/news.go - DeleteNews (管理)
- [ ] 2.7 修改 router/api-router.go - 注册 news 路由

## 3. 前端首页

- [ ] 3.1 创建 web/src/components/home/NewsSection.jsx - 新闻卡片组件
- [ ] 3.2 修改 web/src/pages/Home/index.jsx - 引入 NewsSection

## 4. 前端详情页

- [ ] 4.1 创建 web/src/pages/News/Detail.jsx - 新闻详情页
- [ ] 4.2 修改路由配置 - 添加 /news/:id 路由

## 5. 前端管理后台

- [ ] 5.1 创建 web/src/pages/Setting/Dashboard/SettingsNews.jsx - 新闻管理页面
- [ ] 5.2 添加到控制台设置导航

## 6. 构建和测试

- [ ] 6.1 运行 go build 验证后端编译
- [ ] 6.2 运行 npm run build 验证前端编译
- [ ] 6.3 测试首页新闻展示
- [ ] 6.4 测试新闻详情页
- [ ] 6.5 测试管理后台 CRUD
