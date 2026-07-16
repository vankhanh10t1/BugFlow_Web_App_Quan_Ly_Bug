# Nhật kí các phase dự án BugFlow

> Cập nhật gần nhất: 16/07/2026  
> Phạm vi hiện tại: Phase 1 đến Phase 5. Phase 6 chưa bắt đầu.  
> Nguồn đối chiếu: Git history, `README.md`, Prisma schema/migration/seed, source code và test hiện có.

## Quy ước cập nhật

- Sau khi hoàn thành mỗi phase từ Phase 6 trở đi, phải bổ sung vào file này: mục tiêu, việc đã làm, bug đã gặp, cách fix, file chính và việc còn lại.
- Không ghi một phase là hoàn thành nếu lint, type-check, test hoặc production build bắt buộc vẫn đang lỗi.
- Nội dung chưa có bằng chứng từ code, Git history hoặc kết quả kiểm tra phải ghi `Cần xác minh thêm`.

---

## Phase 1 — Khởi tạo dự án

### Mục tiêu

- Phân tích yêu cầu và chọn kiến trúc full-stack Next.js.
- Khởi tạo Next.js App Router với TypeScript, Tailwind CSS và ESLint.
- Tạo cấu trúc thư mục, cấu hình shadcn/ui, biến môi trường mẫu và README ban đầu.
- Đảm bảo dự án có thể lint, type-check và production build.

### Đã làm

- Khởi tạo Next.js 16.2.10, React 19.2.4 và TypeScript.
- Cấu hình App Router trong `src/app` và Tailwind CSS 4.
- Thêm quy ước shadcn/ui qua `components.json`, utility `cn()` và button primitive ban đầu.
- Tạo landing page BugFlow và metadata cơ bản.
- Tạo các thư mục domain dự kiến trong `src/features`, `src/components`, `src/lib`, `tests` và `prisma`.
- Thêm scripts `lint`, `type-check`, `test`, `build` và các scripts Prisma.
- Thêm security headers cơ bản trong Next config.
- Tạo `.env.example`; `.env.local` và các file `.env*` khác được Git bỏ qua.

### Đã chỉnh sửa/cải thiện

- Đổi package name từ tên scaffold `bugflow-app` thành `bugflow`.
- Thay giao diện mặc định của Create Next App bằng landing page riêng.
- Thêm `.gitignore` cho generated Prisma client và file yêu cầu nội bộ `yêu cầu code.md`.

### Bug gặp phải

1. `create-next-app` từ chối khởi tạo trực tiếp trong thư mục `BugFlow` vì npm package name không được chứa chữ hoa.
2. Lần kiểm tra dependency ban đầu báo các cảnh báo moderate từ `npm audit`.

### Cách fix

1. Khởi tạo scaffold trong thư mục tạm có tên hợp lệ `bugflow-app`, sau đó chuyển scaffold vào workspace `D:\BugFlow` và đặt package name là `bugflow`.
2. Không chạy `npm audit fix --force` vì có thể gây breaking change. Cảnh báo được giữ lại để đánh giá dependency có kiểm soát.

### File/khu vực liên quan

- `package.json`
- `next.config.ts`
- `components.json`
- `.env.example`
- `.gitignore`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/components/ui/button.tsx`
- `src/lib/utils.ts`

### Kiểm tra

- Commit liên quan trong Git: `ade1c4e` (`Phase 1 done, Phase 2 gần done`).
- Lint, type-check và production build đã chạy thành công ở thời điểm hoàn thành phase.

### Ghi chú còn tồn đọng

- Các cảnh báo moderate từ dependency cần được rà soát định kì; không có bằng chứng rằng đã xử lý hết.
- Kiểm thử trực quan trên nhiều trình duyệt: **Cần xác minh thêm**.

---

## Phase 2 — Neon PostgreSQL và Prisma

### Mục tiêu

- Cấu hình Prisma cho Neon PostgreSQL, pooled runtime connection và direct migration connection.
- Thiết kế database schema, migration, Prisma singleton và seed idempotent.
- Xác minh migration/seed trên Neon thật.

### Đã làm

- Cấu hình Prisma 7.8.0 với `@prisma/adapter-pg`.
- Tạo `prisma.config.ts`; Prisma CLI dùng `DIRECT_URL`, runtime dùng pooled `DATABASE_URL`.
- Tạo Prisma singleton để tránh tạo client mới cho mỗi request trong development/serverless.
- Thiết kế các model: `User`, `Project`, `ProjectMember`, `Bug`, `Comment`, `Attachment`, `ActivityLog`, `Notification`, `Account`, `Session`, `VerificationToken`.
- Tạo đầy đủ enum, foreign key, composite unique và index phục vụ filter.
- Tạo initial migration PostgreSQL.
- Tạo seed có thể chạy lại gồm 5 user demo, 2 project, 8 membership, 18 bug và dữ liệu comment/activity/notification.
- Hash password demo bằng bcrypt trước khi lưu.
- Áp migration thành công lên Neon và chạy seed nhiều lần để kiểm tra idempotency.
- Xác minh số đếm trên Neon: 5 user, 2 project, 8 membership và 18 bug; seed không nhân đôi các dữ liệu lõi.

### Đã chỉnh sửa/cải thiện

- Bổ sung `@next/env` để Prisma CLI và seed đọc đúng `.env.local` theo cách Next.js nạp biến môi trường.
- Bổ sung README với ERD Mermaid, workflow, hướng dẫn Neon, migration, seed và deployment.
- Tạo atomic counter `Project.nextBugNumber` và unique constraint `(projectId, sequenceNumber)` để chuẩn bị sinh bug code an toàn.

### Bug gặp phải

1. Prisma schema không validate vì các enum ban đầu được viết trên một dòng; Prisma hiểu các model phía sau vẫn nằm trong enum đầu tiên.
2. TypeScript báo lỗi khi kiểm tra một union `BugStatus` bằng `.includes()` trên mảng trạng thái bị suy luận quá hẹp trong seed.
3. `dotenv/config` không tự đọc `.env.local`, khiến Prisma migration/seed có nguy cơ báo thiếu `DIRECT_URL` dù file đã được cấu hình.
4. Lần đầu chạy `prisma migrate deploy` trong sandbox chỉ trả `Schema engine error` do kết nối mạng bị giới hạn.
5. PostgreSQL driver cảnh báo rằng ý nghĩa `sslmode=require` có thể thay đổi ở major version tiếp theo của `pg`/`pg-connection-string`.

### Cách fix

1. Chuyển mọi enum sang cú pháp nhiều dòng hợp lệ rồi chạy lại `prisma format`, `prisma validate` và `prisma generate`.
2. Tạo `Set<BugStatus>` cho nhóm trạng thái resolved trước khi gọi `.has()`.
3. Dùng `loadEnvConfig(process.cwd())` từ `@next/env` trong cả `prisma.config.ts` và `prisma/seed.ts`.
4. Chạy lại migration với quyền kết nối Neon; initial migration được áp thành công.
5. Giữ `sslmode=require` theo yêu cầu Neon hiện tại và chưa tự ý đổi connection string của người dùng.

### File/khu vực liên quan

- `prisma/schema.prisma`
- `prisma/migrations/20260716000000_init/migration.sql`
- `prisma/migrations/migration_lock.toml`
- `prisma/seed.ts`
- `prisma.config.ts`
- `src/lib/prisma.ts`
- `.env.example`
- `README.md`

### Kiểm tra

- Commit liên quan trong Git: `13f08e4` (`Phase 2 done`).
- Prisma format, validate và generate: đạt.
- Migration Neon: đã áp thành công.
- Seed chạy lại: đạt, không nhân đôi dữ liệu lõi.
- Lint, type-check, test và production build: đạt tại thời điểm hoàn thành phase.

### Ghi chú còn tồn đọng

- Cần đánh giá lại SSL parameters khi nâng lên `pg` 9 hoặc `pg-connection-string` 3.
- Neon connection string và secret chỉ nằm trong `.env.local`, không được ghi vào nhật kí hoặc commit.

---

## Phase 3 — Authentication và authorization nền tảng

### Mục tiêu

- Xây dựng đăng ký, đăng nhập, đăng xuất bằng email/password.
- Dùng Auth.js Credentials Provider, JWT session và bcrypt.
- Bảo vệ route, kiểm tra tài khoản active và cung cấp RBAC phía server.
- Cho phép cập nhật profile và đổi mật khẩu.

### Đã làm

- Cài Auth.js 5 beta, React Hook Form, resolvers và `server-only`.
- Tạo Credentials Provider; `authorize()` kiểm tra Zod, password hash và `accountStatus`.
- Tạo JWT session 8 giờ; session chỉ chứa ID, email, system role và thông tin hiển thị cần thiết.
- Không đưa `passwordHash` vào session, response hoặc Client Component.
- Tạo trang `/login`, `/register`, `/dashboard`, `/profile`.
- Tạo đăng ký, đăng nhập, đăng xuất, cập nhật profile và đổi mật khẩu bằng Server Actions/service layer.
- Tạo API Auth.js, `POST /api/auth/register` và `GET /api/users/me`.
- Tạo server DAL `getCurrentUser()`, `requireActiveUser()`, `requirePageUser()` và `requireSystemRole()`.
- Tạo Next.js 16 `proxy.ts` để optimistic route protection; thao tác dữ liệu vẫn kiểm tra account status lại trong server DAL.
- Tạo permission helpers cho system role/project role.
- Thêm test validation, password hashing, active/locked login và permission.

### Đã chỉnh sửa/cải thiện

- Dùng `proxy.ts` thay cho `middleware.ts` vì Next.js 16 đã đổi convention và deprecate middleware cũ.
- Tách `auth.config.ts` khỏi service/database logic.
- Chuẩn hóa success/error API response và không trả stack trace cho client.

### Bug gặp phải

1. Test login thất bại khi email có khoảng trắng vì Zod validate email trước khi `.trim()`.
2. TypeScript coi `token.systemRole`/`user.systemRole` là `unknown` trong callback Auth.js.
3. Next.js build báo `src/proxy.ts must export a function` vì destructuring export không được static analyzer nhận diện.
4. Production build trong sandbox không tải được Google Fonts.

### Cách fix

1. Chuyển email schema sang `z.string().trim().toLowerCase().pipe(z.email(...))` để normalize trước khi validate format.
2. Bổ sung module augmentation cho Auth.js và cast có kiểm soát sang generated `SystemRole` tại callback boundary.
3. Dùng pattern re-export chính thức: `export { auth as proxy } from "@/auth"`.
4. Chạy lại build với quyền mạng; build production thành công.

### File/khu vực liên quan

- `src/auth.ts`
- `src/auth.config.ts`
- `src/proxy.ts`
- `src/types/next-auth.d.ts`
- `src/lib/auth.ts`
- `src/lib/permissions.ts`
- `src/lib/validators/auth.ts`
- `src/features/auth/`
- `src/features/users/`
- `src/app/(auth)/`
- `src/app/(dashboard)/dashboard/`
- `src/app/(dashboard)/profile/`
- `src/app/api/auth/`
- `src/app/api/users/me/`
- `tests/auth-service.test.ts`
- `tests/auth-validation.test.ts`
- `tests/permissions.test.ts`

### Kiểm tra

- Commit liên quan trong Git: `d1650a0` (`Phase 3 done`).
- Tại thời điểm hoàn thành: lint, type-check và build đạt; 9/9 test đạt.

### Ghi chú còn tồn đọng

- Dự án đang dùng `next-auth@5.0.0-beta.31`; cần rà soát breaking changes trước khi nâng phiên bản.
- Rate limiting cho login/register chưa được triển khai.
- E2E browser test cho login/logout/session expiry: **Cần xác minh thêm**.

---

## Phase 4 — Quản lý project

### Mục tiêu

- Xây dựng Project CRUD, project member, project role và phân quyền truy cập project.
- Cung cấp UI, Server Actions và REST Route Handlers dùng chung service layer.
- Chống truy cập project bằng cách đoán ID.

### Đã làm

- Tạo project, cập nhật thông tin và archive project.
- Tạo danh sách project có search, status filter và pagination phía server.
- Tạo trang chi tiết và settings project.
- Thêm, xóa thành viên và cập nhật project role.
- Chỉ liệt kê user `ACTIVE` chưa thuộc project khi thêm thành viên.
- Không cho xóa hoặc hạ quyền project manager cuối cùng.
- Tạo activity log trong transaction cho project update/archive và member add/role/remove.
- Tạo API cho collection, detail và project members.
- Tạo confirmation dialog trước khi archive.
- Thêm navigation tới Projects.

### Đã chỉnh sửa/cải thiện

- Sửa permission model để system role `PROJECT_MANAGER` chỉ cho phép tạo project; không tự động cho phép quản lý mọi project.
- Project hiện hữu chỉ được quản lý bởi `ADMIN` hoặc thành viên có project role `MANAGER`.
- Mọi service đọc/ghi project kiểm tra membership phía server.

### Bug gặp phải

1. Audit trước Phase 4 phát hiện helper `canManageProject()` cũ trả `true` cho mọi system `PROJECT_MANAGER`, có thể gây IDOR đối với project không liên quan.
2. Không phát hiện lỗi compile/test khác trong log thực hiện Phase 4.

### Cách fix

1. Loại system role `PROJECT_MANAGER` khỏi quyền quản lý project hiện hữu; thêm helper riêng `canCreateProject()` và bắt buộc project role `MANAGER` cho update/member settings.
2. Bổ sung test xác nhận project manager có thể tạo project nhưng không quản lý project không có membership.

### File/khu vực liên quan

- `src/features/projects/service.ts`
- `src/features/projects/actions.ts`
- `src/lib/validators/project.ts`
- `src/lib/permissions.ts`
- `src/app/(dashboard)/projects/`
- `src/app/api/projects/`
- `src/components/projects/`
- `src/components/layout/dashboard-header.tsx`
- `tests/project-service.test.ts`
- `tests/project-validation.test.ts`
- `tests/permissions.test.ts`

### Kiểm tra

- Lint: đạt.
- Type-check: đạt.
- Test tại thời điểm hoàn thành: 15/15 đạt.
- Production build: đạt.
- `git diff --check`: đạt.

### Ghi chú còn tồn đọng

- Git history hiện chưa có commit Phase 4 riêng; source Phase 4 đang nằm trong working tree cùng các thay đổi Phase 5.
- E2E browser test cho create project và member management: **Cần xác minh thêm**.
- Chưa có UI hiển thị project activity timeline; dữ liệu audit đã được ghi và phần hiển thị thuộc phase sau.

---

## Bổ sung trước Phase 5 — Login CTA và tài liệu công khai

### Mục tiêu

- Làm rõ người dùng bấm ở đâu để đăng nhập.
- Loại link GitHub chung khỏi nút `Tài liệu dự án` để UI không dẫn người dùng thường tới source repository.

### Đã làm

- Landing page hiển thị nút `Đăng nhập` khi chưa có session.
- Khi đã đăng nhập, landing page hiển thị tên user, link dashboard và nút đăng xuất.
- Tạo route public `/docs` với mô tả app, tính năng, công nghệ, hướng dẫn và credential demo được chọn lọc.
- Nút `Tài liệu dự án` trỏ tới `/docs` thay vì `github.com`.
- README mô tả login flow, demo account và HTTP-only JWT cookie.
- Sau phản hồi UI, xóa link `Tài liệu` trùng lặp cạnh nút đăng nhập; giữ CTA tài liệu trong hero.

### Bug gặp phải

1. Landing page ban đầu không có CTA đăng nhập rõ ràng dù login logic đã tồn tại.
2. Nút tài liệu trỏ tới `https://github.com` chung, không phải tài liệu cụ thể.
3. Sau khi thêm `/docs`, landing page có hai link tài liệu gần nhau.

### Cách fix

1. Thêm UI theo session state trên landing page.
2. Tạo docs nội bộ và loại mọi link GitHub khỏi UI/README công khai.
3. Xóa link tài liệu trên navbar, giữ một CTA `Tài liệu dự án` trong hero.

### File/khu vực liên quan

- `src/app/page.tsx`
- `src/app/docs/page.tsx`
- `src/auth.config.ts`
- `README.md`

### Ghi chú còn tồn đọng

- Nội dung `/docs` hiện là tài liệu công khai ngắn gọn, không đồng bộ tự động từ README.

---

## Phase 5 — Bug core và developer assignment

### Mục tiêu

- Xây dựng tạo bug, danh sách, chi tiết, update, server-side pagination/search/filter/sort.
- Quản lý priority, severity và developer assignment.
- Sinh bug code an toàn khi có nhiều request đồng thời.
- Chống IDOR và ghi audit/notification trong transaction.

### Đã làm

- Tạo bug trong project mà actor có quyền report.
- Chỉ `ADMIN`, project `MANAGER` hoặc project `TESTER` được tạo bug.
- Sinh `bugCode` bằng phép tăng atomic `Project.nextBugNumber`; không dùng `count + 1`.
- Tạo bug và `BUG_CREATED` activity trong cùng transaction.
- Cho manager/admin cập nhật bug; reporter chỉ sửa bug do mình tạo khi status còn `NEW`.
- Tạo `/bugs`, `/bugs/new`, `/bugs/[bugId]` và `/my-bugs`.
- Thêm server-side search theo bug code/title, filter project/status/priority/severity/assignee/reporter/overdue, sorting và pagination.
- Thêm priority/severity badge và control cho manager.
- Assign/reassign/unassign developer; chỉ cho phép active project member có role `DEVELOPER`.
- Cho project developer self-assign bug chưa có assignee.
- Khi assign bug `NEW`, tự chuyển sang `ASSIGNED`; khi unassign bug `ASSIGNED`, chuyển về `NEW`.
- Ghi bug update, activity log và notification assignment trong transaction.
- Tạo Route Handlers cho bug collection/detail/assignee/priority/severity.
- Thêm test cho validation, atomic counter, assignment audit + notification và outsider đoán bug ID.

### Đã chỉnh sửa/cải thiện

- Kết hợp filter `overdue` bằng `AND` để không ghi đè filter `status`.
- Bổ sung đầy đủ filter UI cho severity, assignee, reporter và sort sau audit cuối.
- Thêm Bugs/My bugs vào dashboard navigation.

### Bug gặp phải

1. Khi chạy `type-check` và `next build` song song, cả hai cùng ghi `.next/types`, gây lỗi tạm thời `Cannot find module './routes.js'`.
2. Build trong sandbox lại không tải được Google Fonts.
3. Audit cuối phát hiện UI filter ban đầu thiếu severity, assignee, reporter và sort dù service/API đã hỗ trợ.

### Cách fix

1. Chuyển quality gates có dùng chung `.next` sang chạy tuần tự: lint → test → build → type-check.
2. Chạy build với quyền mạng; production build thành công.
3. Bổ sung `listBugPeople()` và các filter control tương ứng; mọi filter tiếp tục được thực thi bởi Prisma ở server.

### File/khu vực liên quan

- `src/features/bugs/service.ts`
- `src/features/bugs/actions.ts`
- `src/features/bugs/workflow.ts`
- `src/lib/validators/bug.ts`
- `src/app/(dashboard)/bugs/`
- `src/app/(dashboard)/my-bugs/`
- `src/app/api/bugs/`
- `src/components/bugs/`
- `src/components/layout/dashboard-header.tsx`
- `tests/bug-service.test.ts`
- `tests/bug-validation.test.ts`
- `tests/workflow.test.ts`

### Kiểm tra

- Lint: đạt.
- Type-check: đạt.
- Test: 21/21 đạt trên 8 test files.
- Production build: đạt; các route bug được Next.js nhận diện.
- `git diff --check`: đạt.

### Ghi chú còn tồn đọng

- Git history hiện chưa có commit Phase 5 riêng; source Phase 5 đang nằm trong working tree.
- Chưa thực hiện stress test thật với nhiều request Neon đồng thời; atomic database increment và unique constraints đã có, nhưng tải concurrency thực tế: **Cần xác minh thêm**.
- E2E browser flow tester tạo bug → manager assign → developer xem `/my-bugs`: **Cần xác minh thêm**.
- Status transition đầy đủ, comment, activity timeline UI và notification polling chưa triển khai; thuộc Phase 6.

---

## Phase 6 — Chưa bắt đầu

### Phạm vi dự kiến theo đặc tả

- Status transition theo workflow và role.
- Activity timeline.
- Comment create/edit/delete và mention cơ bản.
- Notification và polling.

### Trạng thái

Chưa triển khai. Phải cập nhật phần này sau khi Phase 6 hoàn thành, bao gồm bug gặp phải, cách fix, file chính và việc còn lại.
