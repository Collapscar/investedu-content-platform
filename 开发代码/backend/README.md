# 后端工程

技术栈：Spring Boot 3.3、Spring Web、Spring Data JPA、Spring Security、MySQL。

## API

公开接口：

- `GET /api/v1/assets`
- `GET /api/v1/assets/{id}`
- `GET /api/v1/topics`
- `GET /api/v1/topics/{id}`
- `GET /api/v1/search?keyword=...`
- `POST /api/v1/assets/{id}/download`
- `POST /api/v1/topics/{id}/download`

管理员接口：

- `POST /api/v1/admin/assets`
- `PUT /api/v1/admin/assets/{id}`
- `DELETE /api/v1/admin/assets/{id}`
- `POST /api/v1/admin/topics`
- `PUT /api/v1/admin/topics/{id}`
- `DELETE /api/v1/admin/topics/{id}`

下载接口返回素材包或专题包 zip 地址，真实文件从 `storage/covers` 本地目录读取。
