# 修改日志（CHANGELOG）

本文件按时间顺序记录 CityNote 项目的所有重要变更，时间精确到分钟（依据 git 提交时间 / 文件修改时间，个别为约数）。

---

## 2026-09-09 — [1.1.0] Vue 3 前端重写（提交 `6ef40b7`，22:04 入库）

- `11:02` — `ShopController.java`、`ShopServiceImpl.java`：补充流程注释、清理编译警告。
- `15:56` — `RedisData.java`：清理编译警告。
- `16:22` — `CacheClient.java`：清理编译警告与细节修复。
- `19:20` — `RedisIdWorker.java`：清理泛型/编译警告。
- `20:33` — 新增重构方案文档 `.trae/documents/citynote-web-vue3-rewrite.md`：前端重构范围、关键事实（响应体协议、双拦截器认证链、白名单、点赞 toggle 语义、nginx 代理规则、图片路径协议）与分阶段实施计划。
- `20:35–20:46` — 新增全新前端工程 `web/`（Vue 3 + Vite 5），将旧版 12 个静态多页 HTML（Vue 2 + ElementUI 无构建）重写为 SPA，后端 API 不变：
  - 脚手架：`unplugin-auto-import` / `unplugin-vue-components` 按需引入 Element Plus；dev 代理 `/api → 8081`（rewrite 去前缀，与 nginx 一致）、`/imgs → 8080`。
  - 统一请求层 `utils/request.js`（自动注入 authorization、success===false 统一 toast、401 清登录态跳登录）、Pinia 登录态 `stores/user.js`、路由守卫 `router/index.js`。
  - teal 主色设计 token（`styles/variables.css`）覆盖 Element Plus 变量换肤。
  - 8 个 API 模块、8 个复用组件（AppNavBar、TabBar、BlogCard、WaterfallList、ShopCard、VoucherCard、ImagePreview、EmptyState）、10 个页面。
- `20:53` — `SystemConstants.java`：`IMAGE_UPLOAD_DIR` 由教程作者路径改为本机 nginx 静态目录，图片上传功能恢复可用。
- `20:57` — 修复 `VoucherCard.vue` `btnText` 计算属性内联对象字面量导致的构建语法错误（改对象映射表写法），`npm run build` 通过；首次产出 `web/dist`。
- `21:05` — 新增 `README.md`。
- `21:33` — 修复 `ShopListView.vue`：顶部分类筛选由单行横向滚动（隐藏滚动条、尾部选项被裁切）改为 `flex-wrap` 换行，10 个分类全部可见。
- `21:35` — 修复 `ImagePreview.vue`：宽屏下图片按原始尺寸撑破容器（flex item 默认 `min-width:auto`），补 `min-width:0`。
- `21:42` — 本文件新增「Removed」清单：Vue 3 重写时有意舍弃的旧版功能与元素（详见下方清单）。
- `21:50` — 修复 `VoucherCard.vue` 按钮回归：普通代金券恢复显示"抢购"按钮（禁用占位，与旧版一致，后端无普通券下单接口）；同时为测试在库中新增秒杀券「100元秒杀代金券」（tb_voucher id=10，shop_id=1，库存 100，有效期 09-08 21:52 ~ 09-16 21:52，Redis 同步 `seckill:stock:10`）。浏览器+接口实测：抢购成功返回订单号、重复下单被 Lua 拦截、库存正确扣减。
- `21:57` — 清理测试痕迹（删除测试 token、测试订单，库存重置回 100；秒杀券 id=10 保留供演示）；`web/dist` 重新构建。

### 附：重写时有意舍弃的旧版（hmdp 静态页）功能清单（`21:42` 记录）

除特别标注外均为旧版中的死链或写死假数据（未接入任何后端接口）：

- 首页：顶部搜索栏（"杭州"城市选择 + 商户名/地点搜索框）。
- 店铺列表：「距离/人气/评分」排序栏（后端 `/shop/of/type` 不支持 sortBy，旧版点击实际无效）；搜索图标；分类下拉（由横向 chips 取代）。
- 店铺详情：分享按钮；"必吃榜·好评榜第3名"角标（假数据）；地图导航图标；营业时间"查看详情"；页脚 copyright。写死的"网友评价"区按需求保留。
- 笔记详情：分享按钮；"网友评价（119）"假评论区；图片触摸滑动轮播（由横向缩略条 + 全屏预览取代）。
- 我的：「评价」「粉丝(0)」空占位 Tab（后端无接口）；"杭州"标签；Feed 滚动到顶部刷新（保留触底加载）。
- 他人主页："杭州"标签。
- 资料编辑：「我的积分/会员等级/VIP」假入口行（旧版整页无保存逻辑；新版为真正可提交的表单，以实换虚）。
- 登录：《用户服务协议》《隐私政策》勾选校验；"忘记密码"死链。
- 底部导航：「地图」「消息」无跳转入口，5 项精简为 首页/发布/我的 3 项。
- 未删除说明：左上角返回按钮保留（`AppNavBar`，`history.back()`）；关注、共同关注、点赞排行、签到、秒杀、Feed 滚动分页等真实功能均已迁移。

---

## 2026-09-08 — [1.0.0] 后端基线（黑马点评核心链路）

- `12:20` — 提交 `b4e5ab7 修改配置文件`：项目品牌重命名——包名 `com.hmdp`/`com.dianping` → `com.citynote`（全量，含 import、mapper 扫描、配置）；数据库 `hm-dianping` → `citynote`（`application.yaml` 连接 URL 同步，`21:15`）；应用名 / Maven 坐标改为 `citynote`；品牌文案统一为 CityNote。
- `23:51` — 提交 `5c8dd46 修复bug与警告`。
- 基线能力（随 `340f795` 与上述提交成型）：Spring Boot 2.3.12 + MyBatis-Plus 3.4.3 + Redisson 3.13.6；手机号+验证码登录（Redis token 会话、双拦截器）；店铺 CRUD 与 GEO 附近店铺；缓存穿透/击穿/雪崩与 Cache Aside；秒杀券 Lua 原子预下单 + 双 buffer 库存；Redis Stream 异步下单 + 死信补偿；探店笔记/点赞排行/ZSet Feed/关注/共同关注/Bitmap 签到/HyperLogLog UV；`src/main/resources/db/citynote.sql` 建表与演示数据。

---

## 2026-09-07 — [0.1.0] 项目起点

- `23:39` — 提交 `340f795 first commit`：基于经典学习项目（黑马点评）拉取原始代码，Spring Boot 2.3.12 + Vue 2 静态多页前端（nginx 托管），包名 `com.hmdp`，数据库 `hm-dianping`。
