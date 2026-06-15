# 金融投教内容资产平台开发代码

本目录包含前后端分离工程：

- `frontend/`: Vite + React + TypeScript 前端，基于 Figma 导出代码迁移。
- `backend/`: Java Spring Boot + Maven 后端，提供 `/api/v1` REST API。

## 本地启动

后端需要 Java 17、Maven 和 MySQL 8.x。

```bash
cd backend
mvn spring-boot:run
```

默认数据库连接：

```text
jdbc:mysql://localhost:3306/investedu_content
username: root
password:
```

可用环境变量覆盖：

```bash
DB_URL=jdbc:mysql://localhost:3306/investedu_content
DB_USERNAME=root
DB_PASSWORD=your_password
CONTENT_STORAGE_ROOT=storage
```

前端启动：

```bash
cd frontend
npm install
npm run dev
```

Vite 已配置 `/api` 代理到 `http://localhost:8080`。

如果当前机器没有 Java/Maven，仍然可以先用本地预览服务查看完整页面和下载 zip 包：

```bash
cd 开发代码
node scripts/preview-server.mjs
```

## 权限说明

管理员接口位于 `/api/v1/admin/**`，开发版用请求头控制：

```text
X-Role: admin
```

前端管理员工作台请求会自动带上该请求头；客户经理端不带该请求头，不能访问管理员接口。
