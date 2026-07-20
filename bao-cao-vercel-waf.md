# Báo cáo đề xuất Vercel Firewall/WAF

Ngày rà soát: 20/07/2026

## 1. Phạm vi và hiện trạng

- Ứng dụng đã có rate limit tầng app bằng PostgreSQL cho login, đăng ký, xác minh 2FA, tạo/cập nhật Bug/Comment/Project, Admin mutation, upload và deadline cron.
- Các Route Handler ghi dữ liệu đã có Same-Origin/CSRF guard; Server Actions dùng kiểm tra Origin/Host tích hợp của Next.js; Auth.js giữ cơ chế CSRF riêng.
- Không tồn tại endpoint resend 2FA, forgot password, reset password, debug API hoặc internal API công khai.
- Login và 2FA là Server Actions trên `/login`, `/login/setup-2fa`, `/login/verify-2fa`, `/login/recovery-code`; không có `/api/auth/login` hoặc `/api/auth/2fa/*`.
- `/api/auth/[...nextauth]` là route động của Auth.js. Không chặn toàn bộ route này vì có cả endpoint phục vụ flow hợp lệ; chỉ theo dõi/rate limit các request POST bất thường.
- `/api/cron/deadline-notifications` là GET dành cho Vercel Cron và đã yêu cầu Bearer `CRON_SECRET`.

## 2. Ma trận endpoint và hành động đề xuất

| Endpoint/flow thực tế | Rule tại Vercel | Action đề xuất | Ưu tiên | Lý do và lớp bảo vệ trong code |
|---|---|---|---|---|
| `POST /login` | Path bằng `/login`, method POST; rate limit theo IP/JA4 | Rate Limit → 429; chuyển Challenge chỉ khi log xác nhận bot/brute force | High | Điểm kiểm tra email/password. App đã giới hạn 5/10 phút theo IP và email. |
| `POST /login/setup-2fa`, `/login/verify-2fa`, `/login/recovery-code` | Gom các path login 2FA, method POST | Rate Limit → 429; Challenge khi có abuse rõ ràng | High | Chống đoán TOTP/recovery code. App đã giới hạn 5/10 phút theo IP và challenge. |
| `POST /register` và `POST /api/auth/register` | Hai path đăng ký, method POST | Rate Limit → 429; Challenge nếu bot đăng ký hàng loạt | High | App giới hạn 5/1 giờ theo IP/email. Rule edge giảm request vào Function trước khi chạm DB. |
| `POST /api/auth/*` | Method POST, quan sát theo target path Auth.js thực tế | Log trước; rate limit khi xác định callback bị abuse | High | Không Deny/Challenge cả namespace vì có thể phá callback/session/CSRF hợp lệ. |
| `/api/admin/*` | Path prefix, ưu tiên method POST/PATCH/DELETE; có thể log cả GET | Rate Limit → 429; Challenge trang `/admin/*` nếu traffic lạ, không mặc định Challenge fetch API | High | API đã kiểm tra Admin, session, CSRF và 30 mutation/phút/Admin. Challenge trực tiếp XHR có thể làm hỏng UI. |
| `POST/PATCH /api/bugs*` | Method ghi + prefix `/api/bugs` | Rate Limit → 429 | Medium | Chống spam/chi phí DB; code đã giới hạn theo user cho create/update. Không challenge bình thường. |
| `POST/PATCH/DELETE /api/comments*` và `POST /api/bugs/*/comments` | Method ghi + path comment | Rate Limit → 429; Challenge chỉ sau khi thấy bot | Medium | Code có auth, CSRF và quota user cho create/update. |
| `POST/PATCH/DELETE /api/projects*` | Method ghi + prefix `/api/projects` | Rate Limit → 429 | Medium | Có auth/role/CSRF; app đã giới hạn create và add member. |
| `PATCH /api/notifications/*` | Method PATCH + prefix | Allow; Log nếu lưu lượng tăng bất thường | Low | Chỉ đánh dấu đã đọc, có auth/ownership/CSRF; rủi ro thấp. |
| `POST /api/uploads`, `DELETE /api/attachments/*` | Method tương ứng + path | Rate Limit → 429 | Medium | Upload tốn băng thông/Cloudinary; app có 10 upload/phút/user và kiểm tra quyền. |
| `GET /api/cron/deadline-notifications` | Exact path | Allow/bypass Bot Challenge cho Vercel Cron; không bypass DDoS tùy tiện | High | Request máy chủ không giải JavaScript challenge; Bearer secret và rate limit app vẫn bắt buộc. Không đưa secret vào WAF condition/log. |
| API GET chỉ đọc | Không tạo challenge/rate limit mạnh mặc định | Allow/Log | Low | Đều yêu cầu session/quyền phù hợp; chặn mạnh dễ gây lỗi UI và không giải quyết mutation abuse. |

## 3. Bộ rule nên cấu hình thủ công trong Vercel Dashboard

Luôn tạo rule với action **Log** trước, quan sát live traffic tối thiểu trong một chu kỳ sử dụng thực tế, sau đó mới chuyển sang 429/Challenge.

### Cấu hình tối thiểu — phù hợp Hobby (tối đa 3 custom rules, 1 rate-limit rule)

1. **BF-Auth-Mutations** — rate-limit rule duy nhất:
   - Điều kiện: method POST và path thuộc `/login`, `/login/setup-2fa`, `/login/verify-2fa`, `/login/recovery-code`, `/register`, `/api/auth/register`.
   - Fixed window: khởi đầu `20 request / 10 phút / IP hoặc JA4`.
   - Follow-up action: `429`.
   - Lý do dùng ngưỡng edge cao hơn quota app: tránh khóa nhầm nhiều user chung NAT; app vẫn giữ quota email/challenge chặt hơn.
2. **BF-Admin-Observe**:
   - Điều kiện: path bắt đầu `/api/admin/` hoặc `/admin/`.
   - Action ban đầu: `Log`; chỉ chuyển Challenge cho trang `/admin/*` khi thấy automation rõ ràng.
3. **BF-Mutation-Observe**:
   - Điều kiện: method POST/PATCH/DELETE và path bắt đầu bằng `/api/bugs`, `/api/comments`, `/api/projects`, `/api/uploads`, `/api/attachments`.
   - Action: `Log`; dùng dữ liệu này để quyết định nâng cấp/tách rule.

### Cấu hình mở rộng — Pro/Enterprise

1. Tách rate limit auth thành login/2FA (`10/10 phút/IP hoặc JA4`) và register (`5/10 phút/IP hoặc JA4`). Giới hạn 1 giờ của register tiếp tục do app xử lý vì fixed-window Hobby/Pro tối đa 10 phút.
2. Admin mutations: khởi đầu `60/1 phút/IP hoặc JA4`, action 429. Chỉ bật persistent Challenge/Deny 5–15 phút sau khi xác nhận false-positive thấp.
3. Bug/Comment/Project mutations: khởi đầu `120/1 phút/IP hoặc JA4`, action 429. Quota theo user vẫn để tầng app xử lý vì Dashboard không hiểu session user ID.
4. Upload: tách riêng `30/1 phút/IP hoặc JA4`, action 429 để giảm chi phí Function/băng thông trước khi app áp quota user.
5. Bật Bot Protection ở **Log** trước; sau khi kiểm tra Vercel Cron và monitoring hợp lệ đã được bypass đúng phạm vi, chuyển sang **Challenge** cho browser-facing auth/admin paths.
6. Nếu có Enterprise, bật OWASP Core Ruleset ở **Log**, rà false positives cho JSON/form/upload rồi mới chuyển từng rule sang **Deny**. OWASP managed ruleset không có trên Hobby/Pro.

Các con số trên là baseline triển khai, không phải ngưỡng bất biến. Điều chỉnh dựa trên p95 traffic, số user dùng chung NAT và Firewall Observability.

## 4. IP, quốc gia và ASN

- Không block quốc gia hoặc ASN mặc định: project chưa có bằng chứng log cho thấy vùng/ASN cụ thể chỉ tạo traffic xấu.
- Không allowlist Admin bằng IP nếu quản trị viên dùng mạng động/di động; việc này dễ tự khóa quyền truy cập.
- Chỉ thêm IP/CIDR vào IP Blocking sau khi Firewall/Function logs chứng minh có spam lặp lại và đã kiểm tra đó không phải proxy, monitoring hay user hợp lệ.
- IP block là biện pháp ứng phó sự cố. Ghi lý do, thời điểm, bằng chứng và ngày xem xét gỡ block.
- Không tạo System Bypass Rule trừ khi Vercel chặn nhầm một proxy/automation đã xác minh; bypass này làm yếu system mitigation.

## 5. Same-origin và phân chia trách nhiệm

- Không dùng WAF thay cho CSRF guard. `Origin` có thể bị giả bởi non-browser client; WAF nên giảm tải/abuse, còn code tiếp tục xác minh session, role, ownership và Same-Origin.
- Không hardcode production domain trong source hoặc `vercel.json`. Allowlist browser khác origin dùng `ALLOWED_ORIGINS`; mặc định để trống.
- Same-origin không áp dụng cho Vercel Cron; endpoint cron dùng `CRON_SECRET` và quota riêng.
- Không thêm `@vercel/firewall` lúc này: rate limit theo user/email/challenge đã được PostgreSQL xử lý ổn định; Dashboard edge rule đủ cho lớp IP/JA4. Chỉ cân nhắc SDK nếu cần key theo tenant/header mà app hiện chưa có.

## 6. Trình tự triển khai an toàn

1. Mở **Project → Firewall → Configure** và xác nhận plan/giới hạn rule.
2. Bật Bot Protection ở Log; tạo ba rule tối thiểu ở chế độ Log (riêng rate-limit có thể dùng follow-up Log trong giai đoạn thử).
3. Quan sát live traffic, Auth.js target paths, Vercel Cron và tỷ lệ false-positive.
4. Chuyển auth rate limit sang 429; test login sai/đúng, setup 2FA, verify TOTP, recovery và đăng ký.
5. Nếu có abuse, tăng dần bảo vệ Admin/Comment/Upload; không Challenge toàn app.
6. Theo dõi HTTP 403/429, số challenge, Function invocations và phản hồi user. Dùng Firewall Audit Log/rollback ngay nếu rule phá flow hợp lệ.

## 7. Phần tiếp tục nằm trong code

- Xác thực/session, 2FA bắt buộc, role/ownership và validation.
- Rate limit theo email, challenge, user ID và cron.
- Same-Origin/CSRF cho mutation.
- Thông báo lỗi 403/429 tiếng Việt và audit log không chứa secret.

Vercel Firewall là lớp edge bổ sung, không thay thế các kiểm soát trên.

## 8. Tài liệu Vercel tham chiếu

- [Vercel Firewall và thứ tự thực thi](https://vercel.com/docs/vercel-firewall)
- [WAF Custom Rules và quy trình Log trước khi chặn](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules)
- [WAF Rate Limiting, giới hạn theo plan và counting key](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)
- [WAF Managed Rulesets: Bot Protection và OWASP](https://vercel.com/docs/vercel-firewall/vercel-waf/managed-rulesets)
- [Giới hạn IP block/custom rules theo plan](https://vercel.com/docs/vercel-firewall/vercel-waf)
