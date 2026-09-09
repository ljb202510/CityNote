# CityNote 城市笔记

一个基于 **Spring Boot + Redis** 的本地生活点评平台（类大众点评），涵盖店铺浏览、探店笔记、优惠券秒杀、关注 Feed 流、签到等完整业务链路。项目以 Redis 高性能与一致性方案为核心亮点，并配套一个全新重写的 **Vue 3 + Vite** 移动端前端。

> 本项目基于经典学习项目重构而来：完成了包名/数据库/品牌重命名（`com.citynote` / `citynote`），并用 Vue 3 技术栈从零重写了整个前端（`web/`），后端 API 保持不变。

## 技术栈

### 后端

| 技术 | 版本 | 用途 |
|---|---|---|
| Java | 1.8 | 语言 |
| Spring Boot | 2.3.12.RELEASE | 应用框架 |
| MySQL | 8.x（驱动 8.0.23） | 主数据库，库名 `citynote` |
| Redis | 5.x+ | 缓存 / 分布式锁 / Stream / GEO / Bitmap / HyperLogLog |
| MyBatis-Plus | 3.4.3 | ORM 与分页 |
| Redisson | 3.13.6 | 分布式锁 / 信号量 / 可重入锁 |
| Hutool | 5.7.17 | 工具库 |
| Lettuce | 6.1.6（spring-data-redis 2.6.2） | Redis 客户端 |

### 前端（`web/`）

| 技术 | 版本 | 用途 |
|---|---|---|
| Vue | 3.5 | 框架（`<script setup>` 组合式 API） |
| Vite | 5.x | 构建与 dev 代理 |
| Element Plus | 2.x | 组件库（按需引入） |
| vue-router | 4 | SPA 路由 + 登录守卫 |
| Pinia | 2 | 登录态管理（token 持久化） |
| axios | 1.x | 统一请求层（Result 解包 / 401 处理） |

## 功能与核心实现

### 业务功能

- **用户模块**：手机号 + 验证码登录（未注册自动建档）、基于 Redis 的 token 会话（`login:token:{uuid}` Hash 存储 + 滑动续期）、双拦截器（`RefreshTokenInterceptor` 全路径刷新 + `LoginInterceptor` 白名单放行）
- **店铺模块**：店铺 CRUD、按类型分页查询、**GEO 附近店铺搜索**（`GEOADD` + `GEORADIUS BYDISTANCE COUNT` 分页）
- **优惠券模块**：普通代金券、秒杀券（库存、起止时间）、**Lua 脚本原子预下单**（`seckill.lua`：一人一单校验 + 库存扣减 + 订单入队，全程 Redis 内完成）
- **订单模块**：**Redis Stream 异步下单**（消费者组程序化创建、手动 ACK 防 pending 堆积、失败消息转入 `stream.orders:fail` 死信队列 + 定时补偿任务）
- **笔记模块**：发布探店笔记（图片上传按 UUID hash 分桶存储）、点赞（Redis ZSet 存点赞排行，展示 Top5）、**基于 ZSet 的滚动分页 Feed 流**（关注用户发笔记时推送到粉丝收件箱 `feed:{userId}`）
- **关注模块**：关注/取关（共同关注用 Set 交集 `SDIFF` 优化）、双向关注判断
- **签到模块**：**Redis Bitmap 连续签到**（`SETBIT` + `BITFIELD` 一次读取统计连续天数）
- **UV 统计**：HyperLogLog 独立访客统计（测试用例见 `CityNoteApplicationTests.testHyperLogLog`）

### 缓存三大问题解决方案（`utils/CacheClient.java`）

| 问题 | 方案 |
|---|---|
| 缓存穿透 | 空值缓存（短 TTL） |
| 缓存击穿 | 互斥锁（`SETNX` + Lua 安全释放）与**逻辑过期**双方案，`queryById` 中可切换 |
| 缓存雪崩 | 过期时间加随机偏移 |
| 缓存一致性 | 更新走"删除缓存而非更新缓存"（Cache Aside） |
| 热点券库存 | **双 buffer 一致性**：`stock:seckillVoucher:{id}:1/2` 交替写 + active 标记切换 |

### 全局 ID 生成器（`utils/RedisIdWorker.java`）

`时间戳差值(31bit) << 32 | Redis INCR 序列号(32bit)`，单机每秒 42 亿不重复，见压测用例 `testIdWorker`（300 线程 × 100 次）。

## 目录结构

```
CityNote/
├── src/main/java/com/citynote/
│   ├── config/        # MVC 拦截器、MyBatis-Plus 分页、Redisson、全局异常
│   ├── controller/    # 9 个 REST 控制器
│   ├── service/       # 业务接口与实现（秒杀/缓存/Feed 流核心逻辑）
│   ├── entity/mapper/ # MyBatis-Plus 实体与 Mapper
│   ├── dto/           # Result、UserDTO、滚动分页 ScrollResult
│   └── utils/         # CacheClient、RedisIdWorker、RedissonLock、拦截器
├── src/main/resources/
│   ├── application.yaml
│   ├── db/citynote.sql    # 建库建表 + 演示数据
│   ├── seckill.lua        # 秒杀原子预下单脚本
│   └── unlock.lua         # 分布式锁安全释放脚本
├── src/test/...           # ID 生成器压测、缓存、GEO、HyperLogLog 用例
└── web/                   # Vue 3 + Vite 前端（独立工程）
    └── src/
        ├── api/           # 按后端模块拆分的 8 个接口层
        ├── components/    # 瀑布流、笔记卡片、优惠券卡片等 8 个复用组件
        ├── router/        # 路由 + requiresAuth 守卫
        ├── stores/        # Pinia 登录态
        ├── utils/         # axios 封装、图片路径解析
        ├── styles/        # 设计 token（teal 主色，覆盖 Element Plus 变量换肤）
        └── views/         # 10 个页面：登录×2/首页/店铺×2/笔记×2/个人页×2/他人主页
```

## 快速开始

### 环境要求

- JDK 1.8、Maven 3.6+
- MySQL 8.x（默认 `127.0.0.1:3306`，root）
- Redis 5.x+（默认 `127.0.0.1:6379`，无密码）
- Node.js ≥ 18（前端）
- nginx（可选：托管旧静态图片目录 `html/hmdp/imgs`）

### 1. 初始化数据库

```sql
-- 创建库并导入表结构与演示数据
CREATE DATABASE citynote;
-- 导入 src/main/resources/db/citynote.sql
```

如 MySQL 账号密码不同，修改 `src/main/resources/application.yaml` 中的 `username/password`。

### 2. 启动后端

```powershell
mvn spring-boot:run
# 或在 IDE 中直接运行 CityNoteApplication.java
```

服务运行于 `http://localhost:8081`。

### 3. 启动前端

```powershell
cd web
npm install
npm run dev
```

访问 `http://localhost:5173/citynote/`。Vite dev 已配置代理：`/api → 8081`（自动去掉 `/api` 前缀，与 nginx 行为一致）、`/imgs → 8080`（旧图片静态资源）。

### 4.（可选）启动 nginx 提供图片

保持 `C:\...\nginx-1.18.0\nginx-1.18.0` 运行（监听 8080），其 `html/hmdp/imgs` 目录同时作为历史图片存储与上传目标目录（对应 `SystemConstants.IMAGE_UPLOAD_DIR`）。

### 5. 登录说明

短信服务未接入：**验证码打印在后端控制台日志**（`发送短信验证码成功，验证码：xxxxxx`），有效期 2 分钟。未注册手机号自动创建账号。

## API 概览

统一响应体 `{ success, errorMsg, data, total }`；需登录接口在请求头携带 `authorization: {token}`。

| 模块 | 前缀 | 说明 |
|---|---|---|
| 用户 | `/user` | code / login / logout / me / info / sign / sign/count |
| 店铺 | `/shop` | CRUD、`/of/type`（支持 GEO）、`/of/name` |
| 店铺类型 | `/shop-type` | list |
| 笔记 | `/blog` | 发布、hot、详情、likes、of/me、of/follow、of/user、like |
| 优惠券 | `/voucher` | list/{shopId}、新增普通券/秒杀券 |
| 秒杀订单 | `/voucher-order` | seckill/{id} |
| 关注 | `/follow` | 关注/取关、是否关注、共同关注 |
| 上传 | `/upload` | blog 图片上传/删除 |

## 已知限制

- 登出接口后端为 TODO，前端已做本地登出兜底（清 token + 跳登录页）
- 密码登录页仅为表单演示，后端不校验 password 字段
- 演示数据中 `tb_seckill_voucher` 无库存记录，秒杀链路需先通过 `/voucher/seckill` 建券
- 店铺详情页"网友评价"区为演示假数据（后端未实现评价接口）

## 相关文档

- 变更历史见 [CHANGELOG.md](./CHANGELOG.md)
- 前端重构方案与部署切换说明见 `.trae/documents/citynote-web-vue3-rewrite.md`
