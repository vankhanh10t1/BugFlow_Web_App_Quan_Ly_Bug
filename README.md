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
- Chat dự án, direct chat giữa user có dự án chung và kênh hỗ trợ Admin; có delivery/read receipt, media/file, nhắc hẹn, thao tác tin nhắn, adaptive polling và Ably realtime tùy chọn.

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
| `/notifications` | Danh sách và trạng thái đã đọc của thông báo |
| `/chat` | Chat dự án, chat trực tiếp và kênh hỗ trợ Admin |
| `/docs` | Tài liệu công khai có tìm kiếm, lọc theo vai trò/chủ đề, mục thu gọn và liên kết chia sẻ |

Các API chính nằm dưới `/api/bugs`, `/api/comments`, `/api/projects`, `/api/notifications`, `/api/admin/users`, `/api/uploads`, `/api/attachments`, `/api/ai/chat` và `/api/conversations`.

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
NEXT_PUBLIC_GIPHY_API_KEY=""
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

GROQ_API_KEY=""
GROQ_DEFAULT_MODEL="openai/gpt-oss-20b"
GROQ_REASONING_MODEL="openai/gpt-oss-120b"
```

Tạo `AUTH_SECRET` và khóa mã hóa 2FA bằng Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Mỗi biến phải dùng một giá trị ngẫu nhiên riêng. `TWO_FACTOR_ENCRYPTION_KEY` phải giải mã thành đúng 32 byte.

Ứng dụng hiện dùng `AUTH_URL` cho Auth.js và `NEXT_PUBLIC_APP_URL` cho URL công khai; không đọc biến `APP_URL`. Không thêm prefix `NEXT_PUBLIC_` vào bất kỳ secret nào như `AUTH_SECRET`, `CLOUDINARY_API_SECRET`, `CRON_SECRET` hoặc `GROQ_API_KEY`.

#### 3. Cài đặt và chạy

```bash
npm install
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Mở `http://localhost:3000`. Runtime dùng pooled `DATABASE_URL`; Prisma migration dùng `DIRECT_URL` qua `prisma.config.ts`.

Khi phát triển migration mới, dùng `npm run db:migrate`. Khi áp dụng migration đã có ở staging/production, dùng `npm run db:deploy`; không dùng `prisma migrate dev` trên production.

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

Mọi attachment, file chat và avatar được kiểm tra server-side theo bộ ba phần mở rộng–MIME–magic bytes. Tên file được chuẩn hóa, double extension nguy hiểm bị từ chối và Cloudinary public ID luôn là UUID ngẫu nhiên, không dựa trên tên gốc. Attachment của bug chỉ được đọc qua API có kiểm tra quyền dự án; nội dung không phải ảnh dùng `attachment` disposition, `nosniff` và không được inline preview.

### Admin audit và thu hồi phiên

Các thao tác tạo/sửa user, đổi role/status, deactivate và reset 2FA được ghi vào `AdminAuditLog`. Log chỉ chứa snapshot trường an toàn, actor/target, action, IP/User-Agent và thời điểm; không có API sửa/xóa. Admin có thể đọc có phân trang/lọc tại `GET /api/admin/audit-logs`. JWT mang `sessionVersion`; khóa, deactivate hoặc reset 2FA tăng version để phiên cũ mất hiệu lực ở request kế tiếp, đồng thời server vẫn kiểm tra `accountStatus` trong DB.

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

Trạng thái xác minh gần nhất: 28 test files, 94 tests đạt; Prisma validate/generate, lint, TypeScript và production build đều thành công.

### Deploy lên Vercel

1. Thêm các biến cần thiết trong `.env.example` vào Vercel cho đúng scope Production/Preview.
2. Không đặt `AUTH_URL`/`NEXTAUTH_URL` thành localhost trong Production hoặc Preview. Có thể bỏ `AUTH_URL` để Auth.js dùng request host hiện tại, hoặc đặt domain HTTPS chính xác.
3. Chạy `npm run db:deploy` trong môi trường release tin cậy để áp dụng migration, gồm migration AI/chat nếu chưa có.
4. Chạy `npm run build` để xác minh production build trước khi phát hành.
5. Redeploy sau khi thay đổi environment variables.
6. Kiểm tra login bắt buộc 2FA, database read/write, avatar, attachment, AI Chatbot, chat, cron và HTTP 403/429.
7. Không lưu upload trên filesystem Vercel và không expose secret qua `NEXT_PUBLIC_*`.

### AI Chatbot và Chat nội bộ

- Nút AI nổi trong dashboard hỗ trợ `GUIDE`, `IMPROVE_BUG`, `CLASSIFY_BUG`. Nếu mở từ trang Bug, client chỉ gửi `bugId`; server tự tải context sau khi kiểm tra quyền.
- AI không lưu transcript, không gửi secret/email/attachment URL và không có quyền mutation. Provider chính là GroqCloud; API key chỉ được đọc phía server.
- `/chat` hỗ trợ Project, Direct và Support. Project `VIEWER` chỉ đọc; Direct yêu cầu hai user active có project chung; Support do user mở với Admin.
- Tin nhắn được ghi PostgreSQL trước notification và có `clientId` chống gửi trùng. Client dừng polling khi tab ẩn, giãn interval khi idle và chỉ lấy tiếp bằng cursor `(createdAt, id)`; nếu cấu hình Ably, message/reaction/read receipt/revoke được đẩy realtime và polling nhẹ vẫn là fallback.
- Chat dùng picker nhẹ tự xây dựng từ `@emoji-mart/data` (tìm kiếm và phân loại emoji, không dùng wrapper React 18), polyfill font cờ cho Windows/Chromium và GIPHY React Components để tìm/gửi GIF; ngoài ra hỗ trợ sticker, reaction theo từng tin nhắn, ảnh/video/file Cloudinary, ảnh chụp màn hình theo quyền trình duyệt, nhắc hẹn, mức Quan trọng/Khẩn cấp, ghim/đánh dấu/chọn nhiều/thu hồi/xóa phía tôi và panel Thông tin hội thoại.
- Thiết lập tự ẩn, ẩn trò chuyện và xóa lịch sử đều áp dụng riêng cho người dùng hiện tại; báo xấu được lưu để quản trị xử lý. Cần chạy thêm migration `20260722130000_advanced_chat_features`.

#### Cấu hình GroqCloud

1. Truy cập [GroqCloud Console](https://console.groq.com/).
2. Đăng nhập hoặc tạo tài khoản.
3. Mở mục **API Keys** và tạo API key mới.
4. Copy key vào `.env.local`; không ghi key thật vào README hoặc Git:

```env
GROQ_API_KEY="your_groq_api_key_here"
GROQ_DEFAULT_MODEL="openai/gpt-oss-20b"
GROQ_REASONING_MODEL="openai/gpt-oss-120b"
```

`openai/gpt-oss-20b` xử lý hội thoại và tác vụ nhẹ. `openai/gpt-oss-120b` được chọn tập trung bởi `selectChatbotModel()` khi prompt dài, context lớn hoặc có yêu cầu phân tích/đánh giá/root cause/bảo mật/hướng xử lý. Khởi động lại `npm run dev` sau khi đổi env.

Khi deploy Vercel: vào **Project → Settings → Environment Variables**, thêm ba biến trên cho Production/Preview cần dùng và redeploy. Không đặt `GROQ_API_KEY` dưới tên có prefix `NEXT_PUBLIC_`.

#### Cấu hình GIPHY cho Chat

1. Truy cập [GIPHY Developers](https://developers.giphy.com/), đăng nhập và tạo Web SDK app/API key.
2. Thêm `NEXT_PUBLIC_GIPHY_API_KEY="your_giphy_web_sdk_key"` vào `.env.local`, sau đó khởi động lại dev server.
3. Trên Vercel, thêm cùng biến cho Production/Preview trước khi build rồi redeploy. Đây là public Web SDK key được đưa vào client bundle; không dùng secret khác cho biến này và không commit key thật.
4. Nếu thiếu key, Chat vẫn hoạt động bình thường nhưng nút GIF bị vô hiệu hóa và hiển thị hướng dẫn cấu hình.

### Giới hạn và bước tiếp theo

- Chưa có Playwright E2E cho toàn bộ workflow.
- Cần tiếp tục kiểm thử production thực tế cho Cloudinary, email/notification và WAF traffic baseline.
- Ably là managed pub/sub phù hợp với Vercel serverless. Token chỉ cấp quyền cho conversation đã qua membership check; typing được throttle 2 giây, tự tắt sau 5 giây và online presence dùng TTL của Ably. Thiếu `ABLY_API_KEY` thì app tự dùng adaptive polling.
- Nhắc hẹn hiện được lưu và hiển thị trong Thông tin hội thoại; tác vụ gửi notification đúng thời điểm chưa có scheduler riêng. Trình duyệt luôn quyết định nguồn được phép chụp màn hình, nên UI có fallback tải ảnh thủ công.
- Streaming/cancel phản hồi AI và audit AI nâng cao chưa được triển khai.
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
- A GroqCloud AI Chatbot for app guidance, Bug-report improvement, and priority/severity suggestions; transcripts are not persisted and the AI cannot mutate application data.
- Project, direct, and Admin-support chat persisted in PostgreSQL, with delivery/read receipts, media/files, reminders, message actions, adaptive polling, and optional Ably realtime.

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
| `/notifications` | Notifications and read status |
| `/chat` | Project, direct, and Admin-support chat |
| `/docs` | Public guides with search, role/topic filters, compact sections, and shareable links |

Primary APIs are exposed under `/api/bugs`, `/api/comments`, `/api/projects`, `/api/notifications`, `/api/admin/users`, `/api/uploads`, `/api/attachments`, `/api/ai/chat`, and `/api/conversations`.

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
NEXT_PUBLIC_GIPHY_API_KEY=""
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

GROQ_API_KEY=""
GROQ_DEFAULT_MODEL="openai/gpt-oss-20b"
GROQ_REASONING_MODEL="openai/gpt-oss-120b"
```

Generate `AUTH_SECRET` and the 2FA encryption key with Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Use a different random value for each variable. `TWO_FACTOR_ENCRYPTION_KEY` must decode to exactly 32 bytes.

The application uses `AUTH_URL` for Auth.js and `NEXT_PUBLIC_APP_URL` for its public URL; it does not read `APP_URL`. Never add a `NEXT_PUBLIC_` prefix to secrets such as `AUTH_SECRET`, `CLOUDINARY_API_SECRET`, `CRON_SECRET`, or `GROQ_API_KEY`.

### Notification preferences and scheduled worker

- Users manage notification types at `/settings/notifications` and can mute individual projects or conversations. Urgent/system notifications bypass mute.
- `GET/PATCH /api/notifications/preferences` reads or updates only the signed-in user's preferences.
- `GET/PUT /api/notifications/mutes` reads or updates a project/conversation mute after membership checks.
- `GET /api/cron/scheduled-notifications` runs the shared deadline, overdue, and chat-reminder worker. Send `Authorization: Bearer $CRON_SECRET`.
- Vercel Hobby does not schedule this route. Configure an external scheduler to call it every five minutes. Notification `dedupeKey` and `ChatMessage.reminderSentAt` make retries idempotent; the legacy `/api/cron/deadline-notifications` route remains available for compatibility.

Production currently uses `https://bug-flow-web-app-quan-ly-bug.vercel.app`. The older `https://bug-flow.vercel.app` alias is not attached to the current project and returns Vercel `DEPLOYMENT_NOT_FOUND` before the request reaches Next.js. Always copy the plain URL; Markdown such as `[text](url)` is not a valid PowerShell URI.

Test the production route from PowerShell:

```powershell
$cronSecret = Read-Host "Nhap CRON_SECRET"
$headers = @{
  Authorization = "Bearer $cronSecret"
}

Invoke-RestMethod `
  -Uri "https://bug-flow-web-app-quan-ly-bug.vercel.app/api/cron/scheduled-notifications" `
  -Method Get `
  -Headers $headers
```

Missing or invalid credentials return `401`. A valid request returns `{ "ok": true, "processed": ... }`. If `CRON_SECRET` is absent from the Production environment, the route returns `500` with a configuration message and logs no secret. Add or update the variable under Vercel Project Settings → Environment Variables, then redeploy.

#### 3. Install and run

```bash
npm install
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. Runtime uses the pooled `DATABASE_URL`; Prisma migrations use `DIRECT_URL` through `prisma.config.ts`.

Use `npm run db:migrate` only when creating migrations during development. Apply existing migrations in staging or production with `npm run db:deploy`; do not use `prisma migrate dev` in production.

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

Latest verified state: 28 test files and 94 passing tests; Prisma validation/generation, lint, TypeScript, and the production build all pass.

### Workspace triage cho Bug Management

- `/bugs` và `/my-bugs` hỗ trợ deadline (hôm nay, 7 ngày tới, quá hạn, không deadline), chưa phân công, nhãn, thành phần, phiên bản và giữ filter/sort trên URL.
- Mỗi user có saved views riêng qua `/api/bug-views`; hỗ trợ tạo, đổi tên, xóa và đặt mặc định. Filter được lưu dạng JSON đã validate.
- Bảng lỗi hỗ trợ chọn nhiều dòng, bulk assign/priority/status, modal xác nhận và báo lỗi riêng cho từng bug thất bại.
- Quick edit dùng `/api/bugs/[bugId]/quick-edit`, cập nhật optimistic và rollback khi API từ chối; Kanban tiếp tục dùng optimistic status transition.
- Metadata triage dùng `BugLabel`, `Component`, `Version` theo project. Chạy `npm run db:deploy` để áp dụng migration `20260818090000_workspace_triage` trước khi deploy app mới.
- Mọi mutation mới đều kiểm tra session active, same-origin, rate limit, Zod input và quyền project trên server. Bulk action kiểm tra độc lập từng bug, không tin selection từ client.

### Deploying to Vercel

1. Add the required variables from `.env.example` to the appropriate Production/Preview scopes in Vercel.
2. Never set `AUTH_URL`/`NEXTAUTH_URL` to localhost in Production or Preview. Remove `AUTH_URL` so Auth.js uses the current request host, or set the exact canonical HTTPS domain.
3. Run `npm run db:deploy` in a trusted release environment, including the AI/chat migration if it has not been applied.
4. Run `npm run build` before release to verify the production build.
5. Redeploy after changing environment variables.
6. Verify mandatory 2FA, database reads/writes, avatars, attachments, the AI Chatbot, chat, cron execution, and HTTP 403/429 behavior.
7. Never store uploads on Vercel's filesystem or expose secrets through `NEXT_PUBLIC_*` variables.

### AI Chatbot and internal chat

- The dashboard AI launcher supports `GUIDE`, `IMPROVE_BUG`, and `CLASSIFY_BUG`. For Bug context, the client sends only `bugId`; the server loads permitted data after authorization.
- The AI does not persist transcripts, expose secrets/email/attachment URLs, or mutate application data. GroqCloud is the current provider.
- `/chat` supports project conversations, direct conversations between active users sharing a project, and Admin support conversations. PostgreSQL stores messages, receipts and settings; adaptive incremental polling is the fallback, while optional Ably channels deliver realtime events, typing and TTL presence.
- Project `VIEWER` members are read-only. Chat uses a lightweight searchable/category picker built from `@emoji-mart/data` (without the React-18-only wrapper), a Windows/Chromium country-flag font polyfill, and GIPHY React Components for GIF search/sending; it also supports stickers, per-message emoji reactions, Cloudinary images/video/files, browser-authorized screenshots, important/urgent messages, pin/mark/multi-select/recall/delete-for-me actions, and a conversation-information panel.
- Apply migration `20260722130000_advanced_chat_features` after the base AI/chat migration. Set server-only `ABLY_API_KEY` in Vercel Production/Preview to enable managed realtime; without it, chat remains usable through adaptive polling.

#### GroqCloud configuration

1. Sign in to the [GroqCloud Console](https://console.groq.com/).
2. Open **API Keys** and create a new key.
3. Add the following server-side variables to `.env.local` or Vercel:

```env
GROQ_API_KEY="your_groq_api_key_here"
GROQ_DEFAULT_MODEL="openai/gpt-oss-20b"
GROQ_REASONING_MODEL="openai/gpt-oss-120b"
```

Restart the local server or redeploy Vercel after changing these variables. Never commit the real key or expose it with a `NEXT_PUBLIC_` prefix.

#### GIPHY configuration for Chat

Create a Web SDK app/key at [GIPHY Developers](https://developers.giphy.com/), then add `NEXT_PUBLIC_GIPHY_API_KEY="your_giphy_web_sdk_key"` to `.env.local`. Add the same variable to the required Vercel Production/Preview scopes before building and redeploy. The button is safely disabled when the key is absent; never commit a real key.

### Limitations and next steps

- Full workflow Playwright E2E coverage has not been added yet.
- Live production testing is still needed for Cloudinary, email/notifications, and WAF traffic baselines.
- Ably presence and typing degrade safely when disconnected; incremental polling remains active as fallback. Screen capture depends on the browser's source picker and permission.
- AI trả lời theo luồng và có thể dừng bằng `AbortController`; phần nội dung đã nhận vẫn được giữ lại.
- `IMPROVE_BUG` chỉ tạo bản xem trước theo các field được cho phép. User phải xác nhận trong modal trước khi `/api/ai/apply` kiểm tra lại quyền và cập nhật.
- `AIAuditLog` chỉ lưu metadata vận hành (task, model, latency, token estimate, trạng thái, target, feedback và apply status), không lưu prompt, response, context, API key, session hay secret.
- Feedback hữu ích/chưa tốt được cập nhật không reload qua `/api/ai/feedback/[auditId]` và chỉ chủ sở hữu response được thao tác.
- Do not block countries/IPs or challenge the entire application without evidence of abuse.
