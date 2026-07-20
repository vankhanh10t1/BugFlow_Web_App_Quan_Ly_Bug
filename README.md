# BugFlow

## Tiếng Việt

### Giới thiệu

BugFlow là ứng dụng theo dõi lỗi và quản lý issue dành cho nhóm phát triển phần mềm. Dự án sử dụng Next.js, TypeScript, Prisma và Neon PostgreSQL, tập trung vào workflow có kiểm soát, phân quyền phía server, nhật ký kiểm toán và khả năng triển khai serverless trên Vercel.

Tài liệu công khai cho người dùng nằm tại `/docs`. Nhật ký triển khai chi tiết nằm trong [`nhat-ki-phases.md`](./nhat-ki-phases.md).

### Tính năng chính

- Đăng ký, đăng nhập và đăng xuất; JWT session trong HTTP-only cookie.
- Xác thực 2FA bắt buộc bằng TOTP hoặc recovery code trước khi tạo session hoàn chỉnh.
- Quản lý hồ sơ, đổi mật khẩu và upload avatar từ máy tính.
- Avatar Cloudinary và avatar mặc định nội bộ cho tài khoản chưa có ảnh.
- Admin quản lý người dùng: tìm kiếm, tạo/sửa, đổi vai trò, khóa, mở khóa và vô hiệu hóa.
- Quản lý dự án, thành viên và project role.
- Tạo, sửa, tìm kiếm, lọc, sắp xếp và phân trang Bug.
- Workflow Bug theo vai trò; priority, severity, assignee và self-assignment.
- Comment, mention, activity timeline và notification.
- Dashboard tổng quan, dashboard dự án và biểu đồ thống kê.
- Kanban kéo-thả với workflow validation và optimistic rollback.
- Upload/xóa attachment Cloudinary cho ảnh, log, text, PDF và video.
- Chọn tối đa 5 attachment ngay trong form Báo lỗi mới; Bug luôn được tạo trước rồi file mới được upload.
- Kiểm tra quyền và membership phía server để chống IDOR.
- Rate limiting bền vững bằng PostgreSQL và Same-Origin/CSRF guard cho API mutation.
- AI Chatbot MVP hỗ trợ hướng dẫn sử dụng, cải thiện báo cáo lỗi và gợi ý priority/severity; không lưu transcript và không tự thay đổi dữ liệu.
- Chat dự án, direct chat giữa user có dự án chung và kênh hỗ trợ Admin; lưu PostgreSQL, unread/read receipt và polling 4–5 giây.

### Công nghệ

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4, Lucide React
- Auth.js Credentials, JWT, bcryptjs, OTPAuth
- Prisma 7, `@prisma/adapter-pg`, Neon PostgreSQL
- Zod, React Hook Form, TanStack Query
- Recharts, DnD Kit, Cloudinary
- Vitest

### Kiến trúc

```text
Browser
  → Server Components / Client Components
  → Server Actions / Route Handlers
  → Validation + authentication + authorization
  → Feature services / workflow policies
  → Prisma singleton + PostgreSQL adapter
  → Neon PostgreSQL / Cloudinary
```

Business logic nằm trong feature service. Mỗi mutation xác thực và phân quyền lại ở server; query sử dụng `select`/DTO để không đưa dữ liệu nhạy cảm như `passwordHash` tới client.

```text
src/
  app/              Pages, layouts và Route Handlers
  components/       UI theo domain
  features/         Actions, services và business logic
  lib/              Auth, Prisma, validation và security helpers
  generated/        Prisma Client được generate
prisma/
  migrations/       Database migrations
  schema.prisma     Data model
  seed.ts           Demo data
tests/              Vitest tests
```

### Vai trò và quyền

| Phạm vi | Vai trò |
|---|---|
| Hệ thống | `ADMIN`, `MEMBER`, `TESTER` |
| Dự án | `PROJECT_MANAGER`, `DEVELOPER`, `TESTER`, `VIEWER` |

Quyền được kiểm tra trong service layer. Việc ẩn nút trên UI không được xem là biện pháp phân quyền.

### Routes chính

| Route | Chức năng |
|---|---|
| `/login` | Đăng nhập bằng email/mật khẩu |
| `/login/setup-2fa` | Thiết lập 2FA bắt buộc khi đăng nhập lần đầu |
| `/login/verify-2fa` | Xác minh mã TOTP |
| `/dashboard` | Tổng quan hệ thống |
| `/projects` | Danh sách và quản lý dự án |
| `/bugs` | Danh sách Bug |
| `/bugs/new` | Báo lỗi mới và chọn attachment |
| `/bugs/[bugId]` | Chi tiết, workflow, comment và attachment |
| `/my-bugs` | Bug liên quan tới người dùng hiện tại |
| `/profile` | Hồ sơ, avatar và mật khẩu |
| `/settings/security` | Cài đặt bảo mật và recovery code |
| `/admin/users` | Quản lý người dùng dành cho Admin |
| `/docs` | Tài liệu công khai trong ứng dụng |

Các API chính nằm dưới `/api/bugs`, `/api/comments`, `/api/projects`, `/api/notifications`, `/api/admin/users`, `/api/uploads` và `/api/attachments`.

### Cài đặt local

#### 1. Chuẩn bị dịch vụ

- Tạo Neon PostgreSQL database.
- Tạo Cloudinary project để dùng avatar và attachment.
- Lấy pooled connection string cho runtime và direct connection string cho migration.

#### 2. Cấu hình environment

Sao chép `.env.example` thành `.env.local`. Không commit `.env.local`.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler.neon.tech/DB?sslmode=verify-full"
DIRECT_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=verify-full"

AUTH_SECRET="a-long-random-secret"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ALLOWED_ORIGINS=""

TWO_FACTOR_ENCRYPTION_KEY="base64-encoded-32-byte-key"
TWO_FACTOR_CHALLENGE_TTL_MINUTES="10"
TWO_FACTOR_MAX_ATTEMPTS="5"
TWO_FACTOR_TOTP_WINDOW="2"

CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
UPLOAD_MAX_SIZE_MB="10"
BUG_ATTACHMENT_MAX_FILES="5"
AVATAR_MAX_SIZE_MB="5"

CRON_SECRET="a-long-random-secret"
```

Tạo `AUTH_SECRET` và khóa mã hóa 2FA bằng Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Mỗi biến phải dùng một giá trị ngẫu nhiên riêng. `TWO_FACTOR_ENCRYPTION_KEY` phải giải mã thành đúng 32 byte.

#### 3. Cài đặt và chạy

```bash
npm install
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Mở `http://localhost:3000`. Runtime dùng pooled `DATABASE_URL`; Prisma migration dùng `DIRECT_URL` qua `prisma.config.ts`.

### Tài khoản demo

`npm run db:seed` tạo các tài khoản development/demo sau:

| Vai trò | Email |
|---|---|
| Admin | `admin@bugflow.dev` |
| Project Manager | `manager@bugflow.dev` |
| Tester | `tester@bugflow.dev` |
| Developer | `developer1@bugflow.dev` |
| Developer | `developer2@bugflow.dev` |

```text
Mật khẩu demo: Password@123
```

Không tái sử dụng mật khẩu demo cho production. Mọi tài khoản phải thiết lập hoặc xác minh 2FA trước khi nhận session đăng nhập hoàn chỉnh.

### Luồng đăng nhập và 2FA

1. Người dùng gửi email/mật khẩu tại `/login`.
2. Mật khẩu đúng chỉ tạo pending challenge HttpOnly, chưa tạo session.
3. Tài khoản chưa enroll được chuyển tới `/login/setup-2fa`; tài khoản đã enroll tới `/login/verify-2fa`.
4. TOTP hoặc recovery code hợp lệ mới cho Auth.js tạo session.
5. Redirect dùng đường dẫn tương đối `/dashboard`, không hardcode localhost.

Challenge mặc định tồn tại 10 phút, tối đa 5 lần thử và cho phép lệch TOTP hai chu kỳ 30 giây. Không log password, pending token, TOTP, recovery code hoặc encryption secret.

### Avatar

- `/profile` nhận JPG/JPEG/PNG/WEBP trực tiếp từ máy tính.
- UI có preview, loading và lỗi tiếng Việt.
- Server kiểm tra MIME, phần mở rộng và kích thước.
- Cloudinary crop ảnh vuông 512×512 trong `bugflow/avatars`.
- Database lưu `avatarUrl` và `avatarPublicId`; ảnh cũ được dọn sau khi cập nhật thành công.
- Khi `avatarUrl` là null, header và profile dùng avatar biểu tượng mặc định nội bộ.
- Migration liên quan: `20260720090000_avatar_upload`.

### Attachment khi tạo Bug

Form `/bugs/new` cho chọn tối đa `BUG_ATTACHMENT_MAX_FILES` file. UI hiển thị tên, kích thước, preview ảnh, nút bỏ file và trạng thái riêng cho từng upload.

Luồng luôn theo thứ tự:

```text
Tạo Bug → nhận bugId → upload tuần tự qua /api/uploads → mở /bugs/{bugId}
```

Không có file nào được gửi lên Cloudinary trước khi Bug tồn tại. Nếu một phần upload lỗi, Bug và các file đã thành công vẫn được giữ; UI nêu rõ file lỗi và cho mở trang chi tiết để tải lại.

Định dạng hỗ trợ: JPG/JPEG/PNG/WEBP/GIF, TXT/LOG/NDJSON, PDF, MP4 và WEBM. Server tiếp tục kiểm tra loại file, kích thước, số lượng, auth, quyền dự án, rate limit và same-origin. Nếu Cloudinary thành công nhưng ghi database thất bại, asset được cleanup.

### Bảo mật

#### Rate limiting

Rate limit dùng bảng PostgreSQL `RateLimitBucket`, hoạt động xuyên nhiều Vercel instance. Identifier được SHA-256 trước khi lưu.

| Flow | Giới hạn ứng dụng |
|---|---:|
| Login | 5/10 phút theo IP và email |
| Verify 2FA | 5/10 phút theo IP và challenge |
| Register | 5/1 giờ theo IP và email |
| Tạo Bug/Comment | 20/1 phút/user |
| Cập nhật Bug/Comment | 30/1 phút/user |
| Tạo Project | 10/1 phút/user |
| Admin mutation | 30/1 phút/Admin |
| Upload attachment/avatar | 10/1 phút/user |

Vượt giới hạn trả HTTP `429` với thông báo tiếng Việt.

#### Same-Origin / CSRF

Các Route Handler mutation dùng `assertSameOriginRequest()` để kiểm tra `Origin`, `Host`, `X-Forwarded-Host` và `Sec-Fetch-Site`. Request cross-site không tin cậy trả HTTP `403`. GET chỉ đọc không bị chặn.

Nếu có frontend đáng tin cậy khác origin, khai báo chính xác, không dùng wildcard:

```env
ALLOWED_ORIGINS="https://app.example.com,https://admin.example.com"
```

#### Vercel Firewall/WAF

Kế hoạch endpoint, rate limit, Challenge và IP block nằm tại [`bao-cao-vercel-waf.md`](./bao-cao-vercel-waf.md). Rule phải được cấu hình thủ công trong Vercel Dashboard, bắt đầu bằng Log rồi mới chuyển sang 429/Challenge sau khi kiểm tra false-positive.

### Kiểm tra chất lượng

```bash
npm run lint
npm run test
npm run type-check
npm run build
```

Trạng thái xác minh gần nhất: 24 test files, 80 tests đạt; Prisma validate/generate, lint, TypeScript và production build đều thành công.

### Deploy lên Vercel

1. Thêm các biến trong `.env.example` vào Vercel.
2. Không đặt `AUTH_URL`/`NEXTAUTH_URL` thành localhost trong Production hoặc Preview. Có thể bỏ `AUTH_URL` để Auth.js dùng request host hiện tại, hoặc đặt domain HTTPS chính xác.
3. Chạy `npm run db:deploy` trong môi trường release tin cậy.
4. Redeploy sau khi thay đổi environment variables.
5. Kiểm tra login bắt buộc 2FA, database read/write, avatar, attachment, cron và HTTP 403/429.
6. Không lưu upload trên filesystem Vercel và không expose secret qua `NEXT_PUBLIC_*`.

### AI Chatbot và Chat nội bộ

- Nút AI nổi trong dashboard hỗ trợ `GUIDE`, `IMPROVE_BUG`, `CLASSIFY_BUG`. Nếu mở từ trang Bug, client chỉ gửi `bugId`; server tự tải context sau khi kiểm tra quyền.
- AI không lưu transcript, không gửi secret/email/attachment URL và không có quyền mutation. Provider dùng API OpenAI-compatible; toàn bộ biến `AI_*` là server-side.
- `/chat` hỗ trợ Project, Direct và Support. Project `VIEWER` chỉ đọc; Direct yêu cầu hai user active có project chung; Support do user mở với Admin.
- Tin nhắn được ghi PostgreSQL trước notification, có `clientId` chống gửi trùng và polling 4–5 giây. Chưa có attachment, presence hoặc typing indicator.
- Cần chạy migration `20260720150000_ai_chat_and_realtime_chat` và cấu hình các biến AI trong `.env.example`.

### Giới hạn và bước tiếp theo

- Chưa có Playwright E2E cho toàn bộ workflow.
- Cần tiếp tục kiểm thử production thực tế cho Cloudinary, email/notification và WAF traffic baseline.
- Không block IP/quốc gia hoặc Challenge toàn ứng dụng nếu chưa có bằng chứng abuse.

---

## English

### Introduction

BugFlow is an issue and bug-tracking application for software teams. It uses Next.js, TypeScript, Prisma, and Neon PostgreSQL, with an emphasis on controlled workflows, server-side authorization, auditability, and serverless deployment on Vercel.

Public user documentation is available at `/docs`. Detailed implementation history is maintained in [`nhat-ki-phases.md`](./nhat-ki-phases.md).

### Main features

- Registration, sign-in, and sign-out with JWT sessions stored in HTTP-only cookies.
- Mandatory TOTP or recovery-code 2FA before a full session is issued.
- Profile management, password changes, and avatar upload from the user's computer.
- Cloudinary avatars with an internal default avatar for accounts without an image.
- Admin user management: search, create, edit, role changes, lock, unlock, and deactivate.
- Project, membership, and project-role management.
- Bug creation, editing, searching, filtering, sorting, and pagination.
- Role-aware Bug workflow, priority, severity, assignee, and self-assignment.
- Comments, mentions, activity timeline, and notifications.
- Global and project dashboards with charts.
- Drag-and-drop Kanban with workflow validation and optimistic rollback.
- Cloudinary attachments for images, logs, text, PDFs, and video.
- Up to five attachments can be selected in the New Bug form; the Bug is always created before uploads begin.
- Server-side membership and permission checks to prevent IDOR.
- Persistent PostgreSQL rate limiting and Same-Origin/CSRF guards for mutation APIs.

### Technology

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4, Lucide React
- Auth.js Credentials, JWT, bcryptjs, OTPAuth
- Prisma 7, `@prisma/adapter-pg`, Neon PostgreSQL
- Zod, React Hook Form, TanStack Query
- Recharts, DnD Kit, Cloudinary
- Vitest

### Architecture

```text
Browser
  → Server Components / Client Components
  → Server Actions / Route Handlers
  → Validation + authentication + authorization
  → Feature services / workflow policies
  → Prisma singleton + PostgreSQL adapter
  → Neon PostgreSQL / Cloudinary
```

Business logic lives in feature services. Every mutation repeats authentication and authorization on the server. Queries use `select`/DTO boundaries so sensitive fields such as `passwordHash` are never sent to clients.

```text
src/
  app/              Pages, layouts, and Route Handlers
  components/       Domain-oriented UI
  features/         Actions, services, and business logic
  lib/              Auth, Prisma, validation, and security helpers
  generated/        Generated Prisma Client
prisma/
  migrations/       Database migrations
  schema.prisma     Data model
  seed.ts           Demo data
tests/              Vitest tests
```

### Roles and permissions

| Scope | Roles |
|---|---|
| System | `ADMIN`, `MEMBER`, `TESTER` |
| Project | `PROJECT_MANAGER`, `DEVELOPER`, `TESTER`, `VIEWER` |

Permissions are enforced in the service layer. Hiding a UI control is never treated as authorization.

### Main routes

| Route | Purpose |
|---|---|
| `/login` | Email/password sign-in |
| `/login/setup-2fa` | Mandatory first-login 2FA enrollment |
| `/login/verify-2fa` | TOTP verification |
| `/dashboard` | System overview |
| `/projects` | Project list and management |
| `/bugs` | Bug list |
| `/bugs/new` | New Bug form with attachment selection |
| `/bugs/[bugId]` | Details, workflow, comments, and attachments |
| `/my-bugs` | Bugs related to the current user |
| `/profile` | Profile, avatar, and password |
| `/settings/security` | Security settings and recovery codes |
| `/admin/users` | Admin-only user management |
| `/docs` | In-app public documentation |

Primary APIs are exposed under `/api/bugs`, `/api/comments`, `/api/projects`, `/api/notifications`, `/api/admin/users`, `/api/uploads`, and `/api/attachments`.

### Local setup

#### 1. Prepare services

- Create a Neon PostgreSQL database.
- Create a Cloudinary project for avatars and attachments.
- Obtain a pooled connection string for runtime and a direct connection string for migrations.

#### 2. Configure the environment

Copy `.env.example` to `.env.local`. Never commit `.env.local`.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler.neon.tech/DB?sslmode=verify-full"
DIRECT_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=verify-full"

AUTH_SECRET="a-long-random-secret"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ALLOWED_ORIGINS=""

TWO_FACTOR_ENCRYPTION_KEY="base64-encoded-32-byte-key"
TWO_FACTOR_CHALLENGE_TTL_MINUTES="10"
TWO_FACTOR_MAX_ATTEMPTS="5"
TWO_FACTOR_TOTP_WINDOW="2"

CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
UPLOAD_MAX_SIZE_MB="10"
BUG_ATTACHMENT_MAX_FILES="5"
AVATAR_MAX_SIZE_MB="5"

CRON_SECRET="a-long-random-secret"
```

Generate `AUTH_SECRET` and the 2FA encryption key with Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Use a different random value for each variable. `TWO_FACTOR_ENCRYPTION_KEY` must decode to exactly 32 bytes.

#### 3. Install and run

```bash
npm install
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. Runtime uses the pooled `DATABASE_URL`; Prisma migrations use `DIRECT_URL` through `prisma.config.ts`.

### Demo accounts

`npm run db:seed` creates these development/demo accounts:

| Role | Email |
|---|---|
| Admin | `admin@bugflow.dev` |
| Project Manager | `manager@bugflow.dev` |
| Tester | `tester@bugflow.dev` |
| Developer | `developer1@bugflow.dev` |
| Developer | `developer2@bugflow.dev` |

```text
Demo password: Password@123
```

Never reuse the demo password in production. Every account must enroll in or verify 2FA before receiving a full authenticated session.

### Sign-in and 2FA flow

1. The user submits email and password at `/login`.
2. A valid password creates only an HTTP-only pending challenge, not a session.
3. Unenrolled accounts go to `/login/setup-2fa`; enrolled accounts go to `/login/verify-2fa`.
4. Auth.js issues a session only after a valid TOTP or recovery code.
5. Post-authentication navigation uses the relative `/dashboard` path and never hardcodes localhost.

Challenges last 10 minutes by default, permit five attempts, and accept a two-step 30-second TOTP window. Passwords, pending tokens, TOTPs, recovery codes, and encryption secrets are never logged.

### Avatars

- `/profile` accepts JPG/JPEG/PNG/WEBP files from the local computer.
- The UI provides preview, loading, and error states.
- The server validates MIME type, extension, and size.
- Cloudinary crops images to 512×512 under `bugflow/avatars`.
- The database stores `avatarUrl` and `avatarPublicId`; the previous asset is cleaned up after a successful update.
- When `avatarUrl` is null, the header and profile use an internal default profile icon.
- Related migration: `20260720090000_avatar_upload`.

### Attachments in the New Bug form

`/bugs/new` accepts up to `BUG_ATTACHMENT_MAX_FILES` evidence files. The UI shows names, sizes, image previews, per-file removal, and individual upload states.

The order is always:

```text
Create Bug → receive bugId → upload sequentially through /api/uploads → open /bugs/{bugId}
```

No file reaches Cloudinary before the Bug exists. If some uploads fail, the Bug and successful files remain; the UI identifies failed files and links to the detail page for retry.

Supported formats are JPG/JPEG/PNG/WEBP/GIF, TXT/LOG/NDJSON, PDF, MP4, and WEBM. The server rechecks type, size, count, authentication, project authorization, rate limits, and same-origin rules. If Cloudinary succeeds but the database write fails, the uploaded asset is cleaned up.

### Security

#### Rate limiting

Rate limits use the PostgreSQL `RateLimitBucket` table and work across multiple Vercel instances. Identifiers are SHA-256 hashed before storage.

| Flow | Application limit |
|---|---:|
| Login | 5/10 minutes per IP and email |
| 2FA verification | 5/10 minutes per IP and challenge |
| Registration | 5/hour per IP and email |
| Bug/Comment creation | 20/minute/user |
| Bug/Comment updates | 30/minute/user |
| Project creation | 10/minute/user |
| Admin mutation | 30/minute/Admin |
| Attachment/avatar upload | 10/minute/user |

Exceeded limits return HTTP `429` with a Vietnamese user-facing message.

#### Same-Origin / CSRF

Mutation Route Handlers call `assertSameOriginRequest()` to validate `Origin`, `Host`, `X-Forwarded-Host`, and `Sec-Fetch-Site`. Untrusted cross-site requests receive HTTP `403`; read-only GET requests are unaffected.

For a trusted frontend on another origin, list exact origins without wildcards:

```env
ALLOWED_ORIGINS="https://app.example.com,https://admin.example.com"
```

#### Vercel Firewall/WAF

Endpoint priorities, rate-limit baselines, Challenge guidance, and IP-block policy are documented in [`bao-cao-vercel-waf.md`](./bao-cao-vercel-waf.md). Rules must be configured manually in the Vercel Dashboard, starting in Log mode before moving to 429 or Challenge after false-positive review.

### Quality checks

```bash
npm run lint
npm run test
npm run type-check
npm run build
```

Latest verified state: 24 test files and 80 passing tests; Prisma validation/generation, lint, TypeScript, and the production build all pass.

### Deploying to Vercel

1. Add all variables from `.env.example` to Vercel.
2. Never set `AUTH_URL`/`NEXTAUTH_URL` to localhost in Production or Preview. Remove `AUTH_URL` so Auth.js uses the current request host, or set the exact canonical HTTPS domain.
3. Run `npm run db:deploy` in a trusted release environment.
4. Redeploy after changing environment variables.
5. Verify mandatory 2FA, database reads/writes, avatars, attachments, cron execution, and HTTP 403/429 behavior.
6. Never store uploads on Vercel's filesystem or expose secrets through `NEXT_PUBLIC_*` variables.

### Limitations and next steps

- Full workflow Playwright E2E coverage has not been added yet.
- Live production testing is still needed for Cloudinary, email/notifications, and WAF traffic baselines.
- Do not block countries/IPs or challenge the entire application without evidence of abuse.
