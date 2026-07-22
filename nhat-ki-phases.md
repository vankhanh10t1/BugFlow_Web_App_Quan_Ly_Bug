# Nhật kí dự án BugFlow

> Nội dung được nhóm theo ngày có trong nhật kí cũ; các mục hiện đã có ngày đối chiếu rõ ràng.

## Ngày 16/07/2026

### Công việc đã làm

#### Phase 1 — Khởi tạo dự án


##### Mục tiêu

- Phân tích yêu cầu và chọn kiến trúc full-stack Next.js.
- Khởi tạo Next.js App Router với TypeScript, Tailwind CSS và ESLint.
- Tạo cấu trúc thư mục, cấu hình shadcn/ui, biến môi trường mẫu và README ban đầu.
- Đảm bảo dự án có thể lint, type-check và production build.

##### Đã làm

- Khởi tạo Next.js 16.2.10, React 19.2.4 và TypeScript.
- Cấu hình App Router trong `src/app` và Tailwind CSS 4.
- Thêm quy ước shadcn/ui qua `components.json`, utility `cn()` và button primitive ban đầu.
- Tạo landing page BugFlow và metadata cơ bản.
- Tạo các thư mục domain dự kiến trong `src/features`, `src/components`, `src/lib`, `tests` và `prisma`.
- Thêm scripts `lint`, `type-check`, `test`, `build` và các scripts Prisma.
- Thêm security headers cơ bản trong Next config.
- Tạo `.env.example`; `.env.local` và các file `.env*` khác được Git bỏ qua.

##### Đã chỉnh sửa/cải thiện

- Đổi package name từ tên scaffold `bugflow-app` thành `bugflow`.
- Thay giao diện mặc định của Create Next App bằng landing page riêng.
- Thêm `.gitignore` cho generated Prisma client và file yêu cầu nội bộ `yêu cầu code.md`.

#### Phase 2 — Neon PostgreSQL và Prisma


##### Mục tiêu

- Cấu hình Prisma cho Neon PostgreSQL, pooled runtime connection và direct migration connection.
- Thiết kế database schema, migration, Prisma singleton và seed idempotent.
- Xác minh migration/seed trên Neon thật.

##### Đã làm

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

##### Đã chỉnh sửa/cải thiện

- Bổ sung `@next/env` để Prisma CLI và seed đọc đúng `.env.local` theo cách Next.js nạp biến môi trường.
- Bổ sung README với ERD Mermaid, workflow, hướng dẫn Neon, migration, seed và deployment.
- Tạo atomic counter `Project.nextBugNumber` và unique constraint `(projectId, sequenceNumber)` để chuẩn bị sinh bug code an toàn.

#### Phase 3 — Authentication và authorization nền tảng


##### Mục tiêu

- Xây dựng đăng ký, đăng nhập, đăng xuất bằng email/password.
- Dùng Auth.js Credentials Provider, JWT session và bcrypt.
- Bảo vệ route, kiểm tra tài khoản active và cung cấp RBAC phía server.
- Cho phép cập nhật profile và đổi mật khẩu.

##### Đã làm

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

##### Đã chỉnh sửa/cải thiện

- Dùng `proxy.ts` thay cho `middleware.ts` vì Next.js 16 đã đổi convention và deprecate middleware cũ.
- Tách `auth.config.ts` khỏi service/database logic.
- Chuẩn hóa success/error API response và không trả stack trace cho client.

#### Phase 4 — Quản lý project


##### Mục tiêu

- Xây dựng Project CRUD, project member, project role và phân quyền truy cập project.
- Cung cấp UI, Server Actions và REST Route Handlers dùng chung service layer.
- Chống truy cập project bằng cách đoán ID.

##### Đã làm

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

##### Đã chỉnh sửa/cải thiện

- Sửa permission model để system role `PROJECT_MANAGER` chỉ cho phép tạo project; không tự động cho phép quản lý mọi project.
- Project hiện hữu chỉ được quản lý bởi `ADMIN` hoặc thành viên có project role `MANAGER`.
- Mọi service đọc/ghi project kiểm tra membership phía server.

#### Bổ sung trước Phase 5 — Login CTA và tài liệu công khai


##### Mục tiêu

- Làm rõ người dùng bấm ở đâu để đăng nhập.
- Loại link GitHub chung khỏi nút `Tài liệu dự án` để UI không dẫn người dùng thường tới source repository.

##### Đã làm

- Landing page hiển thị nút `Đăng nhập` khi chưa có session.
- Khi đã đăng nhập, landing page hiển thị tên user, link dashboard và nút đăng xuất.
- Tạo route public `/docs` với mô tả app, tính năng, công nghệ, hướng dẫn và credential demo được chọn lọc.
- Nút `Tài liệu dự án` trỏ tới `/docs` thay vì `github.com`.
- README mô tả login flow, demo account và HTTP-only JWT cookie.
- Sau phản hồi UI, xóa link `Tài liệu` trùng lặp cạnh nút đăng nhập; giữ CTA tài liệu trong hero.

#### Phase 5 — Bug core và developer assignment


##### Mục tiêu

- Xây dựng tạo bug, danh sách, chi tiết, update, server-side pagination/search/filter/sort.
- Quản lý priority, severity và developer assignment.
- Sinh bug code an toàn khi có nhiều request đồng thời.
- Chống IDOR và ghi audit/notification trong transaction.

##### Đã làm

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

##### Đã chỉnh sửa/cải thiện

- Kết hợp filter `overdue` bằng `AND` để không ghi đè filter `status`.
- Bổ sung đầy đủ filter UI cho severity, assignee, reporter và sort sau audit cuối.
- Thêm Bugs/My bugs vào dashboard navigation.

#### Phase 6 — Workflow, trao đổi và thông báo


##### Mục tiêu

- Hoàn thiện chuyển trạng thái bug theo workflow, project role và người được giao xử lý.
- Hiển thị lịch sử hoạt động chỉ đọc trên trang chi tiết bug.
- Cung cấp comment create/edit/delete, mention `@username` và thông báo liên quan.
- Cung cấp danh sách notification, số chưa đọc và polling phù hợp với Vercel Serverless.

##### Đã làm

- Tạo service chuyển trạng thái; chỉ manager/admin, tester hoặc developer được assign mới có các transition phù hợp.
- Ghi `resolvedAt`, `closedAt`, activity `STATUS_CHANGED` và notification trong cùng transaction với cập nhật status.
- Thêm control workflow trên trang chi tiết bug và chỉ hiển thị các trạng thái actor hiện tại được phép chọn.
- Thêm activity timeline chỉ đọc, sắp xếp mới nhất trước và giới hạn 100 bản ghi.
- Thêm comment theo thứ tự thời gian; tác giả được sửa/xóa comment của mình, admin/project manager được xóa comment không phù hợp bằng soft delete.
- Parse mention `@username` cơ bản, chỉ nhận user active thuộc project; tạo notification cho người được mention, reporter và assignee mà không gửi trùng hoặc tự gửi.
- Không render HTML thô từ nội dung comment; nội dung được React escape và vẫn giữ xuống dòng.
- Thêm API cho status, comments, activities và notifications dùng chung service layer với Server Actions.
- Cài TanStack Query, thêm provider ở dashboard layout và polling notification mỗi 30 giây khi người dùng đã đăng nhập.
- Thêm icon notification có badge, trang `/notifications`, đánh dấu một hoặc tất cả notification đã đọc và link mở bug liên quan.
- Thêm test workflow theo vai trò và kiểm tra notification chỉ được đánh dấu bởi đúng recipient.

##### Đã chỉnh sửa/cải thiện

- Export access context dùng chung của bug service để comment, activity và workflow cùng áp dụng một kiểm tra membership/IDOR.
- Route notification chuẩn hóa page không hợp lệ về trang 1.
- README tiếng Việt và tiếng Anh được cập nhật trạng thái Phase 1–6, dependency TanStack Query và roadmap từ Phase 7.

#### Phase 7 — Dashboard và thống kê


##### Mục tiêu

- Xây dựng dashboard tổng quan và dashboard riêng cho từng project từ dữ liệu thật.
- Thêm overview cards, biểu đồ và aggregation tối ưu, có kiểm tra quyền phía server.

##### Đã làm

- Dashboard tổng quan hiển thị tổng project, tổng bug, bug mở/đóng, quá hạn, Critical và Blocker trong phạm vi actor được phép truy cập.
- Tạo `/projects/[projectId]/dashboard`, kèm tổng bug, tỷ lệ reopen và thời gian xử lý trung bình.
- Thêm donut chart theo status; bar chart theo priority, severity, assignee; line chart bug tạo/đóng trong 30 ngày.
- Dữ liệu dùng Prisma `count`, `groupBy` và `select` tối thiểu, không hard-code số liệu.
- Thêm loading skeleton, link từ trang project và Recharts Client Component; query/authentication vẫn ở server.
- Thêm hai API dashboard dùng chung service layer và test quyền/aggregation.

##### Đã chỉnh sửa/cải thiện

- Query dashboard chạy tuần tự để tránh đỉnh connection với Neon pool nhỏ.
- Reopen rate là tỷ lệ bug riêng biệt từng chuyển sang `REOPENED`; average resolution tính từ `createdAt` đến `resolvedAt`.
- README song ngữ được cập nhật trạng thái Phase 1–7, Recharts và roadmap Phase 8.

#### Phase 8 — Hoàn thiện MVP


##### Mục tiêu

- Triển khai attachment cloud, Kanban drag-and-drop, testing và UI polish.
- Cải thiện accessibility, responsive navigation, README và hướng dẫn deployment.

##### Đã làm

- Thêm upload attachment cho bug hoặc comment lên Cloudinary; không ghi file vào filesystem Vercel.
- Hỗ trợ JPEG, PNG, WebP, GIF, MP4, WebM, log, text và PDF; kiểm tra MIME, extension thực thi và dung lượng phía server.
- Lưu metadata attachment trong Neon, preview ảnh, mở/tải file và cho uploader hoặc manager xóa.
- Khi thêm/xóa attachment, ghi activity log; upload cloud được cleanup nếu transaction database thất bại.
- Tạo API `POST /api/uploads` và `DELETE /api/attachments/[attachmentId]` dùng service layer có authentication, membership và permission check.
- Tạo Kanban project theo các cột workflow, card có code/title/priority/assignee/deadline.
- Thêm DnD Kit, filter project board theo assignee/priority, optimistic move, rollback và toast khi server từ chối transition.
- Mọi drop gọi status API hiện có và được `workflow-service` kiểm tra lại; client không quyết định quyền.
- Thêm nút Board trong project detail, mobile navigation ngang, focus ring, accessible labels, live status và confirmation khi xóa.
- Cấu hình Next Image chỉ cho phép ảnh từ `res.cloudinary.com`.
- Cập nhật README song ngữ với trạng thái Phase 1–8, công nghệ, deployment và giới hạn sau MVP.
- Giữ seed hiện tại idempotent với 5 user, 2 project, 18 bug, comments, activities và notifications; không seed attachment cloud giả.

#### Fix giao diện sau Phase 8 — Đồng bộ ngôn ngữ tiếng Việt


##### Mục tiêu

- Loại bỏ tình trạng trang đăng nhập dùng tiếng Việt nhưng các trang sau đăng nhập lại hiển thị tiếng Anh.
- Chuẩn hóa nội dung giao diện và định dạng ngày giờ theo tiếng Việt.

##### Đã làm

- Việt hóa luồng đăng nhập/đăng ký, điều hướng, dashboard, hồ sơ, thông báo, dự án, danh sách lỗi, biểu mẫu lỗi, bình luận và Kanban.
- Đổi metadata của các trang chính sang tiếng Việt.
- Chuẩn hóa ngày giờ hiển thị bằng locale `vi-VN` tại các khu vực đã rà soát.
- Giữ nguyên các giá trị enum/API nội bộ để không ảnh hưởng dữ liệu và nghiệp vụ.

#### Bổ sung sau Phase 8 — Admin User Management


##### Mục tiêu

- Hoàn thiện chức năng bắt buộc để Admin quản lý tài khoản toàn hệ thống tại `/admin/users`.

##### Đã làm

- Thêm danh sách người dùng có tìm kiếm và phân trang phía server.
- Thêm form/modal tạo và chỉnh sửa tài khoản bằng dữ liệu Prisma thật.
- Thêm đổi `systemRole`, khóa, mở khóa và vô hiệu hóa mềm bằng trạng thái `INACTIVE`.
- Chặn Admin tự khóa, tự vô hiệu hóa hoặc tự hạ quyền quản trị.
- Chỉ hiển thị mục `Quản lý người dùng` trên navigation cho Admin.
- Thêm loading skeleton, error state, empty state, toast và dialog xác nhận tùy biến; không dùng `alert()` hoặc `window.confirm()`.
- Không trả `passwordHash` về API, page hoặc Client Component; mật khẩu tài khoản mới được hash BCrypt.

##### Phân quyền và kiến trúc

- Page kiểm tra session và redirect user không phải Admin về `/dashboard`.
- Mỗi API gọi `requireSystemRole(["ADMIN"])`, trả `401` nếu chưa đăng nhập và `403` nếu không phải Admin.
- Service `admin-service.ts` kiểm tra quyền thêm một lần tại business layer để tránh phụ thuộc riêng vào UI/API guard.
- `DELETE` không xóa cứng mà chuyển tài khoản sang `INACTIVE` để bảo toàn dữ liệu liên quan và auditability.

#### Bổ sung sau Phase 8 — Hoàn thiện Notification Triggers


##### Mục tiêu

- Tạo notification khi thêm thành viên dự án, cảnh báo bug sắp tới deadline và hỗ trợ target cả bug lẫn project.

##### Đã làm

- Thêm `PROJECT_MEMBER_ADDED` và `BUG_DEADLINE_SOON` vào `NotificationType`.
- Thêm `projectId` để notification liên kết tới project và `dedupeKey` unique để job deadline chạy lặp an toàn.
- Khi thêm project member, tạo membership, activity log và notification trong cùng transaction; user đã là member vẫn bị chặn trước transaction.
- Notification thêm member click mở `/projects/[projectId]`; notification bug click mở `/bugs/[bugId]`; notification cũ thiếu target vẫn render an toàn.
- Deadline job lấy bug chưa kết thúc, chưa xóa và có `dueDate` trong 24 giờ tới; gửi cho reporter và assignee đang active, tự loại trùng recipient.
- Thêm CLI `npm run notify:deadlines`, cron route `/api/cron/deadline-notifications` dùng Bearer `CRON_SECRET`, và lịch Vercel Cron mỗi ngày trong `vercel.json`.
- Cập nhật seed với notification project mẫu và UI notification tiếng Việt.

##### Migration

- Migration `20260717000000_notification_targets_and_deadlines` đã được áp dụng thành công lên Neon.
- Seed idempotent đã chạy thành công sau migration.

### Bug gặp phải

#### Phase 1 — Khởi tạo dự án


##### Bug gặp phải

1. `create-next-app` từ chối khởi tạo trực tiếp trong thư mục `BugFlow` vì npm package name không được chứa chữ hoa.
2. Lần kiểm tra dependency ban đầu báo các cảnh báo moderate từ `npm audit`.

#### Phase 2 — Neon PostgreSQL và Prisma


##### Bug gặp phải

1. Prisma schema không validate vì các enum ban đầu được viết trên một dòng; Prisma hiểu các model phía sau vẫn nằm trong enum đầu tiên.
2. TypeScript báo lỗi khi kiểm tra một union `BugStatus` bằng `.includes()` trên mảng trạng thái bị suy luận quá hẹp trong seed.
3. `dotenv/config` không tự đọc `.env.local`, khiến Prisma migration/seed có nguy cơ báo thiếu `DIRECT_URL` dù file đã được cấu hình.
4. Lần đầu chạy `prisma migrate deploy` trong sandbox chỉ trả `Schema engine error` do kết nối mạng bị giới hạn.
5. PostgreSQL driver cảnh báo rằng ý nghĩa `sslmode=require` có thể thay đổi ở major version tiếp theo của `pg`/`pg-connection-string`.

#### Phase 3 — Authentication và authorization nền tảng


##### Bug gặp phải

1. Test login thất bại khi email có khoảng trắng vì Zod validate email trước khi `.trim()`.
2. TypeScript coi `token.systemRole`/`user.systemRole` là `unknown` trong callback Auth.js.
3. Next.js build báo `src/proxy.ts must export a function` vì destructuring export không được static analyzer nhận diện.
4. Production build trong sandbox không tải được Google Fonts.

#### Phase 4 — Quản lý project


##### Bug gặp phải

1. Audit trước Phase 4 phát hiện helper `canManageProject()` cũ trả `true` cho mọi system `PROJECT_MANAGER`, có thể gây IDOR đối với project không liên quan.
2. Không phát hiện lỗi compile/test khác trong log thực hiện Phase 4.

#### Bổ sung trước Phase 5 — Login CTA và tài liệu công khai


##### Bug gặp phải

1. Landing page ban đầu không có CTA đăng nhập rõ ràng dù login logic đã tồn tại.
2. Nút tài liệu trỏ tới `https://github.com` chung, không phải tài liệu cụ thể.
3. Sau khi thêm `/docs`, landing page có hai link tài liệu gần nhau.

#### Phase 5 — Bug core và developer assignment


##### Bug gặp phải

1. Khi chạy `type-check` và `next build` song song, cả hai cùng ghi `.next/types`, gây lỗi tạm thời `Cannot find module './routes.js'`.
2. Build trong sandbox lại không tải được Google Fonts.
3. Audit cuối phát hiện UI filter ban đầu thiếu severity, assignee, reporter và sort dù service/API đã hỗ trợ.

#### Phase 6 — Workflow, trao đổi và thông báo


##### Bug gặp phải

1. TypeScript báo `string | null` khi danh sách recipient chứa `assigneeId` có thể rỗng.
2. Bản vá đầu tiên cho trang bug detail không khớp vì file cũ được trình bày trên các dòng JSX rất dài.

#### Phase 7 — Dashboard và thống kê


##### Bug gặp phải

1. Cài `recharts` lần đầu trong sandbox thất bại với `EACCES` khi truy cập npm registry/cache.
2. Bản vá thêm link dashboard không khớp vì JSX trang project nằm trên một dòng dài.

#### Phase 8 — Hoàn thiện MVP


##### Bug gặp phải

1. Hai lần cài Cloudinary/DnD Kit đầu tiên bị timeout do network sandbox; lần đầu không cài package nào.
2. Bản vá nối attachment vào trang bug không khớp vì JSX trang detail nằm trên dòng rất dài.
3. React 19 ESLint báo `react-hooks/refs` khi component Kanban truy cập object trả về từ DnD hooks trực tiếp trong render.
4. File `.log` từ trình duyệt có thể không có MIME type nên validation MIME thuần sẽ từ chối log hợp lệ.

#### Fix giao diện sau Phase 8 — Đồng bộ ngôn ngữ tiếng Việt


##### Nguyên nhân

- Nhiều chuỗi UI được viết cứng bằng tiếng Anh trong từng page/component, chưa có lớp bản địa hóa dùng chung.

#### Bổ sung sau Phase 8 — Admin User Management


##### Bug/rủi ro đã xử lý

- Ngăn Admin tự làm mất quyền truy cập bằng cách tự khóa, tự vô hiệu hóa hoặc đổi vai trò của chính mình khỏi `ADMIN`.
- Kiểm tra trùng email/username trước khi tạo hoặc cập nhật và vẫn xử lý lỗi unique race ở thao tác tạo.

#### Fix Bug phát sinh sau Phase 6 — Bug/My Bug Prisma transaction timeout


##### Lỗi gặp phải

- Khi mở menu `Bugs` hoặc `My bugs` trên local, Prisma báo `Transaction API error: Unable to start a transaction in the given time` tại query danh sách bug.

##### Nguyên nhân

- `listBugs()` dùng batch `prisma.$transaction([findMany, count])` cho hai truy vấn chỉ đọc. Việc này buộc Prisma xin một transaction connection dù danh sách không cần transaction isolation; Neon cold start hoặc pool đang bận có thể khiến bước bắt đầu transaction hết thời gian chờ.
- Trang còn chạy query danh sách, project filter và people filter song song, tạo thêm đỉnh kết nối khi route RSC được mở.
- Prisma client không phải nguyên nhân: `src/lib/prisma.ts` đã dùng global singleton trong development và chỉ tạo client mới khi chưa có instance.
- Các filter chính đã có index cho project/status, priority, severity, assignee, reporter, due date, created date và soft-delete. Search `contains` không tận dụng B-tree thông thường, nhưng dữ liệu/pagination hiện tại chưa đủ căn cứ để thêm migration trigram index.

### Cách xử lý

#### Phase 1 — Khởi tạo dự án


##### Cách fix

1. Khởi tạo scaffold trong thư mục tạm có tên hợp lệ `bugflow-app`, sau đó chuyển scaffold vào workspace `D:\BugFlow` và đặt package name là `bugflow`.
2. Không chạy `npm audit fix --force` vì có thể gây breaking change. Cảnh báo được giữ lại để đánh giá dependency có kiểm soát.

#### Phase 2 — Neon PostgreSQL và Prisma


##### Cách fix

1. Chuyển mọi enum sang cú pháp nhiều dòng hợp lệ rồi chạy lại `prisma format`, `prisma validate` và `prisma generate`.
2. Tạo `Set<BugStatus>` cho nhóm trạng thái resolved trước khi gọi `.has()`.
3. Dùng `loadEnvConfig(process.cwd())` từ `@next/env` trong cả `prisma.config.ts` và `prisma/seed.ts`.
4. Chạy lại migration với quyền kết nối Neon; initial migration được áp thành công.
5. Giữ `sslmode=require` theo yêu cầu Neon hiện tại và chưa tự ý đổi connection string của người dùng.

#### Phase 3 — Authentication và authorization nền tảng


##### Cách fix

1. Chuyển email schema sang `z.string().trim().toLowerCase().pipe(z.email(...))` để normalize trước khi validate format.
2. Bổ sung module augmentation cho Auth.js và cast có kiểm soát sang generated `SystemRole` tại callback boundary.
3. Dùng pattern re-export chính thức: `export { auth as proxy } from "@/auth"`.
4. Chạy lại build với quyền mạng; build production thành công.

#### Phase 4 — Quản lý project


##### Cách fix

1. Loại system role `PROJECT_MANAGER` khỏi quyền quản lý project hiện hữu; thêm helper riêng `canCreateProject()` và bắt buộc project role `MANAGER` cho update/member settings.
2. Bổ sung test xác nhận project manager có thể tạo project nhưng không quản lý project không có membership.

#### Bổ sung trước Phase 5 — Login CTA và tài liệu công khai


##### Cách fix

1. Thêm UI theo session state trên landing page.
2. Tạo docs nội bộ và loại mọi link GitHub khỏi UI/README công khai.
3. Xóa link tài liệu trên navbar, giữ một CTA `Tài liệu dự án` trong hero.

#### Phase 5 — Bug core và developer assignment


##### Cách fix

1. Chuyển quality gates có dùng chung `.next` sang chạy tuần tự: lint → test → build → type-check.
2. Chạy build với quyền mạng; production build thành công.
3. Bổ sung `listBugPeople()` và các filter control tương ứng; mọi filter tiếp tục được thực thi bởi Prisma ở server.

#### Phase 6 — Workflow, trao đổi và thông báo


##### Cách fix

1. Lọc `null` bằng type predicate trước khi so sánh và đưa recipient vào `Set`.
2. Thay trang bug detail bằng phiên bản được định dạng lại, giữ nguyên chức năng Phase 5 rồi nối thêm workflow, comment và activity.

#### Phase 7 — Dashboard và thống kê


##### Cách fix

1. Cài lại dependency với quyền được phê duyệt; không chạy `npm audit fix --force`.
2. Tách bản vá API và UI, sau đó chỉnh đúng dòng JSX mà không ảnh hưởng nút settings.

#### Phase 8 — Hoàn thiện MVP


##### Cách fix

1. Xác minh package chưa được cài rồi chạy lại npm install với quyền mạng được phê duyệt và timeout phù hợp.
2. Chia bản vá thành import/data và thay đúng dòng render hiện có.
3. Destructure `useDraggable()`/`useDroppable()` ngay khi gọi hook và dùng các giá trị riêng trong JSX; lint sạch trở lại.
4. Cho phép fallback extension `.log`/`.txt` khi MIME bị thiếu, nhưng vẫn chặn extension thực thi và giới hạn dung lượng.

#### Bổ sung sau Phase 8 — Hoàn thiện Notification Triggers


##### Bug gặp phải và cách fix

- Lần đầu chạy CLI thất bại vì deadline function nằm trong module có sentinel `server-only`; tách sang `deadline-service.ts` dùng riêng cho cron route và CLI, không import vào Client Component.
- Các lệnh Neon trong sandbox trả lỗi kết nối/EACCES; chạy lại với quyền mạng được phê duyệt.

#### Fix Bug phát sinh sau Phase 6 — Bug/My Bug Prisma transaction timeout


##### Cách fix

- Bỏ `$transaction` khỏi query danh sách; chạy `findMany` rồi `count` tuần tự để không cần transaction connection và giảm áp lực pool.
- Giữ nguyên `where`, `orderBy`, `skip`, `take`, DTO `select`, pagination, search, filter và sort hiện có.
- Chạy tuần tự query danh sách và dữ liệu filter trên `BugList` để ổn định hơn với pool nhỏ/cold start trong development.
- Thêm server log có context an toàn rồi rethrow lỗi, không biến lỗi database thành empty state.
- Thêm error boundary cho dashboard với thông báo thân thiện, mã tham chiếu và nút thử lại theo API Next.js 16.2.
- Thêm unit test xác nhận list bug không gọi `$transaction`, vẫn gọi `findMany/count` và giữ pagination.

### File/khu vực liên quan

#### Phase 1 — Khởi tạo dự án


##### File/khu vực liên quan

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

#### Phase 2 — Neon PostgreSQL và Prisma


##### File/khu vực liên quan

- `prisma/schema.prisma`
- `prisma/migrations/20260716000000_init/migration.sql`
- `prisma/migrations/migration_lock.toml`
- `prisma/seed.ts`
- `prisma.config.ts`
- `src/lib/prisma.ts`
- `.env.example`
- `README.md`

#### Phase 3 — Authentication và authorization nền tảng


##### File/khu vực liên quan

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

#### Phase 4 — Quản lý project


##### File/khu vực liên quan

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

#### Bổ sung trước Phase 5 — Login CTA và tài liệu công khai


##### File/khu vực liên quan

- `src/app/page.tsx`
- `src/app/docs/page.tsx`
- `src/auth.config.ts`
- `README.md`

#### Phase 5 — Bug core và developer assignment


##### File/khu vực liên quan

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

#### Phase 6 — Workflow, trao đổi và thông báo


##### File/khu vực liên quan

- `src/features/bugs/workflow-service.ts`
- `src/features/bugs/workflow-actions.ts`
- `src/features/comments/`
- `src/features/activities/`
- `src/features/notifications/`
- `src/lib/validators/comment.ts`
- `src/lib/validators/workflow.ts`
- `src/app/(dashboard)/bugs/[bugId]/page.tsx`
- `src/app/(dashboard)/notifications/`
- `src/app/api/bugs/[bugId]/status/`
- `src/app/api/bugs/[bugId]/comments/`
- `src/app/api/bugs/[bugId]/activities/`
- `src/app/api/comments/`
- `src/app/api/notifications/`
- `src/components/bugs/status-transition-form.tsx`
- `src/components/comments/comment-thread.tsx`
- `src/components/activities/activity-timeline.tsx`
- `src/components/notifications/`
- `src/components/providers/query-provider.tsx`
- `tests/workflow-role.test.ts`
- `tests/notification-service.test.ts`
- `README.md`

#### Phase 7 — Dashboard và thống kê


##### File/khu vực liên quan

- `src/features/dashboard/service.ts`
- `src/components/dashboard/`
- `src/app/(dashboard)/dashboard/`
- `src/app/(dashboard)/projects/[projectId]/dashboard/`
- `src/app/api/dashboard/overview/route.ts`
- `src/app/api/projects/[projectId]/dashboard/route.ts`
- `tests/dashboard-service.test.ts`
- `package.json`, `package-lock.json`, `README.md`

#### Phase 8 — Hoàn thiện MVP


##### File/khu vực liên quan

- `src/lib/cloudinary.ts`
- `src/lib/validators/attachment.ts`
- `src/features/attachments/service.ts`
- `src/components/attachments/attachment-panel.tsx`
- `src/app/api/uploads/route.ts`
- `src/app/api/attachments/[attachmentId]/route.ts`
- `src/features/boards/service.ts`
- `src/components/boards/kanban-board.tsx`
- `src/app/(dashboard)/projects/[projectId]/board/page.tsx`
- `src/app/(dashboard)/bugs/[bugId]/page.tsx`
- `src/app/(dashboard)/projects/[projectId]/page.tsx`
- `src/components/layout/dashboard-header.tsx`
- `next.config.ts`
- `.env.example`
- `tests/attachment-validation.test.ts`
- `tests/board-service.test.ts`
- `package.json`, `package-lock.json`, `README.md`

#### Fix giao diện sau Phase 8 — Đồng bộ ngôn ngữ tiếng Việt


##### File/khu vực liên quan

- `src/app/(auth)/*`
- `src/app/(dashboard)/*`
- `src/components/auth/*`
- `src/components/bugs/*`
- `src/components/projects/*`
- `src/components/notifications/*`
- `src/components/comments/*`
- `src/components/boards/*`
- `src/components/activities/*`

#### Bổ sung sau Phase 8 — Admin User Management


##### Route/API đã thêm

- UI: `/admin/users`
- `GET/POST /api/admin/users`
- `PATCH/DELETE /api/admin/users/[id]`
- `PATCH /api/admin/users/[id]/status`
- `PATCH /api/admin/users/[id]/role`

##### File/khu vực liên quan

- `src/lib/validators/admin-user.ts`
- `src/features/users/admin-service.ts`
- `src/app/api/admin/users/*`
- `src/app/(dashboard)/admin/users/*`
- `src/components/admin/user-management.tsx`
- `src/components/layout/dashboard-header.tsx`
- `tests/admin-user-service.test.ts`
- `README.md`

#### Bổ sung sau Phase 8 — Hoàn thiện Notification Triggers


##### File/khu vực liên quan

- `prisma/schema.prisma`
- `prisma/migrations/20260717000000_notification_targets_and_deadlines/migration.sql`
- `prisma/seed.ts`
- `src/features/projects/service.ts`
- `src/features/notifications/service.ts`
- `src/features/notifications/deadline-service.ts`
- `src/app/api/cron/deadline-notifications/route.ts`
- `src/components/notifications/notification-list.tsx`
- `src/components/notifications/notification-bell.tsx`
- `scripts/notify-deadlines.ts`
- `vercel.json`, `.env.example`, `package.json`
- `tests/notification-service.test.ts`
- `tests/project-member-notification.test.ts`
- `tests/deadline-cron-route.test.ts`

#### Fix Bug phát sinh sau Phase 6 — Bug/My Bug Prisma transaction timeout


##### File đã chỉnh sửa

- `src/features/bugs/service.ts`
- `src/components/bugs/bug-list.tsx`
- `src/app/(dashboard)/error.tsx`
- `tests/bug-service.test.ts`
- `nhat-ki-phases.md`

### Ghi chú

#### Phase 1 — Khởi tạo dự án


##### Kiểm tra

- Commit liên quan trong Git: `ade1c4e` (`Phase 1 done, Phase 2 gần done`).
- Lint, type-check và production build đã chạy thành công ở thời điểm hoàn thành phase.

##### Ghi chú còn tồn đọng

- Các cảnh báo moderate từ dependency cần được rà soát định kì; không có bằng chứng rằng đã xử lý hết.
- Kiểm thử trực quan trên nhiều trình duyệt: **Cần xác minh thêm**.

---

#### Phase 2 — Neon PostgreSQL và Prisma


##### Kiểm tra

- Commit liên quan trong Git: `13f08e4` (`Phase 2 done`).
- Prisma format, validate và generate: đạt.
- Migration Neon: đã áp thành công.
- Seed chạy lại: đạt, không nhân đôi dữ liệu lõi.
- Lint, type-check, test và production build: đạt tại thời điểm hoàn thành phase.

##### Ghi chú còn tồn đọng

- Cần đánh giá lại SSL parameters khi nâng lên `pg` 9 hoặc `pg-connection-string` 3.
- Neon connection string và secret chỉ nằm trong `.env.local`, không được ghi vào nhật kí hoặc commit.

---

#### Phase 3 — Authentication và authorization nền tảng


##### Kiểm tra

- Commit liên quan trong Git: `d1650a0` (`Phase 3 done`).
- Tại thời điểm hoàn thành: lint, type-check và build đạt; 9/9 test đạt.

##### Ghi chú còn tồn đọng

- Dự án đang dùng `next-auth@5.0.0-beta.31`; cần rà soát breaking changes trước khi nâng phiên bản.
- Rate limiting cho login/register chưa được triển khai.
- E2E browser test cho login/logout/session expiry: **Cần xác minh thêm**.

---

#### Phase 4 — Quản lý project


##### Kiểm tra

- Lint: đạt.
- Type-check: đạt.
- Test tại thời điểm hoàn thành: 15/15 đạt.
- Production build: đạt.
- `git diff --check`: đạt.

##### Ghi chú còn tồn đọng

- Git history hiện chưa có commit Phase 4 riêng; source Phase 4 đang nằm trong working tree cùng các thay đổi Phase 5.
- E2E browser test cho create project và member management: **Cần xác minh thêm**.
- Chưa có UI hiển thị project activity timeline; dữ liệu audit đã được ghi và phần hiển thị thuộc phase sau.

---

#### Bổ sung trước Phase 5 — Login CTA và tài liệu công khai


##### Ghi chú còn tồn đọng

- Nội dung `/docs` hiện là tài liệu công khai ngắn gọn, không đồng bộ tự động từ README.

---

#### Phase 5 — Bug core và developer assignment


##### Kiểm tra

- Lint: đạt.
- Type-check: đạt.
- Test: 21/21 đạt trên 8 test files.
- Production build: đạt; các route bug được Next.js nhận diện.
- `git diff --check`: đạt.

##### Ghi chú còn tồn đọng

- Git history hiện chưa có commit Phase 5 riêng; source Phase 5 đang nằm trong working tree.
- Chưa thực hiện stress test thật với nhiều request Neon đồng thời; atomic database increment và unique constraints đã có, nhưng tải concurrency thực tế: **Cần xác minh thêm**.
- E2E browser flow tester tạo bug → manager assign → developer xem `/my-bugs`: **Cần xác minh thêm**.
- Status transition đầy đủ, comment, activity timeline UI và notification polling chưa triển khai; thuộc Phase 6.

---

#### Phase 6 — Workflow, trao đổi và thông báo


##### Kiểm tra

- Lint: đạt.
- Type-check: đạt.
- Test: 27/27 đạt trên 11 test files.
- Production build: đạt; Next.js nhận diện các route workflow, comment, activity và notification.

##### Ghi chú còn tồn đọng

- Chưa có E2E browser test cho toàn bộ luồng tester → manager → developer → tester: **Cần xác minh thêm**.
- Notification deadline và realtime push chưa triển khai; polling 30 giây là cơ chế MVP hiện tại.
- Comment hiện dùng textarea thuần theo phạm vi MVP, chưa có rich text editor hoặc attachment.

---

#### Phase 7 — Dashboard và thống kê


##### Kiểm tra

- Lint: đạt.
- Test: 30/30 đạt trên 12 test files.
- Production build: đạt; nhận diện dashboard pages và APIs mới.
- Type-check: đạt.
- `git diff --check`: đạt.

##### Ghi chú còn tồn đọng

- Kiểm tra trực quan biểu đồ trên nhiều kích thước và dữ liệu production-like: **Cần xác minh thêm**.
- Khi dữ liệu rất lớn, nên chuyển aggregation theo ngày/thời gian xử lý sang SQL hoặc materialized metrics.
- Còn 5 cảnh báo moderate từ dependency audit; chưa force-fix để tránh breaking change.

---

#### Phase 8 — Hoàn thiện MVP


##### Kiểm tra

- Lint: đạt.
- Test: 39/39 đạt trên 15 test files.
- Production build: đạt; nhận diện `/projects/[projectId]/board`, `/api/uploads` và `/api/attachments/[attachmentId]`.
- Type-check: đạt.
- `git diff --check`: đạt.

##### Ghi chú còn tồn đọng

- Upload/xóa Cloudinary thật cần credential hợp lệ và kiểm tra trực tiếp: **Cần xác minh thêm**.
- Playwright E2E cho workflow hoàn chỉnh chưa có; unit/service tests đã đạt nhưng browser E2E production-like: **Cần xác minh thêm**.
- Cần audit accessibility bằng keyboard/screen reader và responsive trên thiết bị thật trước production.
- Còn 5 cảnh báo moderate từ npm audit; không chạy force-fix vì có nguy cơ breaking change.

---

#### Fix giao diện sau Phase 8 — Đồng bộ ngôn ngữ tiếng Việt


##### Ghi chú

- Ứng dụng hiện thống nhất ngôn ngữ hiển thị chính là tiếng Việt. Các tên công nghệ, mã lỗi và enum lưu trong cơ sở dữ liệu vẫn giữ nguyên theo thiết kế kỹ thuật.

---

#### Bổ sung sau Phase 8 — Admin User Management


##### Kiểm tra

- Test service mới bao phủ: chặn non-admin, search/pagination, hash mật khẩu, không trả password hash, ngăn tự khóa và tự hạ quyền.
- Tổng test sau thay đổi: 44/44 đạt trên 16 test files.

---

#### Bổ sung sau Phase 8 — Hoàn thiện Notification Triggers


##### Kiểm tra deadline thực tế

- Lần chạy đầu: `scanned=2`, `candidates=4`, `created=4`.
- Chạy lại cùng dữ liệu: `scanned=2`, `candidates=4`, `created=0`, xác nhận chống trùng hoạt động trên Neon.

##### Quality gates

- Lint: đạt.
- Type-check: đạt.
- Test: 49/49 đạt trên 18 test files.
- Production build: đạt và nhận diện `/api/cron/deadline-notifications`.

---

#### Fix Bug phát sinh sau Phase 6 — Bug/My Bug Prisma transaction timeout


##### Thời điểm

- 16/07/2026, sau khi hoàn thành Phase 6 và trước Phase 7.

##### Cách test lại

- Chạy lint, test, production build và type-check.
- Unit test kiểm tra query list dùng `findMany` và `count` tuần tự, không mở transaction.
- Kiểm tra production build nhận diện cả `/bugs`, `/my-bugs` và dashboard error boundary.
- Kiểm tra thao tác trực tiếp trên trình duyệt với Neon local credentials: **Cần xác minh thêm**.

##### Trạng thái sau khi fix

- Đã loại bỏ điểm phát sinh transaction timeout khỏi cả `Bugs` và `My bugs`, vì hai trang dùng chung `listBugs()`/`BugList`.
- Pagination, filter, search và sort được giữ nguyên.
- Prisma singleton development được xác nhận đúng và không cần chỉnh sửa.
- Lint: đạt.
- Test: 28/28 đạt trên 11 test files.
- Production build: đạt; `/bugs` và `/my-bugs` được Next.js nhận diện là dynamic routes.
- Type-check: đạt.
- `git diff --check`: đạt.

---

## Ngày 17/07/2026

### Công việc đã làm

#### Phase 4 cập nhật mới — Xác thực hai lớp (2FA)


##### Mục tiêu

- Bổ sung TOTP 2FA theo chuẩn ứng dụng Authenticator mà không phá luồng đăng nhập email/mật khẩu hiện có.
- Không tạo session cho tài khoản bật 2FA cho tới khi người dùng xác minh yếu tố thứ hai thành công.

##### Đã làm

- Thêm trang quản lý bảo mật `/settings/security` và trang thiết lập `/settings/security/2fa/setup`.
- Luồng bật 2FA yêu cầu nhập lại mật khẩu, tạo QR TOTP, xác nhận mã 6 chữ số và sinh 10 recovery code hiển thị một lần.
- Thêm bước đăng nhập `/login/verify-2fa` cùng phương án dự phòng `/login/recovery-code`.
- Secret TOTP được mã hóa AES-256-GCM bằng khóa môi trường; recovery code và login challenge chỉ được lưu dạng hash.
- Challenge có thời hạn, giới hạn số lần thử, chống tái sử dụng và được đánh dấu đã dùng theo transaction.
- Hỗ trợ tắt 2FA và tạo lại recovery code sau khi xác minh lại mật khẩu/yếu tố thứ hai.
- Ghi activity log cho các sự kiện bảo mật quan trọng.
- Thêm rate limit đăng nhập theo tiến trình và giới hạn lần thử challenge bền vững trong cơ sở dữ liệu.

#### Thay đổi chính sách sau Phase 4 — Bắt buộc 2FA cho mọi đăng nhập


##### Mục tiêu

- Không tài khoản nào được truy cập ứng dụng chỉ bằng email và mật khẩu.
- Tài khoản chưa đăng ký Authenticator phải thiết lập TOTP ngay trong lần đăng nhập tiếp theo.

##### Flow đăng nhập mới

1. Server kiểm tra email/mật khẩu nhưng chưa gọi Auth.js để tạo session.
2. Server luôn tạo login challenge ngẫu nhiên, lưu hash trong database và token trong cookie HttpOnly có hạn.
3. Nếu chưa có TOTP, người dùng tới `/login/setup-2fa`, quét QR và nhập mã 6 chữ số đầu tiên; nếu đã có TOTP, người dùng tới `/login/verify-2fa`.
4. Mã sai làm tăng bộ đếm retry và không tạo session; challenge hết hạn/đã dùng bị từ chối.
5. Mã hợp lệ tiêu thụ challenge trong transaction, hoàn tất enrollment nếu cần, sau đó Auth.js mới tạo session.
6. Next.js redirect tương đối tới `/dashboard`, không phụ thuộc URL localhost.

##### Chống bypass và thay đổi UI

- Credentials Provider chỉ chấp nhận bộ credentials có challenge token và yếu tố thứ hai; request chỉ có email/password luôn bị từ chối.
- JWT/session mang cờ `twoFactorVerified`; middleware và server DAL chỉ xem session có cờ này là đã xác thực đầy đủ. Session cũ được tạo trước chính sách bắt buộc sẽ không vượt qua route/service guard.
- Registration không tự đăng nhập nữa mà chuyển về `/login` để đi qua flow 2FA bắt buộc.
- Gỡ chức năng tắt 2FA khỏi UI và Server Action; trang bảo mật nêu rõ chính sách bắt buộc.
- Tài khoản chưa enroll nhận QR ngay trong pending-login flow, không cần session tạm và không log secret/mã TOTP.

### Bug gặp phải

#### Fix deployment Vercel — Thiếu generated Prisma Client


##### Lỗi gặp phải

- Vercel build báo `Module not found: Can't resolve '@/generated/prisma/client'` tại `src/lib/prisma.ts`.

##### Nguyên nhân

- `src/generated/prisma` được gitignore đúng chủ đích, nhưng pipeline cài đặt trên Vercel chưa chạy `prisma generate` trước `next build`.
- Local build không tái hiện vì generated client đã tồn tại từ lần generate trước.

#### Fix sau Phase 4 — Redirect production và khả năng tìm thấy 2FA


##### Lỗi gặp phải

- Sau khi đăng nhập trên Vercel, trình duyệt bị chuyển về `localhost`.
- Người dùng demo chưa nhìn thấy rõ nơi bật 2FA nên tưởng luồng 2FA chưa tồn tại.

##### Nguyên nhân

- Các action đăng nhập/đăng ký/đăng xuất giao việc điều hướng cho Auth.js qua `redirectTo`. Auth.js dựng URL callback dựa trên request host hoặc `AUTH_URL`; nếu biến Vercel này vẫn là `http://localhost:3000`, redirect production sẽ trỏ sai.
- 2FA chỉ xuất hiện trong lần đăng nhập sau khi tài khoản đã tự bật tại trang Security Settings; trước đó trang này chỉ được liên kết từ hồ sơ và chưa có mục điều hướng riêng.

#### Fix sau khi bắt buộc 2FA — Lỗi 500 sau bước mật khẩu


##### Lỗi gặp phải

- Sau khi nhập đúng email/password trên production, Server Action có thể ném exception trong lúc tạo pending challenge hoặc mã hóa secret TOTP, khiến UI hiển thị lỗi Server Components 500 thay vì chuyển sang bước 2FA.

##### Nguyên nhân

- Nhánh `verifyPasswordLogin` và `createLoginChallenge` chưa có error boundary ở Server Action.
- Các lỗi như thiếu/sai `TWO_FACTOR_ENCRYPTION_KEY`, migration 2FA chưa deploy hoặc database tạm thời không kết nối được thoát thẳng ra production render.
- Việc chuyển trang dùng exception redirect của server khiến frontend không nhận được trạng thái nghiệp vụ `REQUIRE_2FA` rõ ràng.

#### Fix production — Mã TOTP đúng nhưng bị báo challenge không hợp lệ


##### Hiện tượng

- Localhost xác minh 2FA thành công nhưng deployment trả thông báo chung rằng mã sai, challenge hết hạn hoặc bị khóa.

##### Nguyên nhân/rủi ro

- UI trước đây gom mọi trạng thái từ Auth.js `CredentialsSignin` vào một message nên không xác định được lỗi thuộc mã TOTP hay vòng đời challenge.
- Challenge mặc định 5 phút có thể hết hạn trong lúc người dùng demo lần đầu, quét QR và cấu hình Authenticator.
- Đồng hồ điện thoại lệch hơn một chu kỳ 30 giây có thể làm mã hiện tại bị từ chối dù người dùng nhìn thấy mã còn hiệu lực.
- Vercel CLI không có trong workspace nên chưa đọc được log deployment trực tiếp: trạng thái env thực tế vẫn cần xác minh trên Vercel Dashboard.

### Cách xử lý

#### Phase 4 cập nhật mới — Xác thực hai lớp (2FA)


##### Bug/rủi ro gặp phải và cách fix

- Nguy cơ cấp session ngay sau bước mật khẩu: tách password verification khỏi Auth.js sign-in, chỉ tạo challenge HttpOnly cho tài khoản bật 2FA; session chỉ được cấp sau khi challenge và TOTP/recovery code hợp lệ.
- Nguy cơ race condition khi dùng lại challenge hoặc recovery code: dùng `updateMany` có điều kiện trong transaction; nếu tài nguyên đã bị tiêu thụ thì rollback toàn transaction.
- Nguy cơ lộ secret: không đưa secret vào session/DTO/log, mã hóa secret trước khi ghi database và chỉ trả QR trong bước setup.

#### Fix deployment Vercel — Thiếu generated Prisma Client


##### Cách fix

- Thêm script `postinstall: prisma generate` để npm/Vercel tự tạo Prisma Client ngay sau khi cài dependency.
- Cho `prisma.config.ts` dùng `DIRECT_URL`, hoặc fallback sang `DATABASE_URL` khi môi trường build không khai báo direct URL.
- Vẫn giữ generated client ngoài Git để tránh commit code sinh tự động.

#### Fix sau Phase 4 — Redirect production và khả năng tìm thấy 2FA


##### Cách fix

- Gọi Auth.js với `redirect: false` để chỉ tạo/xóa session cookie, sau đó dùng `redirect('/dashboard')` hoặc `redirect('/login')` tương đối từ Next.js Server Action.
- Giữ luồng 2FA hiện có: bước mật khẩu tạo challenge HttpOnly, chuyển tới `/login/verify-2fa`, và chỉ cấp session sau TOTP/recovery code hợp lệ.
- Thêm mục **Bảo mật** trên navigation cho mọi người dùng đã đăng nhập.
- Cập nhật `.env.example` và README: Vercel không được dùng `AUTH_URL`/`NEXTAUTH_URL` localhost; xóa biến để dùng host hiện tại hoặc đặt đúng canonical HTTPS domain rồi redeploy.
- Không bật sẵn 2FA trong seed vì secret phải thuộc ứng dụng Authenticator của người kiểm thử. Tài khoản seed có thể tự bật 2FA tại `/settings/security`.

#### Fix sau khi bắt buộc 2FA — Lỗi 500 sau bước mật khẩu


##### Cách fix

- Login Action bắt lỗi riêng theo bước `password` và `challenge`, trả `ERROR` với thông báo tiếng Việt thay vì throw.
- Khi challenge đã tạo thành công, action trả `REQUIRE_2FA`, message và route setup/verify; token thật vẫn chỉ nằm trong cookie HttpOnly, không expose cho Client Component.
- Login form nhận trạng thái, hiển thị loading/message và dùng router chuyển sang trang 2FA.
- Trang setup bắt lỗi giải mã/tải QR, ghi log an toàn rồi quay lại login với thông báo thân thiện thay vì làm Server Component crash.
- Verify action thêm server log ngắn gọn cho lỗi bất ngờ. Log không chứa email, password, token, TOTP hoặc secret.

#### Fix production — Mã TOTP đúng nhưng bị báo challenge không hợp lệ


##### Cách fix

- Thêm `getLoginChallengeState` để phân biệt `ACTIVE`, `EXPIRED`, `LOCKED`, `USED`, `INVALID` sau khi Auth.js từ chối credentials.
- UI trả message riêng cho từng trạng thái; nếu challenge còn active thì hướng dẫn bật đồng bộ thời gian và thử mã mới nhất.
- Tăng TTL mặc định lên 10 phút và thêm `TWO_FACTOR_TOTP_WINDOW`, mặc định `2` chu kỳ, giới hạn tối đa ±60 giây.
- Ghi log reason code `invalid_totp`/`invalid_recovery_code` cùng user ID, không log mã hoặc token thật.

### File/khu vực liên quan

#### Phase 4 cập nhật mới — Xác thực hai lớp (2FA)


##### File/khu vực chính

- `prisma/schema.prisma`
- `prisma/migrations/20260717010000_two_factor_authentication/migration.sql`
- `src/auth.ts`, `src/auth.config.ts`
- `src/features/auth/service.ts`
- `src/features/auth/actions.ts`
- `src/features/auth/two-factor-service.ts`
- `src/features/auth/two-factor-actions.ts`
- `src/lib/encryption.ts`, `src/lib/rate-limit.ts`
- `src/lib/validators/two-factor.ts`
- `src/app/(auth)/login/verify-2fa/*`
- `src/app/(auth)/login/recovery-code/*`
- `src/app/(dashboard)/settings/security/*`
- `src/components/auth/two-factor-login-form.tsx`
- `src/components/auth/two-factor-settings.tsx`
- `tests/encryption.test.ts`, `tests/two-factor-service.test.ts`

#### Thay đổi chính sách sau Phase 4 — Bắt buộc 2FA cho mọi đăng nhập


##### File chính đã sửa

- `src/auth.ts`
- `src/auth.config.ts`, `src/types/next-auth.d.ts`, `src/lib/auth.ts`
- `src/features/auth/actions.ts`
- `src/features/auth/service.ts`
- `src/features/auth/two-factor-service.ts`
- `src/features/auth/two-factor-actions.ts`
- `src/app/(auth)/login/setup-2fa/page.tsx`
- `src/app/(auth)/login/verify-2fa/page.tsx`
- `src/components/auth/two-factor-settings.tsx`
- `tests/two-factor-service.test.ts`
- `README.md`, `nhat-ki-phases.md`

#### Fix deployment Vercel — Thiếu generated Prisma Client


##### File liên quan

- `package.json`
- `prisma.config.ts`

---

#### Fix sau Phase 4 — Redirect production và khả năng tìm thấy 2FA


##### File đã sửa

- `src/features/auth/actions.ts`
- `src/components/layout/dashboard-header.tsx`
- `.env.example`
- `README.md`
- `nhat-ki-phases.md`

#### Fix sau khi bắt buộc 2FA — Lỗi 500 sau bước mật khẩu


##### File đã sửa

- `src/features/auth/actions.ts`
- `src/features/auth/two-factor-actions.ts`
- `src/components/auth/login-form.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/login/setup-2fa/page.tsx`
- `README.md`
- `nhat-ki-phases.md`

#### Fix production — Mã TOTP đúng nhưng bị báo challenge không hợp lệ


##### File đã sửa

- `src/features/auth/two-factor-service.ts`
- `src/features/auth/two-factor-actions.ts`
- `tests/two-factor-service.test.ts`
- `.env.example`
- `README.md`
- `nhat-ki-phases.md`

### Ghi chú

#### Phase 4 cập nhật mới — Xác thực hai lớp (2FA)


##### Migration và cấu hình

- Đã thêm và áp dụng migration `20260717010000_two_factor_authentication` lên Neon.
- Bổ sung `TWO_FACTOR_ENCRYPTION_KEY`, `TWO_FACTOR_CHALLENGE_TTL_MINUTES`, `TWO_FACTOR_MAX_ATTEMPTS` trong `.env.example`.
- `TWO_FACTOR_ENCRYPTION_KEY` phải là chuỗi base64 biểu diễn đúng 32 byte và phải được cấu hình riêng ở local/Vercel.

##### Kiểm tra

- Unit/service tests: 59/59 đạt trên 20 test files.
- ESLint: đạt.
- TypeScript strict type-check: đạt.
- Production build Next.js 16.2.10/Turbopack: đạt và nhận diện đầy đủ route 2FA.

##### Ghi chú còn tồn đọng

- Chưa chạy browser E2E với ứng dụng Authenticator thật vì `.env.local` hiện chưa có `TWO_FACTOR_ENCRYPTION_KEY`: **Cần người vận hành cấu hình và xác minh thêm**.
- Rate limit mật khẩu hiện là best-effort theo từng tiến trình; giới hạn số lần thử 2FA nằm trong database và hoạt động xuyên instance. Nếu cần chống brute-force phân tán ở quy mô lớn, nên chuyển password rate limit sang Redis/KV hoặc bảng database chuyên dụng.

---

#### Thay đổi chính sách sau Phase 4 — Bắt buộc 2FA cho mọi đăng nhập


##### Cách test

- Seed/demo chưa enroll: nhập đúng password phải tới `/login/setup-2fa`; quét QR và nhập mã đúng mới tới dashboard.
- User đã enroll: nhập đúng password phải tới `/login/verify-2fa`; mã sai/hết hạn không tạo session.
- Gọi trực tiếp Credentials Provider chỉ với email/password phải thất bại.
- Khi chưa xác minh challenge, truy cập route protected vẫn bị đưa về login vì chưa tồn tại Auth.js session.
- Production cần `AUTH_SECRET`, `TWO_FACTOR_ENCRYPTION_KEY`, TTL/max attempts; không cấu hình `AUTH_URL` localhost và phải redeploy sau khi đổi env.

---

#### Fix sau Phase 4 — Redirect production và khả năng tìm thấy 2FA


##### Cách test production

1. Kiểm tra Vercel Production/Preview không có `AUTH_URL` hoặc `NEXTAUTH_URL` mang giá trị localhost; cấu hình các secret 2FA và redeploy.
2. Đăng nhập tài khoản chưa bật 2FA: phải tới `/dashboard` trên cùng domain Vercel.
3. Mở **Bảo mật**, bật 2FA bằng QR và lưu recovery code.
4. Đăng xuất, đăng nhập lại: phải tới `/login/verify-2fa`, mã sai hiển thị lỗi, mã đúng tới `/dashboard` trên cùng domain.
5. Đăng xuất lần nữa và kiểm tra một recovery code hợp lệ; code đó không thể sử dụng lại.

---

#### Fix sau khi bắt buộc 2FA — Lỗi 500 sau bước mật khẩu


##### Env và cách test production

1. Vercel phải có `AUTH_SECRET`, `DATABASE_URL` và `TWO_FACTOR_ENCRYPTION_KEY` base64 đúng 32 byte; không dùng localhost cho `AUTH_URL`/`NEXTAUTH_URL`.
2. Chạy `npm run db:deploy` để chắc chắn migration `20260717010000_two_factor_authentication` đã có trên production database, sau đó redeploy.
3. User chưa enroll phải nhận trạng thái `REQUIRE_2FA` và tới `/login/setup-2fa`; user đã enroll tới `/login/verify-2fa`.
4. Mã sai/hết hạn hiển thị lỗi; chỉ mã hợp lệ mới tạo session và tới `/dashboard`.
5. Khi cố ý cấu hình sai encryption key ở môi trường kiểm thử, login form phải báo không thể khởi tạo 2FA và server log có `[login-2fa] failed`, không xuất hiện dữ liệu nhạy cảm.

---

#### Fix production — Mã TOTP đúng nhưng bị báo challenge không hợp lệ


##### Cách test lại

1. Trên Vercel đặt TTL `10`, max attempts `5`, TOTP window `2`, giữ nguyên encryption key đã cấu hình và redeploy.
2. Bật ngày/giờ tự động trên điện thoại, đăng nhập lại để tạo challenge mới và nhập mã vừa chuyển sang chu kỳ mới.
3. Xác nhận mã đúng vào dashboard; cố ý chờ quá TTL phải nhận message hết hạn; nhập sai đủ số lần phải nhận message bị khóa.

---

## Ngày 19/07/2026

### Công việc đã làm

#### Security hardening — Persistent Rate Limiting


##### Mục tiêu

- Chống brute force, spam và abuse tại các flow nhạy cảm mà không làm khó việc demo bình thường.
- Rate limit phải nhất quán giữa nhiều Vercel/serverless instance.

##### Đã làm

- Thay limiter `Map` in-memory bằng bảng Prisma `RateLimitBucket` trên Neon.
- Key bucket là SHA-256 của scope và identifier; không lưu IP, email, challenge token hoặc user ID thô.
- Counter tăng bằng `updateMany` có điều kiện để tránh vượt quota khi request đồng thời; bucket hết hạn được reset và dữ liệu cũ được dọn cơ hội.
- Login: 5/10 phút theo IP và email; verify 2FA: 5/10 phút theo IP và challenge; register: 5/1 giờ theo IP và email.
- Tạo bug/comment: 20/1 phút/user; cập nhật bug/comment: 30/1 phút/user.
- Tạo project: 10/1 phút/user; thêm thành viên: 20/1 phút/user.
- Admin create/update/role/status/deactivate dùng quota chung 30/1 phút/Admin.
- Upload attachment: 10/1 phút/user; deadline cron: 5/1 phút toàn hệ thống sau khi xác minh `CRON_SECRET`.
- Áp dụng cả API Route và Server Action cho các flow có hai đường vào.
- HTTP 429 trả thông báo tiếng Việt rõ ràng; UI dùng `message` hiện có nên không coi đây là lỗi hệ thống chung.
- Không thêm resend 2FA hoặc forgot/reset password vì project hiện không có các flow này.

##### Migration

- `prisma/migrations/20260719000000_persistent_rate_limiting/migration.sql`

### Bug gặp phải

- Không ghi nhận bug cụ thể trong nhật kí cũ.

### Cách xử lý

- Nhật kí cũ không nêu cách xử lý riêng cho ngày này.

### File/khu vực liên quan

#### Security hardening — Persistent Rate Limiting


##### File chính đã sửa

- `prisma/schema.prisma`
- `src/lib/rate-limit.ts`, `src/lib/errors.ts`, `src/lib/api-response.ts`
- `src/features/auth/actions.ts`, `src/features/auth/two-factor-actions.ts`
- `src/features/bugs/actions.ts`, `src/features/comments/actions.ts`, `src/features/projects/actions.ts`
- Các API auth/register, bugs, comments, projects, admin users, uploads và deadline cron liên quan.
- `tests/rate-limit.test.ts`, `tests/deadline-cron-route.test.ts`

### Ghi chú

#### Security hardening — Persistent Rate Limiting


##### Kiểm tra

- Test limiter bao phủ quota, HTTP-style 429 error, reset cửa sổ và hash identifier.
- Test cron xác nhận rate limit chỉ chạy sau khi Bearer secret hợp lệ.
- Tổng test tại thời điểm triển khai: 66/66 đạt trên 21 test files.

---

## Ngày 20/07/2026

### Công việc đã làm

#### Security hardening — Same-Origin / CSRF Guard


##### Mục tiêu

- Ngăn request cross-site/CSRF nhắm vào các Route Handler thay đổi dữ liệu, đồng thời không ảnh hưởng GET chỉ đọc, localhost hoặc deployment sau proxy Vercel.

##### Đã làm

- Tạo helper dùng chung `assertSameOriginRequest(request)` tại `src/lib/request-security.ts`.
- Đối chiếu `Origin` với URL request, `Host` và `X-Forwarded-Host`; kiểm tra `Sec-Fetch-Site` và từ chối `cross-site` không thuộc allowlist.
- Cho phép các giá trị an toàn `same-origin`, `same-site`, `none`; mutation thiếu cả `Origin` và `Sec-Fetch-Site` bị từ chối an toàn.
- Hỗ trợ `APP_URL`, `NEXT_PUBLIC_APP_URL`, `AUTH_URL` và danh sách `ALLOWED_ORIGINS` phân tách bằng dấu phẩy; không hardcode domain production.
- Áp dụng cho đăng ký, Bug, Comment, Project/thành viên, Notification, Admin User, upload và xóa attachment.
- Giữ GET chỉ đọc không bị chặn. Login/2FA/profile/password dùng Server Actions và dựa trên kiểm tra Origin/Host tích hợp của Next.js; Auth.js giữ cơ chế CSRF riêng. Deadline cron vẫn được bảo vệ bằng `CRON_SECRET`.
- Response bị chặn trả HTTP `403` với trường `error`: `Yêu cầu không hợp lệ hoặc không cùng nguồn.`; không log cookie, token hoặc secret.

#### Security review — Vercel Firewall/WAF


##### Mục tiêu

- Rà soát endpoint thực tế và lập kế hoạch WAF giảm brute force, bot, spam và chi phí Function mà không chặn nhầm flow hợp lệ.

##### Đã rà soát

- Xác định login/2FA dùng Server Actions trên các path `/login*`, đăng ký có cả `/register` và `/api/auth/register`, Auth.js dùng `/api/auth/[...nextauth]`.
- Rà toàn bộ mutation Bug, Comment, Project, Notification, Admin, upload/attachment và cron.
- Xác nhận project không có resend 2FA, forgot/reset password, debug API hoặc internal API công khai.
- Đối chiếu lớp bảo vệ hiện có: PostgreSQL rate limit, session/role/ownership, mandatory 2FA, Same-Origin/CSRF và `CRON_SECRET`.

##### Rule đề xuất

- Ưu tiên cao: rate limit login/2FA/register; quan sát Auth.js POST; rate limit Admin mutation; bypass Bot Challenge đúng exact path cho Vercel Cron nhưng vẫn giữ secret/quota app.
- Ưu tiên trung bình: rate limit mutation Bug/Comment/Project và upload; Notification read chỉ cần allow/log mặc định.
- Bot Protection bắt đầu ở Log, chỉ chuyển Challenge cho auth/admin browser traffic khi có bằng chứng và false-positive thấp.
- Không block IP/country/ASN tùy tiện; chỉ block theo sự cố có log và ngày xem xét gỡ.
- Hobby dùng tối đa ba custom rule và một rate-limit rule gộp auth; Pro/Enterprise có thể tách rule. OWASP Core Ruleset chỉ đề xuất cho Enterprise và phải chạy Log trước Deny.

##### Việc cần cấu hình thủ công

- Thực hiện tại **Vercel Dashboard → Project → Firewall**; chưa tự động publish rule vì chưa biết plan và chưa có traffic baseline.
- Theo dõi live traffic rồi chuyển dần Log → 429/Challenge; kiểm thử lại login, mandatory 2FA, register, Admin UI và Vercel Cron sau mỗi thay đổi.

#### Cải tiến hồ sơ — Avatar upload và rà soát Bug attachments


##### Mục tiêu

- Thay nhập URL avatar thủ công bằng upload ảnh từ máy tính, cung cấp avatar mặc định và hiển thị avatar trong header.
- Xác định ý nghĩa, độ cần thiết và phạm vi phù hợp của attachment ngay khi tạo Bug.

##### Đã làm

- Giữ `avatarUrl` và bổ sung `avatarPublicId` để quản lý vòng đời asset Cloudinary.
- Profile dùng file picker JPG/JPEG/PNG/WEBP, preview tại chỗ, trạng thái đang tải/lỗi và giới hạn mặc định 5 MB qua `AVATAR_MAX_SIZE_MB`.
- Validate MIME, phần mở rộng và kích thước ở server; upload được rate limit 10 lần/phút/user.
- Cloudinary crop avatar vuông 512×512 trong `bugflow/avatars`; nếu DB update lỗi thì xóa ảnh mới, nếu thành công thì cố gắng xóa ảnh Cloudinary cũ.
- Tạo `UserAvatar` dùng chung. User có ảnh hiển thị ảnh tải lên; user mới hoặc chưa có ảnh dùng biểu tượng người mặc định, không cần URL hardcode và không tạo broken image.
- Header hiển thị avatar cạnh tên ở desktop và giữ avatar ở màn hình nhỏ.
- Register, seed và Admin create không cần sửa dữ liệu: `avatarUrl = null` tự động dùng avatar mặc định.

#### Cải tiến Bug — Attachment trong form Báo lỗi mới


##### Mục tiêu

- Cho phép đính kèm file minh chứng ngay khi báo lỗi nhưng tuyệt đối không upload trước khi Bug có `bugId`.

##### Đã làm

- `createBugAction` không redirect ngay; sau khi tạo thành công trả `bugId` cho Client Component.
- `BugForm` cho chọn nhiều file, tối đa mặc định 5 file; hiển thị tên, kích thước, preview ảnh và cho bỏ từng file trước submit.
- Client validate JPG/JPEG/PNG/WEBP/GIF, TXT/LOG/NDJSON, PDF, MP4/WEBM, kích thước và executable extension.
- Sau khi nhận `bugId`, client upload tuần tự qua `/api/uploads` với `bugId`; không tạo route upload mới.
- Mỗi file có trạng thái sẵn sàng/đang tải/thành công/lỗi. Tất cả thành công thì redirect `/bugs/{bugId}`.
- Nếu một phần upload lỗi, Bug vẫn tồn tại; UI nêu rõ tên file lỗi và có nút mở chi tiết Bug để tải lại.
- Service giới hạn tổng attachment trực tiếp của mỗi Bug bằng `BUG_ATTACHMENT_MAX_FILES`, kiểm tra trước upload và kiểm tra lại trong transaction.
- Tái sử dụng auth/quyền project, same-origin guard, rate limit, Cloudinary và cleanup asset hiện có.
- Bổ sung nhận diện `.ndjson` ở server kể cả khi browser không gửi MIME chuẩn.

#### Cải tiến UI/UX — Header overflow và tự xác minh 2FA


##### Mục tiêu

- Giữ label điều hướng Header trên một dòng và chỉ chạy marquee khi nội dung thực sự vượt chiều rộng ô.
- Tự xác minh mã TOTP ngay khi người dùng nhập đủ 6 chữ số, đồng thời giữ submit thủ công làm fallback.

##### Đã làm

- Tạo `NavOverflowLabel` đo `scrollWidth` và `clientWidth` bằng `ResizeObserver`.
- Nav item dùng `min-width: 0`, giới hạn chiều rộng, `overflow: hidden`, `white-space: nowrap`; icon luôn `shrink-0` nên không bị lệch.
- Label dài chạy qua lại nhẹ bằng CSS animation; label ngắn không có animation.
- Mobile vẫn dùng horizontal scroll và label một dòng, không áp marquee. Người dùng bật reduced motion nhận ellipsis thay vì animation.
- TOTP input trở thành controlled numeric input, tự loại ký tự không phải số và giới hạn 6 chữ số.
- Khi đủ 6 số, form tự submit sau debounce 180 ms; input và nút bị disable trong lúc xác minh, loading hiển thị rõ.
- Guard theo trạng thái request và mã vừa gửi ngăn auto-submit/Enter gọi lặp cùng một mã.
- Khi mã sai, input được xóa, guard được reset và focus quay lại để nhập mã mới. Nút Xác minh và phím Enter vẫn hoạt động như fallback.
- Recovery-code flow không auto-submit và vẫn cho phép thử lại sau lỗi.

#### Bổ sung — AI Chatbot và Chat nội bộ


##### Mục tiêu

- Thêm AI safe MVP: hướng dẫn app, cải thiện báo cáo lỗi và gợi ý priority/severity.
- Thêm chat Project, Direct và Support có persistence, ACL, unread/read receipt và polling phù hợp Vercel.

##### Đã làm

- Thêm adapter AI OpenAI-compatible, server-only env, context theo `bugId`, whitelist dữ liệu, quota phút/ngày, timeout và launcher tiếng Việt.
- AI không lưu transcript, không tự mutation và trả lỗi cấu hình rõ ràng mà không làm crash ứng dụng.
- Thêm `ChatConversation`, `ChatParticipant`, `ChatMessage`, notification `CHAT_MESSAGE` và migration `20260720150000_ai_chat_and_realtime_chat`.
- Chat Project kiểm tra membership ở từng request; `VIEWER` chỉ đọc. Direct yêu cầu project chung. Support do user mở với Admin; Admin không đọc hội thoại ngoài participant.
- Thêm API auth/same-origin/Zod/rate limit, cursor pagination, idempotent `clientId`, read receipt và polling 4–5 giây.
- Thêm `/chat`, unread badge, empty/loading/error states và link notification tới conversation.

#### Cập nhật AI Provider — GroqCloud


##### Đã làm

- Chuyển AI provider chính sang GroqCloud Chat Completions tại `https://api.groq.com/openai/v1`.
- Thêm `selectChatbotModel()` làm điểm chọn model duy nhất: tác vụ thường dùng `llama-3.1-8b-instant`; prompt/context phức tạp hoặc từ khóa phân tích dùng `openai/gpt-oss-120b`.
- Thay env provider chung bằng `GROQ_API_KEY`, `GROQ_DEFAULT_MODEL`, `GROQ_REASONING_MODEL`; giữ quota và timeout `AI_*` hiện có.
- Phân loại lỗi thiếu/sai key, model không hợp lệ/không được cấp quyền, Groq rate limit, timeout và lỗi provider; UI hiển thị message mà không crash.
- Không log API key hoặc response lỗi thô từ GroqCloud.

- Fix phát sinh sau Phase 7 — Cảnh báo SSL mode PostgreSQL

### Bug gặp phải

#### Cải tiến hồ sơ — Avatar upload và rà soát Bug attachments


##### Đánh giá attachments khi báo lỗi mới

- `Attachment` có thể gắn với `bugId` hoặc `commentId`. Panel hiện dưới phần bình luận gửi `bugId`, nên đây là attachment của Bug; UI comment hiện chưa upload attachment cho comment.
- Kết luận: nên cho chọn file minh chứng khi tạo Bug trong task tiếp theo và reuse validator, Cloudinary service, upload API cùng panel hiện có.
- Chưa implement trong thay đổi này vì Bug phải được tạo trước để có `bugId`. Upload trước khi tạo Bug có rủi ro để lại asset Cloudinary mồ côi khi việc tạo Bug thất bại.
- Scope đề xuất: tạo Bug trước, upload tuần tự file đã chọn với `bugId`, báo kết quả từng file, giữ whitelist MIME/size/rate limit và cơ chế cleanup. Schema/API lưu attachment hiện tại đã đủ, không cần migration attachment.

#### Fix phát sinh sau Phase 7 — Cảnh báo SSL mode PostgreSQL

##### Lỗi gặp phải

- Khi chạy local, `pg-connection-string` cảnh báo các mode `prefer`, `require` và `verify-ca` sẽ đổi sang semantics libpq yếu hơn trong `pg` 9.
- Cả `DATABASE_URL` và `DIRECT_URL` trong môi trường local đang dùng `sslmode=require`.

##### Nguyên nhân

- Với phiên bản driver hiện tại, `sslmode=require` đang được xử lý tương đương `verify-full`. Driver cảnh báo để ứng dụng khai báo rõ ý định trước khi major version mới thay đổi hành vi.
- Stack trace trỏ tới `DashboardLayout` vì đây là nơi request đầu tiên khởi tạo Prisma connection, không phải lỗi trong layout hoặc dashboard query.

### Cách xử lý

#### Security hardening — Same-Origin / CSRF Guard


##### Bug gặp phải và cách xử lý

- Không phát sinh bug runtime trong lúc triển khai. Guard xử lý riêng `X-Forwarded-Host` để tránh chặn nhầm deployment Vercel và phục hồi env test đúng cách để các test không làm rò trạng thái sang nhau.

#### Cải tiến Bug — Attachment trong form Báo lỗi mới


##### Bug/rủi ro và cách xử lý

- Rủi ro asset mồ côi khi tạo Bug thất bại: giải quyết bằng cách chỉ upload sau khi Server Action trả `bugId`.
- Upload một phần thất bại: không rollback Bug hoặc file đã thành công; hiển thị từng lỗi và cho tải lại tại detail.
- Upload Cloudinary thành công nhưng DB lỗi: giữ cleanup trong `createAttachment()`.
- React effect chạy lại khi trạng thái từng file đổi: khóa orchestration theo `bugId` để không upload trùng trong dev/Strict Mode.

#### Bổ sung — AI Chatbot và Chat nội bộ


##### Bug gặp phải và cách xử lý

- TypeScript nới kiểu enum trong điều kiện Prisma và làm mất inference relation; đã khai báo rõ `Prisma.ChatConversationWhereInput`.
- Provider/model AI chưa được chốt; dùng adapter HTTP OpenAI-compatible và giữ secret ở server.
- Quyền `VIEWER` chưa chốt; chọn chính sách an toàn là chỉ đọc và ghi rõ trong UI/tài liệu.

#### Fix phát sinh sau Phase 7 — Cảnh báo SSL mode PostgreSQL


##### Cách fix

- Thêm `normalizePostgresUrl()` để chuyển `prefer`, `require` và `verify-ca` sang `sslmode=verify-full`, giữ nguyên các query parameter còn lại.
- Áp dụng chuẩn hóa cho Prisma runtime, Prisma CLI/migration và seed.
- Không ghi hoặc chỉnh trực tiếp secret trong nhật ký/source code; `.env.local` vẫn được Git ignore.
- Thêm unit test cho cả ba legacy mode và trường hợp `verify-full` đã đúng.

### File/khu vực liên quan

#### Security hardening — Same-Origin / CSRF Guard


##### File chính đã sửa

- `src/lib/request-security.ts`, `src/lib/api-response.ts`
- Các Route Handler mutation trong `src/app/api/auth`, `bugs`, `comments`, `projects`, `notifications`, `admin`, `uploads` và `attachments`
- `.env.example`, `README.md`, `tests/request-security.test.ts`

#### Security review — Vercel Firewall/WAF


##### File liên quan

- `bao-cao-vercel-waf.md`
- `README.md`
- `nhat-ki-phases.md`

#### Cải tiến hồ sơ — Avatar upload và rà soát Bug attachments


##### Migration và file chính

- Migration: `prisma/migrations/20260720090000_avatar_upload/migration.sql`.
- `prisma/schema.prisma`
- `src/lib/validators/avatar.ts`, `src/lib/cloudinary.ts`
- `src/features/users/actions.ts`, `src/features/users/service.ts`
- `src/components/users/user-avatar.tsx`, `src/components/auth/profile-forms.tsx`, `src/components/layout/dashboard-header.tsx`
- `src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/profile/page.tsx`
- `.env.example`, `README.md`, `tests/avatar-validation.test.ts`

#### Cải tiến Bug — Attachment trong form Báo lỗi mới


##### File chính đã sửa

- `src/components/bugs/bug-form.tsx`
- `src/features/bugs/actions.ts`
- `src/features/attachments/service.ts`
- `src/lib/validators/attachment.ts`
- `src/app/(dashboard)/bugs/new/page.tsx`
- `.env.example`, `README.md`, `tests/attachment-validation.test.ts`

#### Cải tiến UI/UX — Header overflow và tự xác minh 2FA


##### File đã chỉnh sửa

- `src/components/layout/nav-overflow-label.tsx`
- `src/components/layout/dashboard-header.tsx`
- `src/app/globals.css`
- `src/components/auth/two-factor-login-form.tsx`
- `nhat-ki-phases.md`

#### Bổ sung — AI Chatbot và Chat nội bộ


##### File chính

- `prisma/schema.prisma`, `prisma/migrations/20260720150000_ai_chat_and_realtime_chat/migration.sql`
- `src/features/ai/*`, `src/app/api/ai/chat/route.ts`, `src/components/ai/chatbot.tsx`
- `src/features/chat/service.ts`, `src/app/api/conversations/**`, `src/app/api/chat/candidates/route.ts`
- `src/components/chat/*`, `src/app/(dashboard)/chat/page.tsx`
- `.env.example`, `README.md`, `dac-ta-he-thong.md`, `tests/ai-chat-validation.test.ts`

#### Cập nhật AI Provider — GroqCloud


##### File đã chỉnh sửa

- `src/features/ai/model-selector.ts`
- `src/features/ai/service.ts`
- `.env.example`, `README.md`, `dac-ta-he-thong.md`
- `tests/ai-chat-validation.test.ts`, `nhat-ki-phases.md`

#### Fix phát sinh sau Phase 7 — Cảnh báo SSL mode PostgreSQL


##### File đã chỉnh sửa

- `src/lib/database-url.ts`
- `src/lib/prisma.ts`
- `prisma.config.ts`
- `prisma/seed.ts`
- `tests/database-url.test.ts`
- `README.md`
- `nhat-ki-phases.md`

### Ghi chú

#### Security hardening — Same-Origin / CSRF Guard


##### Cách test

1. Gửi mutation với Origin khớp Host trên localhost và domain production/proxy: request phải đi qua guard.
2. Gửi mutation với `Origin` khác host và `Sec-Fetch-Site: cross-site`: API phải trả `403` cùng thông báo tiếng Việt.
3. Gửi mutation thiếu cả Origin và Sec-Fetch-Site: API phải trả `403`.
4. Khai báo một origin trong `ALLOWED_ORIGINS`: request từ đúng origin đó được phép; origin khác vẫn bị chặn.
5. GET chỉ đọc tiếp tục hoạt động bình thường.

##### Trạng thái

- Hoàn thành; cần cấu hình `ALLOWED_ORIGINS` chỉ khi thật sự có frontend tin cậy khác origin.

---

#### Security review — Vercel Firewall/WAF


##### Trạng thái

- Hoàn thành báo cáo và kế hoạch. Việc publish rule trên Vercel còn chờ người quản trị project thực hiện thủ công theo plan hiện tại.

---

#### Cải tiến hồ sơ — Avatar upload và rà soát Bug attachments


##### Cách test

1. Chạy `npm run db:deploy`, cấu hình Cloudinary và đăng nhập user chưa có avatar: header/profile phải hiện avatar mặc định.
2. Chọn ảnh hợp lệ, kiểm tra preview, lưu hồ sơ và xác nhận header hiển thị ảnh mới sau refresh.
3. Thử GIF/file giả ảnh/file vượt giới hạn: UI hoặc server phải trả lỗi tiếng Việt và không cập nhật avatar.
4. Thay avatar lần hai và xác nhận DB lưu public ID mới; ảnh cũ được yêu cầu xóa khỏi Cloudinary.

##### Trạng thái

- Avatar upload hoàn thành. Attachment trong form tạo Bug mới chỉ được đánh giá và đề xuất scope, chưa triển khai theo đúng yêu cầu rà soát trước.

---

#### Cải tiến Bug — Attachment trong form Báo lỗi mới


##### Cách test

1. Chọn tối đa 5 file hợp lệ, kiểm tra preview ảnh/danh sách và bỏ một file trước submit.
2. Submit và xác nhận Bug được tạo trước, sau đó mới phát sinh request `/api/uploads` có `bugId`.
3. Upload thành công phải redirect tới detail và file xuất hiện trong panel Attachments.
4. Dùng file sai định dạng/quá dung lượng/quá số lượng để xác nhận client và server đều từ chối.
5. Làm một upload thất bại để xác nhận Bug vẫn tồn tại, file thành công vẫn được gắn và tên file lỗi hiển thị rõ.

##### Trạng thái

- Hoàn thành; không có migration database mới.

---

#### Cải tiến UI/UX — Header overflow và tự xác minh 2FA


##### Cách test

1. Đăng nhập Admin ở desktop: `Quản lý người dùng` không xuống dòng; chỉ label bị cắt mới chạy qua lại, icon và chiều cao Header không đổi.
2. Thu/phóng cửa sổ để xác nhận ResizeObserver bật/tắt marquee theo overflow; mobile vẫn cuộn ngang bình thường.
3. Nhập từng số TOTP: chưa đủ 6 số không gửi request; đủ 6 số tự xác minh mà không cần Enter.
4. Nhập sai: chỉ có một request cho mã đó, input bị disable khi chờ, sau lỗi được xóa và focus lại.
5. Nhập đúng: session chỉ được tạo sau verify thành công và redirect `/dashboard`.
6. Kiểm tra phím Enter, nút Xác minh, Hủy và recovery code vẫn hoạt động.

##### Trạng thái

- Hoàn thành; không thay đổi database hoặc API contract.

#### Bổ sung — AI Chatbot và Chat nội bộ


##### Cách test

1. Chạy `npm run db:generate`, `npm run db:deploy`, rồi cấu hình các biến `AI_*`.
2. Đăng nhập qua 2FA; thử ba tác vụ AI và thử từ trang chi tiết Bug.
3. Tạo chat Project bằng Manager/Tester/Developer; xác nhận Viewer chỉ đọc.
4. Tạo Direct giữa hai user có project chung; target không có project chung phải nhận 403.
5. User mở Support với Admin; Admin chỉ thấy conversation mình là participant.
6. Gửi tin bằng hai user, kiểm tra polling, unread badge, notification và mark-read.
7. Chạy `npm run test`, `npm run lint`, `npm run type-check`, `npm run build`.

##### Giới hạn còn lại

- AI response trả một lần sau khi provider hoàn tất; streaming token/cancel có thể bổ sung sau.
- Chat chưa có attachment, presence, typing, edit/delete/moderation và managed realtime.
- Provider AI/DPA/data region/retention và E2E production: **Cần xác minh thêm**.

##### Trạng thái xác minh

- Migration `20260720150000_ai_chat_and_realtime_chat` đã áp dụng thành công lên Neon development đang cấu hình.
- Prisma validate/generate, 24 test files với 80 tests, ESLint, TypeScript và `next build` đều thành công.

#### Cập nhật AI Provider — GroqCloud


##### Cách test

1. Tạo GroqCloud API key và cấu hình ba biến `GROQ_*` trong `.env.local`.
2. Restart `npm run dev`; hỏi câu đơn giản và xác nhận response ghi model `llama-3.1-8b-instant` trong API data.
3. Hỏi “Phân tích root cause và đề xuất hướng xử lý bảo mật” để xác nhận API data dùng `openai/gpt-oss-120b`.
4. Thử bỏ key, model sai và gửi dồn request để xác nhận UI lần lượt hiển thị lỗi cấu hình/model/rate limit thân thiện.
5. Chạy test, lint, type-check và production build.

##### Trạng thái xác minh

- 24 test files với 82 tests, ESLint, TypeScript và production build đều thành công.
- Production build cần truy cập Google Fonts để tải Geist/Geist Mono trong môi trường build.

#### Fix phát sinh sau Phase 7 — Cảnh báo SSL mode PostgreSQL

##### Kiểm tra

- Prisma schema validation: đạt.
- Type-check: đạt.
- Test: 34/34 đạt trên 13 test files.
- Lint: đạt.
- Production build: đạt.
- Kiểm tra log trực tiếp sau khi restart dev server: **Cần xác minh thêm**.

##### Trạng thái

- Runtime không còn truyền `sslmode=require` tới PostgreSQL driver, đồng thời vẫn giữ certificate và hostname verification theo hành vi bảo mật hiện tại.



## Ngày 22/07/2026

### Công việc đã làm

- Cấu trúc lại toàn bộ nhật kí theo ngày và năm nhóm nội dung thống nhất.
- Gom các phase theo ngày đã ghi trong nhật kí cũ; mục cảnh báo SSL đã được xác định là ngày 20/07/2026.
- Cập nhật README theo trạng thái hiện tại của 2FA, quản lý dự án/Bug, attachment, notification, Admin User Management, AI Chatbot GroqCloud và chat nội bộ.
- Bổ sung hướng dẫn env, chạy local, Prisma migration và deploy Vercel bằng tiếng Việt và tiếng Anh.
- Thêm renderer giới hạn cho phản hồi AI, hỗ trợ tiêu đề, đoạn văn, danh sách có thứ tự/không thứ tự và chữ đậm bằng phần tử React an toàn.
- Siết system prompt để luôn ưu tiên tiếng Việt có dấu và bổ sung chuẩn hóa các nhãn tiếng Đức vô tình xuất hiện trong phản hồi.
- Cập nhật quy tắc: sau khi hoàn thành bất kỳ công việc nào trong dự án, phải bổ sung nhật kí theo format ngày hiện tại.
- Gộp nội dung cảnh báo SSL vào nhóm ngày 20/07/2026 và loại bỏ heading ngày bị trùng.
- Sửa luồng tải trang Chat cho ADMIN/TESTER, bổ sung phân loại lỗi API, logging an toàn và trạng thái loading/error/empty riêng.
- Đồng bộ quyền ADMIN: có thể chọn mọi dự án chưa lưu trữ để mở chat dự án; không hiển thị lựa chọn Direct/Support mà service không cho phép ADMIN khởi tạo.

### Bug gặp phải

- Lần gom tự động đầu tiên không nhận diện các heading ngày không có nội dung bên dưới và tạm đưa mọi phase vào nhóm chưa xác định.
- AI Chatbot hiển thị trực tiếp Markdown như `**text**`, bullet `*` và đôi khi lẫn nhãn tiếng Đức như `Beschreiben`.
- Kiểu union ban đầu của block render chưa đủ chi tiết, khiến TypeScript không suy luận được trường `items` của list.
- Sau khi bổ sung ngày cho mục SSL, nhật kí tạm có hai nhóm `Ngày 20/07/2026` riêng biệt.
- Trang Chat hiển thị error boundary chung với thông báo database mơ hồ; API chat không log bước lỗi và không phân biệt schema chưa migrate với lỗi server khác.
- API ứng viên trả danh sách dự án rỗng cho ADMIN dù service cho phép ADMIN tạo chat dự án.

### Cách xử lý

- Đối chiếu lại danh sách heading gốc, khôi phục phân nhóm theo các ngày đã được ghi nhận và xác minh riêng mục không có ngày.
- Kiểm tra số lượng heading bắt buộc, whitespace và mẫu secret trước khi hoàn tất.
- Phân tích Markdown cơ bản thành cấu trúc dữ liệu, sau đó render bằng JSX; không dùng `dangerouslySetInnerHTML` hoặc HTML do AI cung cấp.
- Làm sạch marker Markdown lỗi, thêm CSS wrapping/khoảng cách/list marker và tách rõ các biến thể TypeScript.
- Cập nhật system prompt, chuẩn hóa các nhãn ngoại ngữ đã biết và bổ sung test chống XSS bằng `renderToStaticMarkup`.
- Gộp năm nhóm nội dung của mục SSL vào nhóm 20/07/2026 hiện có và kiểm tra lại toàn bộ heading ngày.
- Thêm `chatApiError()` để giữ nguyên 401/403, trả 503 khi Prisma báo thiếu bảng/cột (`P2021`/`P2022`), trả 500 thân thiện cho lỗi không xác định và log ngữ cảnh an toàn.
- Bổ sung retry, loading, câu `Chưa có cuộc trò chuyện`, thông báo không có quyền và error boundary tiếng Việt riêng cho `/chat`.
- Kiểm tra database thật: 6 migration đã được áp dụng; query ADMIN/TESTER đều thành công. Không cần migration mới.

### File/khu vực liên quan

- `nhat-ki-phases.md`
- `README.md`
- `.env.example` được rà soát nhưng không cần chỉnh sửa vì đã đủ các biến hiện dùng.
- `src/components/ai/chatbot.tsx`
- `src/components/ai/ai-answer.tsx`
- `src/features/ai/answer-format.ts`
- `src/features/ai/response-normalizer.ts`
- `src/features/ai/policy.ts`
- `src/features/ai/service.ts`
- `tests/ai-chat-validation.test.ts`
- `nhat-ki-phases.md` — cập nhật phân nhóm ngày của mục SSL.
- `src/features/chat/service.ts`, `src/features/chat/api-error.ts`
- `src/app/api/chat/candidates/route.ts`, `src/app/api/conversations/**`
- `src/app/(dashboard)/chat/page.tsx`, `loading.tsx`, `error.tsx`
- `src/components/chat/chat-workspace.tsx`
- `tests/chat-service.test.ts`

### Ghi chú

- Không sửa logic hoặc mã nguồn ứng dụng.
- Biến `APP_URL` không được source hiện tại sử dụng; ứng dụng dùng `AUTH_URL` và `NEXT_PUBLIC_APP_URL`.
- Kiểm thử production thực tế cho Cloudinary, notification/email và Vercel WAF vẫn cần xác minh thêm.
- Type-check, ESLint, 24 test files với 85 tests và production build đều thành công.
- Kiểm thử trình duyệt local không thực hiện được vì môi trường terminal không giữ tiến trình dev nền; semantic HTML, wrapping classes và XSS escaping đã được xác minh bằng test React.
- Migration Neon đang cấu hình hiện `up to date`. Production/Preview dùng database khác vẫn phải chạy `npm run db:deploy` rồi redeploy Vercel.
- Chẩn đoán query thật: ADMIN tải được empty conversation hợp lệ; TESTER tải được 3 dự án, 4 người dùng trực tiếp và 2 Admin. Sau sửa, ADMIN có danh sách dự án phù hợp.
- Type-check, ESLint, 25 test files với 88 tests và production build đều thành công sau bản sửa Chat.

---

#### Thông tin và quy ước từ nhật kí cũ

> Cập nhật gần nhất: 22/07/2026.
> Phạm vi hiện tại: Phase 1 đến Phase 8 đã hoàn thành.
> Nguồn đối chiếu: Git history, `README.md`, Prisma schema/migration/seed, source code và test hiện có.


- Sau khi hoàn thành bất kỳ công việc, phase hoặc lần fix nào trong dự án, phải cập nhật file này theo ngày với đủ: công việc đã làm, bug gặp phải, cách xử lý, file/khu vực liên quan và ghi chú.
- Không ghi một phase là hoàn thành nếu lint, type-check, test hoặc production build bắt buộc vẫn đang lỗi.
- Nội dung chưa có bằng chứng từ code, Git history hoặc kết quả kiểm tra phải ghi `Cần xác minh thêm`.

---