# MySQL 手动搭建与数据库管理工具教程

适用于 Windows 11 + 本项目 `backend/`。完成后你将能够：

- 在本机安装并启动 MySQL 8
- 创建本项目使用的数据库和账号
- 让 NestJS + Prisma 连接数据库并写入演示数据
- 启动前后端并登录系统
- 使用图形化工具查询、修改数据，并在同一个软件里管理多个数据库连接

> 本教程以 **MySQL 8.0** 为主。项目已在 MySQL 8.0.28 上完成迁移、种子和 API 联调。
> 如果你安装的是 MySQL 8.4，大部分步骤相同，结尾有兼容性说明。

---

## 一、安装 MySQL 8.0

### 1. 下载 MySQL Installer

打开官方下载页：

- https://dev.mysql.com/downloads/installer/

推荐下载 **MySQL Installer for Windows** 的离线安装包（文件较大，但更稳定）。
如果下载页只提供最新版，可到归档页下载 8.0 版本：

- https://downloads.mysql.com/archives/community/

选择：

- Product Version: `8.0.x`
- Operating System: `Microsoft Windows`
- 下载 `mysql-installer-community-8.0.xx.msi`

### 2. 运行安装程序

1. 双击 MSI 安装包。
2. Setup Type 选择 **Custom** 或 **Server only**。
3. 将 **MySQL Server 8.0** 加入待安装列表。
   - 如果希望安装官方图形工具，也可以加入 MySQL Workbench；本项目推荐使用 DBeaver，可以不装 Workbench。
4. 点击 **Execute** 开始安装。
5. 等待安装完成，进入 **Configuration**。

### 3. 配置 MySQL Server

按下面选项配置：

| 配置项 | 建议值 |
| --- | --- |
| Config Type | Development Computer |
| Connectivity | TCP/IP |
| Port | `3306` |
| X Protocol Port | 默认 `33060` |
| Authentication Method | Use Strong Password Encryption |
| Root Password | 自行设置并保存好 |
| Windows Service Name | `MySQL80`（默认） |
| Start MySQL Server at System Startup | 勾选 |
| Run Windows Service as | 默认即可 |

点击 **Execute** 完成初始化。

> **认证方式说明**
> 推荐使用 MySQL 8 的强密码加密（`caching_sha2_password`）。Prisma 支持该方式。
> 如果后面连接时遇到认证插件兼容问题，本教程“常见问题”章节提供了兼容方案。

### 4. 检查 MySQL 是否已启动

打开 PowerShell：

```powershell
Get-Service *MySQL*
```

应看到类似：

```text
Status   Name      DisplayName
------   ----      -----------
Running  MySQL80   MySQL Server 8.0
```

如果状态不是 `Running`，请在“以管理员身份运行”的 PowerShell 中启动：

```powershell
Start-Service MySQL80
```

检查端口：

```powershell
Test-NetConnection 127.0.0.1 -Port 3306
```

`TcpTestSucceeded` 应为 `True`。

### 5. 将 MySQL 加入 PATH（可选但推荐）

默认安装目录：

```text
C:\Program Files\MySQL\MySQL Server 8.0\bin
```

如果命令行提示“无法将 mysql 项识别为 cmdlet”，有两种处理：

**方式 A：使用完整路径**

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

**方式 B：加入系统环境变量**

1. `Win + R` 输入 `sysdm.cpl`
2. 高级 → 环境变量
3. 在“系统变量”中找到 `Path` → 编辑 → 新建
4. 填入 `C:\Program Files\MySQL\MySQL Server 8.0\bin`
5. 确定后重新打开 PowerShell

验证：

```powershell
mysql --version
```

---

## 二、创建项目数据库与专用账号

### 1. 使用 root 登录 MySQL

```powershell
mysql -u root -p
```

输入安装时设置的 root 密码。

### 2. 执行建库与建用户 SQL

本项目默认数据库配置是：

- 数据库：`gd_travel`
- 应用账号：`gd_travel`
- 密码：`gd_travel_password`
- 端口：`3306`

在 MySQL 命令行中逐段执行：

```sql
CREATE DATABASE IF NOT EXISTS gd_travel
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 同时创建 localhost 和 127.0.0.1 两个 host，避免本机 TCP/名称解析差异
CREATE USER IF NOT EXISTS 'gd_travel'@'localhost'
  IDENTIFIED BY 'gd_travel_password';

CREATE USER IF NOT EXISTS 'gd_travel'@'127.0.0.1'
  IDENTIFIED BY 'gd_travel_password';

-- 如果账号之前已存在，也确保密码为预期值
ALTER USER 'gd_travel'@'localhost'
  IDENTIFIED BY 'gd_travel_password';

ALTER USER 'gd_travel'@'127.0.0.1'
  IDENTIFIED BY 'gd_travel_password';

GRANT ALL PRIVILEGES ON gd_travel.* TO 'gd_travel'@'localhost';
GRANT ALL PRIVILEGES ON gd_travel.* TO 'gd_travel'@'127.0.0.1';

FLUSH PRIVILEGES;
```

查看结果：

```sql
SHOW DATABASES;
SELECT user, host, plugin FROM mysql.user WHERE user = 'gd_travel';
```

应看到两条 `gd_travel` 账号记录。

### 3. 用应用账号测试连接

退出 root：

```sql
exit;
```

使用新建账号连接：

```powershell
mysql -u gd_travel -p -h 127.0.0.1 -P 3306 gd_travel
```

输入密码 `gd_travel_password`。

进入后执行：

```sql
SELECT DATABASE();
SHOW TABLES;
```

现在数据库是空的，`SHOW TABLES` 没有结果，这是正常的。下一步运行 Prisma 迁移。

---

## 三、让项目连接数据库

### 1. 检查 `backend/.env`

打开：

```text
D:\私人项目\connectrip\backend\.env
```

推荐配置：

```env
DATABASE_URL="mysql://gd_travel:gd_travel_password@127.0.0.1:3306/gd_travel"
JWT_SECRET="gd-travel-dev-secret-change-me"
JWT_EXPIRES_IN="8h"
PORT=3000
CORS_ORIGIN="http://localhost:8000"
```

说明：

- 这里的密码必须和你刚才 SQL 中设置的一致
- `127.0.0.1` 对应你创建的 `'gd_travel'@'127.0.0.1'` 账号
- 如果使用 `localhost`，则对应 `'gd_travel'@'localhost'` 账号
- 密码如果包含 `@`、`:`、`/`、`#`、`%` 等字符，需要 URL 编码；本地开发建议先用简单密码
- `.env` 已被 `.gitignore` 忽略，不会提交到 Git

如果 `backend/.env` 不存在：

```powershell
cd D:\私人项目\connectrip\backend
copy .env.example .env
```

### 2. 安装依赖并执行迁移 + 种子

```powershell
cd D:\私人项目\connectrip\backend
npm install
npm run db:setup
```

`db:setup` 实际执行：

1. `prisma migrate deploy`：创建 `users`、`roles`、`permissions`、`user_roles`、`role_permissions` 等表
2. `prisma db seed`：写入演示权限、角色和用户

成功时会看到：

```text
Applying migration `20261103000000_init`
All migrations have been successfully applied.
种子数据完成：29 个权限、4 个角色、12 个用户
演示账号：admin/admin123、operator/operator123、viewer/viewer123
```

如果数据库是旧版本初始化、需要补充操作中心线路/金额权限，执行：

```bash
cd backend
npm run permissions:sync
```

### 3. 验证数据

```powershell
mysql -u gd_travel -p -h 127.0.0.1 -P 3306 gd_travel
```

```sql
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT username, nickname, status FROM users ORDER BY id;
SELECT code, name, isSystem FROM roles;
```

应看到 12 个用户和 4 个角色。

### 4. 启动后端

```powershell
cd D:\私人项目\connectrip\backend
npm run start:dev
```

看到以下日志说明连接成功：

```text
[PrismaService] 数据库连接成功
[PrismaService] Nest application successfully started
[Bootstrap] GD旅游社管理系统 API 已启动: http://localhost:3000/api
```

验证接口：

```powershell
curl.exe http://localhost:3000/api/health
```

登录接口现在需要图形验证码，建议直接打开前端 http://localhost:8000 使用页面登录。

### 5. 启动前端

另开一个 PowerShell：

```powershell
cd D:\私人项目\connectrip\frontend
npm install
npm run dev:server
```

访问：

```text
http://localhost:8000
```

使用 `admin / admin123` 登录。

> `dev` 使用前端 Mock，不访问数据库；`dev:server` 会关闭 Mock，把 `/api` 代理到 `http://localhost:3000`。

---

## 四、用图形化软件管理数据库

### 推荐：DBeaver Community（免费，多数据库、多连接）

DBeaver 很适合本教程的需求：

- 免费开源
- 可以同时保存并连接多个 MySQL 实例/数据库
- 也支持 PostgreSQL、SQL Server、SQLite、Oracle、MariaDB 等
- 支持数据浏览、SQL 查询、表结构修改、导入导出、ER 图
- Windows / macOS / Linux

官网下载：

- https://dbeaver.io/download/

Windows 也可以用 winget 安装：

```powershell
winget install --id DBeaver.DBeaver.Community -e
```

#### 1. 新建 MySQL 连接

1. 打开 DBeaver
2. 菜单选择 **Database → New Database Connection**
3. 选择 **MySQL** → Next
4. 填写：

| 字段 | 值 |
| --- | --- |
| Server Host | `127.0.0.1` |
| Port | `3306` |
| Database | `gd_travel` |
| Username | `gd_travel` |
| Password | `gd_travel_password` |

5. 勾选 **Save password locally**（个人电脑可勾选）
6. 点击 **Test Connection**
7. 首次连接如果提示下载 MySQL 驱动，点击 **Download**
8. 测试成功后点击 **Finish**

如果连接时报错：

```text
Public Key Retrieval is not allowed
```

在连接设置的 **Driver properties** 中加入：

```properties
allowPublicKeyRetrieval=true
useSSL=false
```

仅建议在本地开发使用 `useSSL=false`。

#### 2. 浏览和修改数据

连接成功后：

- 在左侧 **Database Navigator** 展开连接
- 展开 `gd_travel` → `Tables`
- 双击 `users` 查看数据
- 右键表 → **Edit Data** 直接修改单元格
- 修改完成后点击工具栏的 **Commit** 提交事务

也可以打开 SQL 编辑器：

- 右键连接 → **SQL Editor → New SQL Editor**
- 或使用顶部 SQL 按钮

常用查询：

```sql
-- 查看用户与角色
SELECT
  u.id,
  u.username,
  u.nickname,
  u.email,
  u.phone,
  u.status,
  u.lastLoginAt,
  GROUP_CONCAT(r.name ORDER BY r.id SEPARATOR ' / ') AS roles
FROM users u
LEFT JOIN user_roles ur ON ur.userId = u.id
LEFT JOIN roles r ON r.id = ur.roleId
GROUP BY u.id
ORDER BY u.id;

-- 查看角色与权限
SELECT
  r.code AS role_code,
  r.name AS role_name,
  GROUP_CONCAT(p.code ORDER BY p.sort SEPARATOR ', ') AS permissions
FROM roles r
LEFT JOIN role_permissions rp ON rp.roleId = r.id
LEFT JOIN permissions p ON p.id = rp.permissionId
GROUP BY r.id
ORDER BY r.id;

-- 查看某个用户的权限
SELECT DISTINCT p.code, p.name
FROM users u
JOIN user_roles ur ON ur.userId = u.id
JOIN role_permissions rp ON rp.roleId = ur.roleId
JOIN permissions p ON p.id = rp.permissionId
WHERE u.username = 'operator'
ORDER BY p.code;
```

修改示例：

```sql
UPDATE users
SET nickname = '林悦（管理员）'
WHERE username = 'admin';
```

修改后：

- 在 DBeaver 中提交事务
- 刷新后台页面
- 角色/权限修改会被后端每次请求时重新读取，刷新页面或重新登录后生效

> **不要直接修改 `passwordHash`。**
> 登录密码是 bcrypt 哈希。需要重置密码时，使用后台的“重置密码”功能，或调用：
> `POST /api/system/users/:id/reset-password`。

#### 3. 同时连接多个数据库

DBeaver 的“多数据库”能力有两种场景。

**场景 A：多个 MySQL 实例或不同环境**

例如：

- 本地开发：`127.0.0.1:3306/gd_travel`
- 测试环境：`192.168.1.50:3306/gd_travel_test`
- 生产环境：`db.example.com:3306/gd_travel_prod`

重复“New Database Connection”，分别填写不同主机和账号。所有连接都会保存在左侧导航栏，可以同时打开、同时查询。

建议给连接设置不同颜色或名称，例如：

```text
GD Travel - Local
GD Travel - Test
GD Travel - Production (只读)
```

**场景 B：同一个 MySQL 实例下的多个 schema**

DBeaver 打开一个 MySQL 连接后，可以在左侧看到该账号有权限访问的多个数据库/schema。SQL 编辑器中执行：

```sql
USE gd_travel;
SELECT COUNT(*) FROM users;

USE another_database;
SELECT * FROM some_table;
```

如果需要看到实例里的全部数据库，可以：

- 编辑连接 → MySQL 设置 → 勾选显示所有数据库（具体位置随 DBeaver 版本略有差异）
- 或为每个数据库添加独立连接
- 或给 DBeaver 使用的账号授予对应 schema 的权限

> 生产环境建议单独创建一个只读账号给 GUI 工具使用，避免误操作。

### 其他可选工具

| 软件 | 费用 | 多数据库支持 | 特点 |
| --- | --- | --- | --- |
| **DBeaver Community** | 免费 | 支持 MySQL、PostgreSQL、SQL Server、SQLite、Oracle、MariaDB 等 | 推荐，功能全，多连接管理方便 |
| **Navicat Premium** | 收费 | 支持 MySQL、MariaDB、PostgreSQL、SQL Server、Oracle、SQLite、MongoDB 等 | 界面成熟，数据同步/传输强，适合团队 |
| **DataGrip** | 收费（有试用） | 支持多种数据库 | JetBrains 产品，SQL 编辑和重构体验好 |
| **HeidiSQL** | 免费 | 主要支持 MySQL/MariaDB，也支持部分其他数据库 | 轻量，Windows 友好，适合只管理 MySQL |
| **MySQL Workbench** | 免费 | 主要面向 MySQL | MySQL 官方工具；可管理多个 MySQL 连接，但不适合跨数据库类型 |

安装命令（Windows，winget）：

```powershell
winget install --id DBeaver.DBeaver.Community -e
winget install --id HeidiSQL.HeidiSQL -e
winget install --id JetBrains.DataGrip -e
winget install --id PremiumSoft.NavicatPremium -e
```

Navicat Premium 为商业软件，安装后需要授权。

统一连接信息：

```text
Host: 127.0.0.1
Port: 3306
Database: gd_travel
Username: gd_travel
Password: gd_travel_password
```

---

## 五、常用数据库运维命令

### 备份数据库

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" `
  -u gd_travel -p gd_travel > gd_travel_backup.sql
```

### 恢复数据库

PowerShell 不支持 Linux 风格的 `<` 输入重定向，推荐在 MySQL 客户端中使用 `source`：

```powershell
mysql -u gd_travel -p -h 127.0.0.1 gd_travel
```

进入 `mysql>` 后执行：

```sql
source C:/Users/你的用户名/gd_travel_backup.sql;
```

也可以使用 DBeaver 的 SQL 脚本执行功能导入备份文件。

### 重新写入演示数据

```powershell
cd D:\私人项目\connectrip\backend
npm run prisma:seed
```

种子脚本是幂等的，会重置演示账号的密码、资料和角色，但不会删除你自己新增的数据。

### 完全重置数据库

> 会清空 `gd_travel` 中的全部数据，仅用于本地开发。
> 应用账号只有 `gd_travel.*` 权限，不能删除/创建数据库，因此重置建议使用 root。

```powershell
mysql -u root -p -e "DROP DATABASE IF EXISTS gd_travel; CREATE DATABASE gd_travel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
cd D:\私人项目\connectrip\backend
npm run db:setup
```

如果希望使用 Prisma 的重置命令，需要给账号额外的 `CREATE`、`DROP` 权限（或临时使用 root 的 `DATABASE_URL`）：

```powershell
npx prisma migrate reset
```

### 查看迁移状态

```powershell
cd D:\私人项目\connectrip\backend
npx prisma migrate status
```

### 启动/停止 MySQL 服务

```powershell
# 启动
Start-Service MySQL80

# 停止
Stop-Service MySQL80

# 查看状态
Get-Service MySQL80
```

如果是 MySQL 8.4，服务名可能是 `MySQL84`，以 `Get-Service *MySQL*` 结果为准。

---

## 六、常见问题排查

### 1. `mysql` 不是内部或外部命令

MySQL 的 `bin` 目录没加入 PATH。使用完整路径：

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

或按前面步骤配置环境变量。

### 2. Prisma 报 P1001：Can't reach database server

检查：

```powershell
Get-Service *MySQL*
Test-NetConnection 127.0.0.1 -Port 3306
```

处理：

- 启动 MySQL 服务
- 确认 `.env` 端口与实际端口一致
- 检查防火墙
- 如果端口被其他程序占用，修改 MySQL 端口和 `.env`

### 3. Prisma 报 P1000：Authentication failed

检查 `.env` 中的账号、密码、host 是否与 SQL 一致：

```sql
SELECT user, host, plugin FROM mysql.user WHERE user = 'gd_travel';
```

如果缺少对应 host，补建账号：

```sql
CREATE USER 'gd_travel'@'127.0.0.1'
  IDENTIFIED BY 'gd_travel_password';

GRANT ALL PRIVILEGES ON gd_travel.* TO 'gd_travel'@'127.0.0.1';
FLUSH PRIVILEGES;
```

如果密码有特殊字符，优先换简单密码，或在 URL 中编码。

### 4. Prisma 报 P1003：Database does not exist

```sql
CREATE DATABASE gd_travel
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

然后重新执行：

```powershell
npm run db:setup
```

### 5. Access denied for user 'gd_travel'@'localhost'

通常是 host 不匹配或密码不一致。用 root 登录后检查并重建：

```sql
SELECT user, host FROM mysql.user WHERE user = 'gd_travel';

ALTER USER 'gd_travel'@'localhost'
  IDENTIFIED BY 'gd_travel_password';

ALTER USER 'gd_travel'@'127.0.0.1'
  IDENTIFIED BY 'gd_travel_password';

FLUSH PRIVILEGES;
```

### 6. DBeaver 报 Public Key Retrieval is not allowed

在 DBeaver 连接的 **Driver properties** 中添加：

```properties
allowPublicKeyRetrieval=true
useSSL=false
```

或者使用最新版 MySQL 驱动。

### 7. 认证插件兼容问题

MySQL 8.0 默认是 `caching_sha2_password`。现代 Prisma 和 DBeaver 通常可以直接连接。

如果确实遇到旧客户端不支持，可以在 MySQL 8.0 上临时改为：

```sql
ALTER USER 'gd_travel'@'127.0.0.1'
  IDENTIFIED WITH mysql_native_password BY 'gd_travel_password';

FLUSH PRIVILEGES;
```

> MySQL 8.4 默认禁用 `mysql_native_password`，不建议为新项目使用该兼容模式。
> 优先升级 Prisma/客户端驱动，或使用 MySQL 8.0。

### 8. Port 3306 already in use

查看占用进程：

```powershell
netstat -ano | findstr :3306
```

在任务管理器中按 PID 结束进程，或在 MySQL Installer → Reconfigure 中修改端口，并同步修改 `.env`。

### 9. 前端登录成功但数据为空

确认：

1. `backend/.env` 的数据库连接正确
2. 已执行 `npm run db:setup`
3. 后端正在运行且 `http://localhost:3000/api/health` 返回 `code: 0`
4. 前端使用 `npm run dev:server` 启动，而不是只使用 Mock 的 `npm run dev`

### 10. 修改数据库后前端没变化

- 数据接口一般刷新页面后重新请求
- 用户角色/权限：刷新页面或重新登录后更新菜单和按钮
- 后端每次请求都会重新读取当前用户的角色权限，因此接口权限会立即按数据库最新状态校验

---

## 七、多数据库使用建议

### 同一个项目切换数据库

复制一份数据库，例如：

```sql
CREATE DATABASE gd_travel_dev
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

修改 `backend/.env`：

```env
DATABASE_URL="mysql://gd_travel:gd_travel_password@127.0.0.1:3306/gd_travel_dev"
```

然后：

```powershell
npm run db:setup
npm run start:dev
```

一个后端进程只连接一个 `DATABASE_URL`；需要同时运行开发/测试环境时，可以启动多个后端实例，监听不同端口，并分别配置不同数据库。

### 在 GUI 工具中管理多套数据库

DBeaver / Navicat Premium 都可以：

- 保存多个连接
- 同时打开多个 SQL 编辑器
- 在不同数据库之间复制表结构或数据
- 为生产连接设置只读账号，避免误修改

建议连接命名规范：

```text
GD Travel / Local / gd_travel
GD Travel / Test / gd_travel_test
GD Travel / Production / gd_travel_prod (READ ONLY)
```

---

## 八、安全提醒

- 本地开发的 `gd_travel_password` 不要直接用于生产
- 生产环境修改 `backend/.env` 中的 `JWT_SECRET` 和数据库密码
- 不要把 `backend/.env` 提交到 Git
- MySQL 3306 端口不要直接暴露到公网
- 生产环境的 GUI 连接使用只读账号，并限制来源 IP
- 重要操作前使用 `mysqldump` 或 DBeaver 备份
- 不要直接修改 `passwordHash`；使用系统“重置密码”功能

---

## 九、最短启动清单

如果你已经安装好 MySQL 并创建了 `gd_travel` 数据库和应用账号：

```powershell
# 1. 后端
cd D:\私人项目\connectrip\backend
npm install
npm run db:setup
npm run start:dev

# 2. 前端（另开终端）
cd D:\私人项目\connectrip\frontend
npm install
npm run dev:server
```

打开 http://localhost:8000，使用：

```text
admin / admin123
```

DBeaver 连接：

```text
Host: 127.0.0.1
Port: 3306
Database: gd_travel
User: gd_travel
Password: gd_travel_password
```

完成。
