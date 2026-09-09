# CityNote 前端重构：Vue 3 + Vite 重写（web/ 子目录）

## Context（为什么做这件事）

当前前端是黑马点评原样交付的静态多页应用，位于 `C:\Users\27710\Desktop\v3\nginx-1.18.0\nginx-1.18.0\html\hmdp`：12 个独立 HTML，用 `<script>` 全局引入 Vue 2 + ElementUI + axios，无构建工具、无组件化、无路由，页面逻辑全部内联，跨页重复严重（每页重复引 4 个 js、滚动加载/点赞逻辑抄三遍），`common.js` 里 `formatPrice` 还有明显 bug，且 branding 仍是"黑马点评/hmdp.com"。

后端（Spring Boot 2.3.12，127.0.0.1:8081）的接口是完整的，本次**只重写前端、不改后端 API**。目标是在 `CityNote/web/` 建立 Vue 3 + Vite 单页应用，组件化复用、统一请求层与登录态管理，并**重做视觉设计**，让项目从"跟着教程抄的"变成"自己做过全栈改造的"。

预期产出：`web/` 下可 `npm run dev` 直接联调 8081 后端的完整前端，覆盖旧站全部功能页面，视觉风格与美团橙红彻底区分。

## 用户已确认的范围

- 方案：Vue 3 + Vite + Element Plus + vue-router 4 + Pinia（**不是**轻量整理，不是 React）
- 位置：`CityNote/web/` 子目录（monorepo，与后端同仓库）
- UI：**顺便重做视觉设计**（不复刻旧版样式）
- 保留密码登录页（`login2.html` 对应）
- 保留店铺详情页写死的假数据评价区
- 功能范围保持旧版，**不新增签到页**（已核实旧 `info.html` 只调用 `/user/me`、`/user/info/{id}`、`/user/logout`，不调用 `/user/sign`）

## 关键事实（已探明，实现时直接依赖）

| 项 | 结论 |
|---|---|
| 响应体 | `com.citynote.dto.Result` = `{success, errorMsg, data, total}`，分页接口用 `total` |
| 认证 | token 放请求头 `authorization`；`RefreshTokenInterceptor` 拦 `/**`（order 0）从 Redis `login:token:{token}` 取用户并续期；`LoginInterceptor`（order 1）拦非白名单路径，未登录返回 **HTTP 401** |
| 白名单 | `/shop/**`, `/voucher/**`, `/shop-type/**`, `/upload/**`, `/blog/hot`, `/user/code`, `/user/login`, `/favicon.ico` |
| 点赞 | `PUT /blog/like/{id}` 是 **toggle 语义**（已核实 [BlogServiceImpl.java](file:///c:/Users/27710/Desktop/v3/CityNote/src/main/java/com/citynote/service/impl/BlogServiceImpl.java#L98-L118)，已赞则 `liked-1` 并从 ZSet 移除），封装成 `toggleLike(id)` 而非 like/unlike 两个函数 |
| nginx | 监听 8080，`root html/hmdp`，`location /api` 用 `rewrite /api(/.*) $1 break` 反代 8081 —— **后端无 context-path**，故 Vite proxy 也必须 rewrite 掉 `/api` |
| 图片 | 上传接口返回 `/blogs/{d1}/{d2}/{uuid}.jpg` 相对路径，实际文件在 nginx 静态根下的 `imgs/` 里，前端需拼 `/imgs` 前缀访问 |

## 目录结构

```
CityNote/web/
├── index.html
├── vite.config.js
├── package.json / .gitignore
├── public/favicon.ico
└── src/
    ├── main.js
    ├── App.vue
    ├── api/            user.js shop.js shopType.js blog.js voucher.js voucherOrder.js follow.js upload.js
    ├── router/index.js 路由表 + requiresAuth 全局前置守卫
    ├── stores/user.js  token + userInfo（唯一 store，token 持久化 localStorage）
    ├── utils/          request.js（axios 实例）、img.js（resolveImg 路径转换）
    ├── styles/         variables.css（设计 token）、base.css（reset + 容器 + 原子类）
    ├── components/     AppNavBar TabBar BlogCard WaterfallList ShopCard VoucherCard ImagePreview EmptyState
    └── views/          HomeView LoginView LoginPasswordView ShopListView ShopDetailView
                        BlogDetailView BlogEditView ProfileView ProfileEditView OtherInfoView
```

## 实施步骤

### Phase 0 — 脚手架
在 `CityNote` 根目录执行 `npm create vite@latest web -- --template vue`，再 `npm i vue-router pinia axios element-plus`、`npm i -D unplugin-vue-components unplugin-auto-import`。配置 `vite.config.js`：`vue()` + `AutoImport/Components({resolvers:[ElementPlusResolver()]})` 实现 Element Plus 按需引入；`server.proxy` 配 `/api → http://127.0.0.1:8081`（带 `rewrite: p => p.replace(/^\/api/, '')`）和 `/imgs → http://127.0.0.1:8080`（零拷贝复用旧图）。写入 `styles/variables.css` 与 `base.css`。

**验证**：`npm run dev` 打开 5173 能渲染；改 `--cn-primary` 后按钮颜色跟着变（证明 token 生效）。

### Phase 1 — 基础设施 + 登录
- `utils/request.js`：`baseURL:'/api'`；请求拦截注入 `authorization`；响应拦截——`success===true` 时 resolve **整个 Result**（保留 `total` 供分页），`success===false` 时统一 `ElMessage.error(errorMsg)` 并 reject，HTTP 401 时清 token/user 并 `router.replace('/login?redirect=' + fullPath)`，网络/5xx 统一提示。
- `utils/img.js`：`resolveImg(path)` —— 绝对 URL 原样返回，`/blogs/...` 拼 `/imgs` 前缀，空值回退 `/imgs/icons/default-icon.png`。
- `stores/user.js`、`api/` 全部 8 个文件、`LoginView.vue`、`LoginPasswordView.vue`、`router/index.js` 含守卫。
- 注意 `sendCode` 的 phone 是 **query 参数**（`/user/code?phone=`），不是 body。

**验证**：后端+Redis+MySQL 起，日志抄验证码登录成功 → localStorage 有 token → 跳首页；手动删 Redis 中该 token 后访问需登录页 → 401 → 自动跳登录且带 redirect。

### Phase 2 — 核心页面（笔记主链路）
`HomeView`（类型宫格 `/shop-type/list` + 瀑布流 `/blog/hot?current=` 滚动加载 + 点赞）、`BlogDetailView`（`/blog/{id}` + 图片预览 + `toggleLike` + `/blog/likes/{id}` + 关注作者 + 关联店铺）、`ProfileView`（我的 `/blog/of/me?max=&offset=&count=` 与关注 `/blog/of/follow` 两个 tab 的 cursor 分页 + 登出）。同时抽出 `BlogCard / WaterfallList / TabBar / AppNavBar / EmptyState / ImagePreview` —— 这三个页面共用，是旧版重复最严重的逻辑。

`WaterfallList` 用 `IntersectionObserver` 做触底加载，同时兼容"页码分页（current）"和"游标分页（max/offset/count）"两种 fetcher。

**验证**：首页首屏有数据、滚动续加载页码递增；未登录点进详情 → 401 → 登录 → 回到该详情页；点赞一次计数 +1、再点一次 -1（toggle 生效）；"我的"tab 能连续加载到"没有更多"。

### Phase 3 — 次要页面
- `ShopListView`：`/shop/of/type` 支持 `typeId/current/name/maxPrice/minPrice/x/y`，坐标沿用旧版写死值；筛选与排序切换。
- `ShopDetailView`：`/shop/{id}` + `/voucher/list/{shopId}` + `VoucherCard` + `POST /voucher-order/seckill/{id}`，评价区按旧版保留写死假数据。
- `BlogEditView`：`POST /upload/blog`（FormData field 名必须是 `file`）+ `GET /upload/blog/delete?name=` + `/shop/of/name?name=` 搜索关联 + `POST /blog`。
- `ProfileEditView`、`OtherInfoView`（`/user/{id}`、`/user/info/{id}`、`/follow/or/not/{id}`、`/follow/common/{id}`、`PUT /follow/{id}/{isFollow}`）。

**验证**：见下方端到端清单第 5–10 条。

### Phase 4 — 视觉打磨与构建自检
路由过渡、卡片按压缩放、列表骨架屏/loading、真机尺寸（375×667）检查、`npm run build` 无报错。

## 设计系统（重做视觉，区别于美团橙红）

- 主色 `--cn-primary: #0F766E`（teal-700），hover `#0D9488`，浅底 `#CCFBF1`；强调色珊瑚橙 `--cn-accent: #F97316` **仅小面积**用于点赞数与秒杀按钮
- 中性色：文本 `#111827 / #4B5563 / #9CA3AF`，页面底色 `#F7F6F3`（暖灰纸感），卡片 `#FFFFFF`
- 圆角：卡片 14px、按钮/图片 10px、头像圆形；阴影极轻 `0 1px 3px rgb(17 24 39 / 6%)`
- 间距 4px 栅格：`--cn-space-1..6 = 4/8/12/16/24/32`，页面左右安全边距 16px
- 移动端适配：不做 rem/vw；`#app{max-width:480px;margin:0 auto;min-height:100dvh}`，TabBar `position:fixed` + `left:50%;transform:translateX(-50%);max-width:480px`
- Element Plus 换肤：在 `variables.css` 里重定义 `--el-color-primary` 及其 light-3/5/8/9、dark-2，组件自动跟随，不改组件源码

## 必须先修的环境问题（阻塞发布笔记链路）

[SystemConstants.java](file:///c:/Users/27710/Desktop/v3/CityNote/src/main/java/com/citynote/utils/SystemConstants.java#L4) 中 `IMAGE_UPLOAD_DIR = "D:\\lesson\\nginx-1.18.0\\html\\citynote\\imgs\\"`，已实测该路径在本机**不存在**（`Test-Path` 返回 False），上传必然抛 IO 异常。这是环境配置错误而非 API 变更，需改为与 nginx root 对齐的实际路径：

```
C:\\Users\\27710\\Desktop\\v3\\nginx-1.18.0\\nginx-1.18.0\\html\\hmdp\\imgs\\
```

前端侧 `resolveImg` 已能兼容访问，但**写入目录必须后端改**，否则 Phase 3 的 `BlogEditView` 无法验证。

## 其他数据/后端现状的前端应对（不改后端）

| 问题 | 应对 |
|---|---|
| `tb_seckill_voucher` 无数据，秒杀必失败 | 按钮保留，直接展示后端 `errorMsg`，不 mock、不写特殊分支；验证清单标记为"预期失败路径" |
| `/voucher/list/{shopId}` 受双 buffer 缓存影响可能返回空 | 渲染"暂无优惠券"空态即可 |
| 密码登录页：后端 `login` 只校验 phone+code，`password` 字段被完全忽略 | 页面保留 phone+code+password 三项，password 收集但不生效；文案不承诺密码安全语义，标注为演示用 |
| `/user/logout` 后端是 TODO 恒返回 fail | 走本地登出：`logout().catch(()=>{}).finally(清 token/userInfo/localStorage → 跳登录页)`，后端补实现后前端无需改动 |

## 端到端验证

启动：MySQL + Redis 就绪 → `mvn spring-boot:run`（8081）→ 起 nginx（8080，供 `/imgs`）→ `cd web && npm run dev`（5173），浏览器手机模式 375×667。

10 条关键路径：① 验证码登录（日志抄码）② 密码登录页同样可通 ③ 首页宫格 + 瀑布流触底翻页 ④ 未登录进详情 → 401 → 登录 → redirect 回原页 ⑤ 详情多图预览 + 点赞 toggle + 关注作者 ⑥ 详情跳店铺 → 店铺信息/优惠券/写死评价区/秒杀（预期 toast 失败）⑦ 店铺列表按类型进入 + 价格区间与排序 + 分页 ⑧ 发布笔记：上传→删图→搜索关联店铺→提交→首页与个人页可见 ⑨ 个人页我的/关注 tab 游标分页 + 编辑资料后全局头像刷新 ⑩ 他人主页关注/共同关注 + 登出后 token 清空跳登录。

## 回退与上线

旧前端 `html/hmdp` 与后端代码全程不动，新旧并行（旧 :8080 / 新 :5173），随时可回。最终上线推荐 **nginx 托管**：`npm run build` → 产物拷到 `html/citynote/` → `vite.config.js` 配 `base: '/citynote/'`、router 用 `createWebHistory(import.meta.env.BASE_URL)` → nginx.conf 加 `location /citynote { try_files $uri $uri/ /citynote/index.html; }`（History 路由必须配 try_files，否则刷新 404）→ `nginx -s reload`。回滚即改回原 root。

不推荐用后端 `static/` 托管：会丢掉 nginx 的 `/imgs` 静态能力，需连图片目录一起迁移，改动面大。

## Critical Files

- `web/vite.config.js` —— proxy rewrite 与 base，决定 dev/prod 行为是否一致
- `web/src/utils/request.js` —— Result 解包 + authorization 注入 + 401 跳登录
- `web/src/router/index.js` —— 路由表 + requiresAuth 守卫
- `web/src/utils/img.js` —— 图片路径转换（对应环境问题）
- `web/src/components/WaterfallList.vue` —— 三种分页方式复用的触底加载容器
- `src/main/java/com/citynote/utils/SystemConstants.java` —— 需修正 `IMAGE_UPLOAD_DIR`
