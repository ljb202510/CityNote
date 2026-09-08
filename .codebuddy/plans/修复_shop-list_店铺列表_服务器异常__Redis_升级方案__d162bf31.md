---
name: 修复 shop-list 店铺列表“服务器异常”（Redis 升级方案）
overview: 定位并修复点击首页“美食”跳转 shop-list.html 时前端弹“服务器异常”的问题。根因：本机 Redis 5.0.14.1 不支持 GEOSEARCH（需 ≥6.2），而 shop-list 请求固定携带经纬度触发后端 GEO 分支导致异常。修复方案：将本机 Redis 升级到 ≥6.2 后重新导入 GEO 数据（代码主逻辑零改动），并附带清理残留 shop 缓存 key、将 /favicon.ico 加入登录拦截器排除路径。
todos:
  - id: fix-favicon
    content: 修改 MvcConfig.java，将 /favicon.ico 加入登录拦截器排除路径，消除 401 噪音
    status: completed
  - id: upgrade-redis
    content: 停止本机 redis 服务，升级 D:\Redis 至 ≥6.2 并重启，验证 GEOSEARCH 命令可用
    status: completed
  - id: seed-geo
    content: 清理确认 cache:shop:* 无残留，运行 loadShopData 测试导入 GEO 数据
    status: completed
    dependencies:
      - upgrade-redis
  - id: verify
    content: 启动后端后用 [skill:playwright-cli] 回归验证美食页、/shop/1、favicon 与首页
    status: completed
    dependencies:
      - fix-favicon
      - upgrade-redis
      - seed-geo
---

## 用户需求

排查并修复“首页点击‘美食’（http://127.0.0.1:8080/shop-list.html?type=1&name=美食）前端弹出‘服务器异常’”的问题，并一并处理用户观察到的两个次要异常。已确认采用“升级本机 Redis 至 ≥6.2（保留后端代码零改动）”的修复方向，附带处理 shop 缓存残留与 favicon 401。

## 产品概述

黑马点评（hmdp）改名 citynote 的课程项目：Spring Boot 后端（8081）+ nginx 静态前端（8080，/api 反代 8081）+ MySQL（citynote 库）+ Redis（127.0.0.1:6379）。

## 核心功能/目标

- 修复美食店铺列表页“服务器异常”：升级本机 Redis 至支持 GEOSEARCH 的版本（≥6.2），并运行 loadShopData 测试为 shop:geo:{typeId} 导入 GEO 数据。
- /shop/{id} 返回完整店铺数据，不再出现 {"success":true,"data":{}}：清理 cache:shop:* 中可能的 RedisData 残留缓存。
- 直接访问 8081 不再出现 /favicon.ico 401：将 /favicon.ico 加入登录拦截器排除路径。
- 回归验证：8080 首页与美食店铺列表页均正常显示。

## 根因与方案概述

点击“美食”后，前端 shop-list.html 固定携带默认坐标（x=120.149993, y=30.334229）请求 /api/shop/of/type；后端 ShopServiceImpl.queryShopByType 因 x/y 非空进入 Redis GEO 分支，调用 opsForGeo().search(...)，向 Redis 下发 GEOSEARCH 命令。本机 Redis 为 Windows 服务版 5.0.14.1（D:\Redis），不支持 Redis 6.2 才引入的 GEOSEARCH（已实测返回 ERR unknown command），抛出 RedisSystemException 后被 WebExceptionAdvice 兜底为 Result.fail("服务器异常")，前端因此弹窗。首页不报错是因为它只调用 /shop-type/list 与 /blog/hot，均不经过 GEO 分支。

## 修复策略

- 主问题走环境修复：停掉现有 redis 服务（数据当前为空，无需迁移），将 D:\Redis 替换/升级为监听 127.0.0.1:6379、无密码的 Redis ≥6.2 实现（Docker 未安装；可选 Memurai，或 redis-windows 7.x 预编译包保持原服务名/端口），业务代码零改动。
- GEO 数据导入：升级后运行测试 CityNoteApplicationTests#loadShopData（按 typeId 分组，对 tb_shop 全量 GEOADD 至 shop:geo:{typeId}）。
- 缓存兜底清理：新 Redis 为空属预防性，确认无 cache:shop:* 残留后由正常请求回填，避免 /shop/{id} 反序列化出空对象。
- 附带修复：MvcConfig.java 的 LoginInterceptor excludePathPatterns 追加 "/favicon.ico"。

## 改动范围

- 后端唯一代码改动：src/main/java/com/citynote/config/MvcConfig.java。
- 环境操作：停止/替换/重启 Redis 服务；运行 GEO 导入测试。
- 不改动主查询逻辑、前端 hmdp 页面与 nginx 配置。

## 验证标准

1. redis-cli INFO server 显示 redis_version ≥ 6.2；COMMAND INFO GEOSEARCH 返回存在。
2. 美食列表页正常显示店铺、无“服务器异常”弹窗；首页回归正常。
3. http://127.0.0.1:8081/shop/1 返回完整店铺数据而非 {}。
4. 直接访问 8081 页面不再出现 /favicon.ico 401。

## Agent Extensions

### Skill

- **playwright-cli**
- Purpose: 自动化打开浏览器验证修复效果——访问美食店铺列表页、8081 直接访问、首页，检查页面内容与错误提示。
- Expected outcome: 确认美食页正常渲染店铺列表、无“服务器异常”弹窗，/shop/1 返回完整数据，favicon 401 消失，首页无回归。