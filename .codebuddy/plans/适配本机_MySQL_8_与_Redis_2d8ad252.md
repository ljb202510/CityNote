---
name: 适配本机 MySQL 8 与 Redis
overview: 将黑马点评项目(hmdianping)的连接配置从课程虚拟机环境切换到本机：升级 MySQL 驱动以兼容本机 MySQL 8.0.43，并将 application.yaml 的数据库/Redis 连接指向本机(127.0.0.1)。
todos:
  - id: upgrade-mysql-driver
    content: 升级 pom.xml 中 mysql-connector-java 版本 5.1.47 为 8.0.23
    status: completed
  - id: update-application-yaml
    content: 修改 application.yaml：驱动类名改 com.mysql.cj.jdbc.Driver、MySQL 密码改 000、Redis host 改 127.0.0.1 并删除 redis.password
    status: completed
  - id: verify-build
    content: 运行 mvn -q -DskipTests compile 验证构建，并核对两文件最终 diff
    status: completed
    dependencies:
      - upgrade-mysql-driver
      - update-application-yaml
---

## 用户需求

让项目能在本机（Windows，JDK8/Maven 3.9）直接运行，包含两处环境适配，仅修改项目文件，数据库脚本由用户自行导入：

1. **适配本机 MySQL 8.0.43**：升级 JDBC 驱动以兼容 MySQL 8（root 密码为本机实际值 `000`）。
2. **适配本机 Redis**：本机已装 Redis 5.0.14.1（Windows 服务 `Redis` 运行中，127.0.0.1:6379 无密码，已确认与项目所用 Stream/消费者组特性兼容），将连接从课程虚拟机 `192.168.150.101` 改到本机。

## 核心改动

- `pom.xml`：`mysql-connector-java` 版本 5.1.47 → 8.0.23
- `application.yaml`：
- `driver-class-name`: `com.mysql.jdbc.Driver` → `com.mysql.cj.jdbc.Driver`
- `spring.datasource.password`: `123` → `000`
- `spring.redis.host`: `192.168.150.101` → `127.0.0.1`
- 删除 `spring.redis.password: 123321`（本机 Redis 无密码）
- 其余配置保持不变

## 技术选型

- 沿用项目现有技术栈：Spring Boot 2.3.12.RELEASE / Java 8 / Maven，不引入任何新框架。
- MySQL 驱动选用 **mysql-connector-java 8.0.23**：即 Spring Boot 2.3.12 父 BOM 官方管理的 8.x 版本，`artifactId` 不变、仅改版本号即可，与当前构建链兼容性最稳。
- Redis 服务端维持本机 5.0.14.1 不变（代码最高只用到 Redis 5.0 引入的 Stream/消费者组），仅调整连接配置。

## 实现要点

1. **pom.xml 最小改动**：仅将 `<version>5.1.47</version>` 改为 `<version>8.0.23</version>`，`artifactId`/`scope`（runtime）保持不变。如后续在意该版本已披露的 CVE，可再显式升至 8.0.33（Maven 可正常解析 relocation），本次不做。
2. **驱动类名必改**：MySQL 8 驱动已移除 `com.mysql.jdbc.Driver`，必须改为 `com.mysql.cj.jdbc.Driver`，否则启动报 `ClassNotFoundException` 级别的驱动加载失败。
3. **URL 保持不动**：现有 `?useSSL=false&serverTimezone=UTC` 已满足 Connector/J 8.x 对 `serverTimezone` 的强制要求，避免非必要变更。
4. **认证兼容性**：MySQL 8 默认 `caching_sha2_password` 认证，Connector/J 8.x 原生支持，无需修改本机用户认证插件。
5. **Redis 无密码直连**：删除 `password` 行后，lettuce 以无认证方式连接 127.0.0.1:6379，与本机服务现状（`redis-cli ping` 返回 PONG）一致。

## 验证方式

- 执行 `mvn -q -DskipTests compile` 验证依赖解析与编译通过（首次需联网下载 8.0.23 驱动）。
- 检查两个文件的最终 diff，确认无多余改动。

## 目录结构

```
CityNote/
├── pom.xml                       # [MODIFY] mysql-connector-java 5.1.47 → 8.0.23
└── src/main/resources/
    └── application.yaml          # [MODIFY] 驱动类名、MySQL 密码 000、Redis host 改 127.0.0.1、删除 redis.password
```

## 数据库导入指引（用户自行执行，不在本次任务内）

`hmdp.sql` 不含建库语句（导出自 `hmdp2` schema），导入前需先建库。命令（cmd）：

```
mysql -uroot -p000 -e "CREATE DATABASE IF NOT EXISTS hmdp DEFAULT CHARACTER SET utf8mb4;"
mysql -uroot -p000 hmdp < src\main\resources\db\hmdp.sql
```