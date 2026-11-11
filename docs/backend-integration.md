# GD旅游社管理系统 · 后端对接说明

本文档面向 NestJS + Prisma + MySQL 后端开发者，描述前端已使用的鉴权方式、接口契约与权限校验要求。前端代码中的 `frontend/src/services/*`、`frontend/mock/*` 与本文档保持一致。本仓库已按本文档实现后端，代码位于 [`backend/`](../backend/)。

## 1. 基础约定

- API 前缀：`/api`
- 请求格式：`application/json`
- 鉴权头：`Authorization: Bearer <JWT>`
- 成功响应统一包络：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

- 失败响应使用正确 HTTP 状态码，并返回：

```json
{
  "code": 401,
  "message": "登录状态已过期，请重新登录",
  "data": null
}
```

前端会读取 `message` 做统一提示；`message` 也可以是字符串数组（NestJS 默认校验错误格式）。401 会清理本地 Token 并跳转登录页。

## 2. 鉴权与权限模型

### 2.1 登录

- 使用账号 + 密码登录
- 密码使用 bcrypt 或 argon2 哈希存储
- JWT 建议包含 `sub`（用户 ID）与 `username`
- 建议有效期：2~8 小时，可配合 refresh token
- 登录成功后更新 `lastLoginAt`
- 被停用账号不能登录

### 2.2 权限计算

- 一个用户可以有多个角色
- 一个角色拥有多个权限标识
- 用户的有效权限 = 所有角色权限的并集
- `super_admin` 角色视为拥有全部权限，后端仍需保护关键操作

权限标识约定：`模块:资源:动作`。前端使用的完整列表：

| 权限标识 | 说明 |
| --- | --- |
| `operation:view` | 查看操作中心 |
| `operation:export` | 导出操作数据（Excel） |
| `operation:amount:view` | 查看操作金额；未授权时前端显示 `****` |
| `operation:line:*` | 线路 / 国家数据权限，如 `operation:line:laos`、`operation:line:thailand` |
| `system:user:view` | 查看用户列表 |
| `system:user:create` | 新增用户 |
| `system:user:update` | 编辑用户 / 启停账号 |
| `system:user:delete` | 删除用户 |
| `system:user:reset-password` | 重置密码 |
| `system:role:view` | 查看角色 |
| `system:role:create` | 新增角色 |
| `system:role:update` | 编辑角色 / 分配权限 |
| `system:role:delete` | 删除角色 |

已有数据库升级操作中心权限时，在 `backend/` 执行 `npm run permissions:sync`，只补充线路/金额权限并授权内置角色，不重置用户数据。

### 2.3 前端权限流程

1. 登录页调用 `GET /api/auth/captcha` 获取一次性图形验证码
2. `POST /api/auth/login` 校验验证码与账号密码，返回 `token` 与包含 `permissions` 的 `user`
3. 前端把 Token 存入 localStorage，把用户与权限写入 `initialState`
4. 刷新页面时调用 `GET /api/auth/me`
5. `frontend/src/access.ts` 将 `permissions` 转成菜单/按钮判断
6. 路由 `access` 控制菜单显示，`<Access>` 控制按钮显示

后端必须在每个受保护接口上再次校验权限，不能依赖前端隐藏按钮。

## 3. 数据结构

### 3.1 CurrentUser

```ts
interface CurrentUser {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  email?: string;
  phone?: string;
  roles: Array<{ id: number; code: string; name: string }>;
  permissions: string[];
  isSuperAdmin: boolean;
}
```

### 3.2 User（用户列表项）

```ts
interface User {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  email?: string;
  phone?: string;
  roleIds: number[];
  roles: Array<{ id: number; code: string; name: string }>;
  status: 'active' | 'disabled';
  lastLoginAt?: string | null;
  createdAt: string;
}
```

### 3.3 Role

```ts
interface Role {
  id: number;
  name: string;
  code: string;
  description?: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
  createdAt: string;
}
```

### 3.4 分页

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [],
    "total": 12,
    "page": 1,
    "pageSize": 10
  }
}
```

## 4. 接口清单

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/auth/captcha` | 公开 | 获取图形验证码 |
| POST | `/api/auth/login` | 公开 | 登录 |
| GET | `/api/auth/me` | 登录 | 当前用户与权限 |
| POST | `/api/auth/change-password` | 登录 | 修改当前登录密码 |
| POST | `/api/auth/logout` | 登录 | 退出（无状态 JWT 可直接返回成功） |
| GET | `/api/dashboard/summary` | 登录 | 工作台概览 |
| GET | `/api/system/users` | `system:user:view` | 用户分页列表 |
| POST | `/api/system/users` | `system:user:create` | 新建用户 |
| PUT | `/api/system/users/:id` | `system:user:update` | 编辑用户 |
| PATCH | `/api/system/users/:id/status` | `system:user:update` | 启用 / 停用 |
| POST | `/api/system/users/:id/reset-password` | `system:user:reset-password` | 重置密码 |
| DELETE | `/api/system/users/:id` | `system:user:delete` | 删除用户 |
| GET | `/api/system/roles` | `system:role:view` | 角色分页列表 |
| GET | `/api/system/roles/options` | 登录 | 角色下拉选项 |
| GET | `/api/system/roles/:id/user-options` | `system:role:update` | 角色成员管理的用户列表 |
| GET | `/api/system/permissions` | `system:role:view` | 权限树 |
| POST | `/api/system/roles` | `system:role:create` | 新建角色 |
| POST | `/api/system/roles/:id/members` | `system:role:update` | 给当前角色批量添加 / 移除成员 |
| PUT | `/api/system/roles/:id` | `system:role:update` | 编辑角色 / 分配权限 |
| DELETE | `/api/system/roles/:id` | `system:role:delete` | 删除角色 |

### 4.1 登录

登录前先获取一次性图形验证码：

```http
GET /api/auth/captcha
```

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "captchaId": "0f5dd1d1-6ef6-44a9-91bf-4d3f8b4e1c65",
    "image": "data:image/svg+xml;base64,...",
    "expiresIn": 120
  }
}
```

然后提交账号、密码和验证码：

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123",
  "captchaId": "0f5dd1d1-6ef6-44a9-91bf-4d3f8b4e1c65",
  "captchaCode": "7K3P"
}
```

验证码规则：

- 有效期 2 分钟
- 只能使用一次，成功或失败后均失效
- 验证码校验通过后才会校验账号密码
- 当前实现使用服务端内存存储，多实例部署时应改用 Redis 等共享存储

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "username": "admin",
      "nickname": "林悦",
      "roles": [{ "id": 1, "code": "super_admin", "name": "超级管理员" }],
      "permissions": [
        "operation:view",
        "operation:export",
        "system:user:view",
        "operation:line:laos",
        "operation:line:thailand"
      ],
      "isSuperAdmin": true
    }
  }
}
```

错误示例：

- 账号/密码错误：HTTP 401，`message: "账号或密码错误"`
- 账号停用：HTTP 403，`message: "该账号已被停用，请联系管理员"`

### 4.2 当前用户

```http
GET /api/auth/me
Authorization: Bearer <token>
```

返回 `CurrentUser`。该接口必须返回**最新的角色权限**，以便前端刷新 `initialState`。

#### 4.2.1 修改当前用户密码

```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

```json
{
  "code": 0,
  "message": "ok",
  "data": { "success": true }
}
```

- 必须校验当前密码
- 新密码长度 6-32 位
- 新密码不能与当前密码相同
- 管理员为用户修改密码使用 `POST /api/system/users/:id/reset-password`，需要 `system:user:reset-password` 权限
- 密码使用 bcrypt 单向哈希存储，任何接口都不会返回密码明文

### 4.3 用户列表

```http
GET /api/system/users?page=1&pageSize=10&keyword=林&roleCode=operator&status=active
```

- `page`、`pageSize` 必传
- `keyword` 模糊匹配账号、昵称、邮箱、手机号
- `roleCode` 按角色编码过滤
- `status` 取值 `active` / `disabled`
- 返回分页的 `User[]`

### 4.4 新建用户

```http
POST /api/system/users
Authorization: Bearer <token>

{
  "username": "tester01",
  "nickname": "联调测试",
  "password": "123456",
  "email": "tester01@gdtravel.cn",
  "phone": "13900000001",
  "roleIds": [4],
  "status": "active"
}
```

校验要求：

- `username` 3-20 位字母/数字/下划线，字母开头，唯一
- `password` 6-32 位
- 至少一个有效角色
- 只有超级管理员可以分配 `super_admin` 角色

### 4.5 编辑用户

```http
PUT /api/system/users/:id

{
  "nickname": "联调测试",
  "email": "tester01@gdtravel.cn",
  "phone": "13900000001",
  "roleIds": [4],
  "status": "active"
}
```

- `username` 不可修改
- 当前登录账号不能修改自己的角色与启用状态
- 超级管理员账号不能被停用，不能移除 `super_admin` 角色

### 4.6 启停用户

```http
PATCH /api/system/users/:id/status

{ "status": "disabled" }
```

### 4.7 修改用户登录密码

```http
POST /api/system/users/:id/reset-password

{ "password": "newPassword123" }
```

- 需要 `system:user:reset-password` 权限，超级管理员默认拥有
- 密码使用 bcrypt 单向哈希存储，后端和前端都不提供“查看明文密码”的能力
- 管理员只能为用户设置新密码；用户下一次登录时使用新密码
- 建议记录操作日志，并使旧 Token 失效（例如增加 `tokenVersion`）

### 4.8 删除用户

```http
DELETE /api/system/users/:id
```

保护规则：

- 不能删除自己
- 不能删除超级管理员账号
- 建议软删除或保留审计记录

### 4.9 角色列表

```http
GET /api/system/roles?page=1&pageSize=10&keyword=运营
```

返回分页 `Role[]`，其中 `userCount` 为该角色成员数。

### 4.10 角色选项

```http
GET /api/system/roles/options
```

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    { "label": "超级管理员", "value": 1, "code": "super_admin" },
    { "label": "运营专员", "value": 2, "code": "operator" }
  ]
}
```

用户管理页需要加载该接口来渲染角色筛选和角色选择器，因此登录用户均可访问。

### 4.11 权限树

```http
GET /api/system/permissions
```

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "key": "group:operation",
      "title": "操作中心",
      "type": "group",
      "children": [
        { "key": "operation:view", "title": "查看操作中心", "type": "menu" },
        { "key": "operation:export", "title": "导出操作数据（Excel）", "type": "button" },
        { "key": "operation:amount:view", "title": "查看操作金额", "type": "button" }
      ]
    },
    {
      "key": "group:operation-line",
      "title": "线路 / 国家权限",
      "type": "group",
      "children": [
        { "key": "operation:line:laos", "title": "老挝-LAO", "type": "button" },
        { "key": "operation:line:thailand", "title": "泰国-THA", "type": "button" },
        { "key": "operation:line:malaysia", "title": "马来西亚-MYS", "type": "button" }
      ]
    }
  ]
}
```

- `group` 仅用于分组，不会保存到角色权限
- 角色 `permissions` 只保存 `menu` / `button` 的权限标识
- 前端权限树会自动过滤父级节点，只提交叶子权限
- 示例中只列出部分线路，实际线路权限共 17 项；完整列表见 `backend/src/common/constants/permissions.ts`
- 线路权限同样保存为叶子权限；后端操作列表接口应按当前用户持有的 `operation:line:*` 过滤团队，不能只依赖前端隐藏标签
- 金额字段应在后端响应中按 `operation:amount:view` 脱敏，导出接口也必须执行同一校验

### 4.12 新建角色

```http
POST /api/system/roles

{
  "name": "计调专员",
  "code": "dispatcher",
  "description": "负责旅行团计调工作",
  "permissions": ["operation:view"]
}
```

- `code` 唯一，3-32 位小写字母/数字/下划线，创建后不可修改
- `name` 不超过 20 个字符
- 至少选择一项权限

### 4.13 编辑角色

```http
PUT /api/system/roles/:id

{
  "name": "计调专员",
  "code": "dispatcher",
  "description": "负责旅行团计调工作",
  "permissions": ["operation:view", "operation:export"]
}
```

- `super_admin`（`isSystem: true`）不可编辑
- `permissions` 为全量替换
- 保存后当前用户可调用 `/auth/me` 刷新权限

### 4.14 删除角色

```http
DELETE /api/system/roles/:id
```

- 系统内置角色不可删除
- 角色下还有成员时禁止删除，前端会提示先移除成员

### 4.15 角色成员管理

角色页的「成员管理」固定操作当前角色，需要加载用户列表及是否已属于该角色：

```http
GET /api/system/roles/2/user-options?keyword=&limit=200
```

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": 3,
      "username": "viewer",
      "nickname": "苏晴",
      "status": "active",
      "isMember": false,
      "roles": [{ "id": 3, "code": "viewer", "name": "只读访客" }]
    }
  ]
}
```

给当前角色批量添加或移除用户：

```http
POST /api/system/roles/2/members
Content-Type: application/json

{
  "action": "add",
  "userIds": [3, 5]
}
```

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "success": true,
    "action": "add",
    "affected": 2,
    "userCount": 6
  }
}
```

- 成员管理只作用于 URL 中指定的角色，不能同时操作多个角色
- `action` 取值 `add` 或 `remove`
- `add` 只会把用户加入当前角色，不会移除用户已有的其他角色
- 已存在的关联会被忽略，`affected` 为实际变更数量
- `remove` 只删除当前角色与用户的关联，不删除用户或其他角色
- `super_admin` 角色只能由超级管理员添加成员；不允许批量移除 `super_admin` 角色
- 接口使用 `system:role:update` 权限

### 4.16 工作台概览

```http
GET /api/dashboard/summary
```

```json
{
  "userCount": 12,
  "activeUserCount": 10,
  "roleCount": 4,
  "permissionCount": 11,
  "todayOperations": 168,
  "systemStatus": "operational",
  "recentUsers": []
}
```

`recentUsers` 每项包含 `id`、`nickname`、`username`、`roles`、`status`、`lastLoginAt`。

建议只有具备 `system:user:view` 权限的账号才返回 `recentUsers`，其他账号返回空数组，避免在无权查看用户列表时泄露登录信息。

## 5. Prisma 参考模型

```prisma
enum UserStatus {
  ACTIVE
  DISABLED
}

enum PermissionType {
  MENU
  BUTTON
}

model User {
  id           Int        @id @default(autoincrement())
  username     String     @unique
  passwordHash String
  nickname     String
  email        String?
  phone        String?
  avatar       String?
  status       UserStatus @default(ACTIVE)
  lastLoginAt  DateTime?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  roles        UserRole[]
}

model Role {
  id          Int             @id @default(autoincrement())
  code        String          @unique
  name        String
  description String?
  isSystem    Boolean         @default(false)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  users       UserRole[]
  permissions RolePermission[]
}

model Permission {
  id        Int            @id @default(autoincrement())
  code      String         @unique
  name      String
  type      PermissionType
  module    String
  sort      Int            @default(0)

  roles     RolePermission[]
}

model UserRole {
  userId Int
  roleId Int
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
}

model RolePermission {
  roleId       Int
  permissionId Int
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
}
```

权限树分组可以由 `Permission.module` + 固定的模块名称映射构建，也可以使用独立的分组表。

## 6. NestJS 实现要点

### 6.1 统一响应拦截器

```ts
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => ({ code: 0, message: 'ok', data })),
    );
  }
}

// main.ts
app.setGlobalPrefix('api');
app.useGlobalInterceptors(new TransformInterceptor());
```

异常过滤器保持 HTTP 状态码并返回 `{ code, message, data: null }`。

### 6.2 权限装饰器与守卫

```ts
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required =
      this.reflector.getAllAndOverride<string[]>('permissions', [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    if (!required.length) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { sub: number };

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      include: {
        roles: { include: { permissions: true } },
      },
    });

    if (!dbUser || dbUser.status === 'DISABLED') {
      throw new UnauthorizedException('账号已被停用');
    }

    if (dbUser.roles.some((role) => role.code === 'super_admin')) {
      return true;
    }

    const granted = new Set(
      dbUser.roles.flatMap((role) => role.permissions.map((p) => p.code)),
    );
    return required.every((code) => granted.has(code));
  }
}
```

在 Controller 上使用：

```ts
@Post()
@RequirePermissions('system:user:create')
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}
```

### 6.3 登录逻辑

```ts
async login(username: string, password: string) {
  const user = await this.prisma.user.findUnique({
    where: { username },
    include: { roles: { include: { permissions: true } } },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new UnauthorizedException('账号或密码错误');
  }
  if (user.status === 'DISABLED') {
    throw new ForbiddenException('该账号已被停用，请联系管理员');
  }

  await this.prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    token: this.jwtService.sign({ sub: user.id, username: user.username }),
    user: toCurrentUser(user),
  };
}
```

`toCurrentUser` 需要计算：

- `roles` 简表
- 去重后的 `permissions`
- `super_admin` 角色时返回全部权限并设置 `isSuperAdmin: true`

## 7. 前端切换真实后端

1. 后端监听 `http://localhost:3000`，全局前缀设置为 `api`
2. 启动前端：

```bash
cd frontend
npm run dev:server
```

3. 自定义后端地址：

```bash
cd frontend
npx cross-env MOCK=none API_PROXY_TARGET=http://localhost:3000 npm run dev
```

4. 如部署到其他域名，生产环境由 Nginx 将 `/api` 反向代理至 NestJS。前端 `BASE_URL` 定义在 `frontend/src/utils/request.ts`。

## 8. 安全清单

- [ ] 密码使用 bcrypt/argon2，不返回 `passwordHash`
- [ ] JWT 秘钥通过环境变量注入，不提交到仓库
- [ ] 所有业务接口都加 JWT 守卫 + 权限守卫
- [ ] 当前用户状态每次鉴权时从数据库读取，避免停用后旧 Token 继续可用
- [ ] 超级管理员角色与账号有服务端保护
- [ ] 角色删除前检查成员数量
- [ ] 用户删除/停用、重置密码记录操作日志
- [ ] 生产环境启用 HTTPS 与 CORS 白名单
- [ ] 不让前端权限判断替代服务端授权
