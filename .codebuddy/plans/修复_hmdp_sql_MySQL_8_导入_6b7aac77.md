---
name: 修复 hmdp.sql MySQL 8 导入
overview: 修复 hmdp.sql 在 MySQL 8 下导入报 ERROR 1067 的问题：tb_seckill_voucher 表的 begin_time/end_time 使用了零日期默认值 '0000-00-00 00:00:00'（仅 MySQL 5.x 宽松模式允许），需改为 MySQL 8 合法且语义一致的默认值。
todos:
  - id: fix-sql-zero-date
    content: 修改 hmdp.sql 第 92/93 行：begin_time/end_time 去掉 NOT NULL 并改为 DEFAULT NULL
    status: completed
  - id: verify-reimport
    content: 重跑 mysql 导入命令验证无报错，并用 show tables 确认表结构与数据完整
    status: completed
    dependencies:
      - fix-sql-zero-date
---

## 用户需求

用户在本机 MySQL 8.0.43 上自行导入 `src/main/resources/db/hmdp.sql` 失败，报错：
`ERROR 1067 (42000) at line 88: Invalid default value for 'begin_time'`。

根因：`hmdp.sql` 为 MySQL 5.6（Navicat）导出，其中 `tb_seckill_voucher` 表的 `begin_time` / `end_time` 两列使用 `timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'`；MySQL 8 默认 `sql_mode` 含 `NO_ZERO_DATE`，禁止零日期作为默认值，导致建表失败。`hmdp` 库已创建成功，失败点发生在建表阶段。

## 目标

- 修复 `hmdp.sql`，使其能在 MySQL 8 默认 `sql_mode` 下完整导入成功；
- 不改变业务行为（代码中唯一写入 `tb_seckill_voucher` 的 `VoucherServiceImpl.addSeckillVoucher` 总会显式 setBeginTime/setEndTime，不依赖 DB 默认值）；
- 仅做最小改动，不影响项目其余部分。

## 技术方案

### 修改内容

文件：`src/main/resources/db/hmdp.sql`（仅第 92、93 两行，`tb_seckill_voucher` 建表语句内）

将两列默认值从零日期改为 MySQL 8 允许的 NULL 化写法（推荐方案）：

- 第 92 行：`\`begin_time\` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' COMMENT '生效时间',` → `\`begin_time\` timestamp NULL DEFAULT NULL COMMENT '生效时间',`
- 第 93 行：`\`end_time\` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' COMMENT '失效时间',` → `\`end_time\` timestamp NULL DEFAULT NULL COMMENT '失效时间',`

### 方案取舍

- 用 NULL 表达"未设置"，与实体 `SeckillVoucher.beginTime/endTime`（`LocalDateTime` 可空）语义一致；
- 备选方案（若用户希望保留 NOT NULL 约束）：改为 `timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP`，语义为"漏传时取当前时间"——不作为默认执行项，仅记录备选；
- 不采用修改 sql_mode 的方案：需每次导入附加参数，且无法让 SQL 文件在其它 MySQL 8 环境开箱即用；
- 不采用零日期替代字面量（如 `'1970-01-01 00:00:00'`）：TIMESTAMP 类型受时区/下界影响，存在再次报 `Invalid default value` 的风险。

### 边界与安全

- 全文件 grep 确认零日期默认值仅此两处，无其它 5.x 专属语法问题（其余建表语句已兼容 MySQL 8）；
- SQL 文件自带 `DROP TABLE IF EXISTS`，幂等可重复执行；本次失败前已建的表会被重建，无残留影响；
- 本次仅修改 SQL 初始化文件，不涉及 Java 代码、pom、yaml。

### 验证方式

1. 修改完成后执行：`mysql -uroot -p000 hmdp < src\main\resources\db\hmdp.sql`，应无报错（退出码 0）；
2. 验证：`mysql -uroot -p000 hmdp -e "show tables; select count(*) from tb_voucher;"` 确认各表已建且数据已导入。