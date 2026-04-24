# Kế hoạch kiểm thử toàn diện — mọi luồng theo role (SmartRent Car)

> **Mục đích:** Đây là tài liệu tham chiếu để **đảm bảo sống còn nghiệp vụ** trước demo, nộp bài, go-live. Mọi case nên được **ghi nhận kết quả** (Pass / Fail / Blocked), **môi trường**, **phiên bản commit**, **người thực hiện**, **screenshot hoặc HAR** khi Fail.

---

## 0. Thuật ngữ & mapping role

| Frontend (`user.role` trong UI) | Backend (`User.role` trong JWT / DB) | Ghi chú |
|---------------------------------|----------------------------------------|---------|
| `renter` | `user` | Đăng ký consumer chọn “khách thuê”. |
| `owner` | `owner` | Chủ xe. |
| `showroom` | `showroom` | Đối tác showroom; `showroom_status`: pending / approved / rejected. |
| `admin` | `admin` | Quản trị. |

**Luôn kiểm tra:** sau login, `localStorage.smartrent_user` và token `smartrent_token` đồng bộ; F5 không mất session nếu token còn hạn.

---

## 1. Chuẩn bị môi trường & dữ liệu (bắt buộc trước khi chạy suite)

### 1.1 Môi trường

| ID | Mô tả | Kiểm tra |
|----|--------|----------|
| ENV-01 | Backend chạy, `GET /api/health` → `{ ok: true }` | ☐ |
| ENV-02 | MongoDB kết nối, không lỗi console khi `npm run dev` / `start` | ☐ |
| ENV-03 | `frontend/.env`: `REACT_APP_API_BASE_URL` trỏ đúng host:port API | ☐ |
| ENV-04 | `REACT_APP_STRIPE_PUBLIC_KEY` (test) khớp Stripe Dashboard test mode | ☐ |
| ENV-05 | `backend/.env`: `STRIPE_SECRET_KEY`, `JWT`, `CORS_ORIGINS` (gồm origin CRA, ví dụ `http://localhost:3000`) | ☐ |
| ENV-06 | Cloudinary / OpenAI (nếu dùng upload & AI damage) — key hợp lệ hoặc ghi rõ **blocked** nếu thiếu | ☐ |

### 1.2 Tài khoản seed tối thiểu (đặt tên cố định trong team)

| ID | Role | Điều kiện DB | Mục đích |
|----|------|--------------|-----------|
| ACC-A1 | `admin` | `is_active: true` | Toàn bộ luồng admin. |
| ACC-R1 | `user` (renter) | `is_active: true` | Đặt xe, thanh toán, hủy, đánh giá. |
| ACC-O1 | `owner` | `is_active: true` | CRUD xe (nếu owner tạo xe trong luồng của bạn). |
| ACC-S0 | `showroom` | `showroom_status: pending`, `is_active: false` | Luồng chờ duyệt / từ chối. |
| ACC-S1 | `showroom` | `showroom_status: approved`, `is_active: true` | Toàn bộ luồng showroom. |
| ACC-S2 | `showroom` | `showroom_status: rejected` (tuỳ chọn) | Kiểm tra đăng nhập / hạn chế (nếu có). |

### 1.3 Dữ liệu nghiệp vụ tối thiểu

| ID | Thực thể | Mô tả |
|----|-----------|--------|
| DATA-V1 | Xe | Ít nhất 1 xe `added_by` = ACC-S1 (showroom đã duyệt), có `vehicle_hire_rate_in_figures`, ảnh (nếu UI cần). |
| DATA-V2 | Xe | Xe thứ hai (để test filter, pagination). |
| DATA-B1 | Booking | Renter ACC-R1 + showroom ACC-S1 + DATA-V1, các status khác nhau (seed hoặc tạo qua UI + API). |
| DATA-P1 | Payment | Gắn booking có intent Stripe (nếu đã từng thanh toán test). |

---

## 2. Ma trận route & quyền truy cập (smoke theo URL)

**Quy tắc:** Với mỗi ô — đăng nhập role X, truy cập URL Y — ghi **Expected**: 200 UI đúng / redirect đúng / 403 layout.

### 2.1 Không đăng nhập (Guest)

| URL | Kỳ vọng |
|-----|---------|
| `/` | Trang chủ, danh sách/xe công khai. |
| `/xe/:id` | Chi tiết xe (id hợp lệ / id sai → xử lý lỗi thân thiện). |
| `/map` | Bản đồ. |
| `/login` | Form đăng nhập / đăng ký. |
| `/partner/register` | Form đăng ký showroom. |
| `/random-path-xyz` | **404** (NotFound), không crash. |
| `/admin/dashboard` | Redirect → `/login` (hoặc ProtectedRoute). |
| `/renter/profile` | Redirect → `/login`. |
| `/showroom/dashboard` | Redirect → `/login`. |

### 2.2 Renter (`renter`)

| URL | Kỳ vọng |
|-----|---------|
| `/renter/profile` | Vào được, layout renter. |
| `/renter/bookings` | Vào được. |
| `/renter/checkout` và `/renter/checkout/:carId` | Vào được (cùng admin trong route checkout). |
| `/renter/payment-result` | Trang kết quả (query Stripe). |
| `/renter/sos` | Trang SOS. |
| `/admin/dashboard` | **Redirect** về `/renter/profile` (RoleRoute). |
| `/showroom/dashboard` | **Redirect** về `/renter/profile`. |
| `/owner/dashboard` | **Redirect** về `/renter/profile`. |

### 2.3 Owner (`owner`)

| URL | Kỳ vọng |
|-----|---------|
| `/owner/dashboard`, `/owner/vehicles`, `/owner/tracking`, `/owner/revenue`, `/owner/profile` | OK. |
| `/renter/bookings` | Redirect về `/owner/dashboard`. |
| `/admin/users` | Redirect về `/owner/dashboard`. |

### 2.4 Showroom (`showroom`)

| URL | Kỳ vọng |
|-----|---------|
| Tất cả `/showroom/*` trong `App.js` | OK. |
| `/renter/profile` | Redirect về `/showroom/dashboard`. |

### 2.5 Admin (`admin`)

| URL | Kỳ vọng |
|-----|---------|
| `/admin/dashboard`, `/admin/users`, `/admin/showrooms`, `/admin/transactions`, `/admin/profile` | OK. |
| `/renter/checkout/:carId` | **Được** (RenterOrAdminCheckout). |
| `/renter/bookings` | Redirect về `/admin/dashboard`. |

---

## 3. Luồng nghiệp vụ chi tiết theo role

Mỗi luồng dùng mẫu:

- **Tiền điều kiện**
- **Các bước** (UI + API nếu cần DevTools)
- **Kỳ vọng**
- **Negative / bảo mật**
- **Ghi chú regression**

---

### 3.1 Guest & Đăng ký / Đăng nhập chung

#### G-01 — Trang chủ & điều hướng công khai

| Bước | Hành động | Kỳ vọng |
|------|-----------|---------|
| 1 | Mở `/` | Navbar, Footer, nội dung Home. |
| 2 | Click logo / link xe | Điều hướng đúng, không 404. |
| 3 | Mở `/map` | Map load (hoặc graceful empty). |

#### G-02 — Đăng ký renter / owner (tab Login)

| Bước | Hành động | Kỳ vọng |
|------|-----------|---------|
| 1 | `/login` → tab Đăng ký, chọn renter hoặc owner | Validation mật khẩu mạnh (nếu có policy). |
| 2 | Submit hợp lệ | Thông báo thành công / chuyển login. |
| 3 | Email trùng | Lỗi rõ ràng, không 500. |

#### G-03 — Đăng ký showroom (`/partner/register`)

| Bước | Hành động | Kỳ vọng |
|------|-----------|---------|
| 1 | Điền form đầy đủ, submit | Thông báo chờ duyệt (theo copy UI). |
| 2 | Thiếu field bắt buộc | 422 / message field-level. |

#### G-04 — Đăng nhập sai / đúng

| Case | Hành động | Kỳ vọng |
|------|-----------|---------|
| Sai mật khẩu | Submit | Không lộ stack; message tiếng Việt. |
| Đúng | Submit | Redirect theo role (`Login.jsx` + `ROLE_REDIRECTS`). |

#### G-05 — Session & token

| Bước | Hành động | Kỳ vọng |
|------|-----------|---------|
| 1 | Login thành công | `Authorization` gửi kèm request sau (apiClient). |
| 2 | Xóa token / gọi API 401 | Redirect hoặc clear storage (theo `apiClient`). |
| 3 | JWT hết hạn (nếu test được) | UX không loop vô hạn. |

---

### 3.2 Renter — toàn bộ luồng “khách thuê”

#### R-01 — Hồ sơ (`/renter/profile`)

| Bước | Hành động | Kỳ vọng |
|------|-----------|---------|
| 1 | Mở trang | Form load từ API (hoặc state đồng bộ). |
| 2 | Cập nhật tên / SĐT hợp lệ | PATCH `/api/auth/me` 200; UI cập nhật. |
| 3 | SĐT không 10 số | Lỗi validation. |
| 4 | Đổi mật khẩu (nếu có trên trang) | Session rotate / token mới theo backend. |

#### R-02 — Danh sách chuyến (`/renter/bookings`)

| Bước | Hành động | Kỳ vọng |
|------|-----------|---------|
| 1 | Mở trang | `getListBookings` trả về **chỉ booking của renter** (backend filter `user_id`). |
| 2 | Empty state | Nút “Tìm xe ngay” → `/` (không `/cars`). |
| 3 | Click một booking | Modal chi tiết; badge status khớp `booking.model` enum. |
| 4 | Hủy booking (nếu status cho phép) | Chỉ `cancelled` được gửi; sau đó list refresh. |
| 5 | Thử hủy khi status không cho phép | 400 từ API; UI không crash. |

**Negative R-02a:** Đăng nhập showroom, mở `/renter/bookings` (URL tay) → redirect về dashboard showroom.

#### R-03 — Xem xe & yêu thích (`/xe/:id`)

| Bước | Hành động | Kỳ vọng |
|------|-----------|---------|
| 1 | Guest xem xe | Đọc được thông tin công khai. |
| 2 | Renter click “yêu thích” (nếu có) | API favorites; loading / error. |
| 3 | Renter “Đặt xe” | Chuyển checkout hoặc login với state `bookNow`. |

#### R-04 — Checkout & thanh toán Stripe

| Bước | Hành động | Kỳ vọng |
|------|-----------|---------|
| 1 | `/renter/checkout/:carId` với xe hợp lệ | Load vehicle; chọn ngày; tổng tiền hợp lý. |
| 2 | Bước tiếp → tạo booking | `POST /api/booking/createBooking` 201; `showroom_id` = chủ xe/showroom từ xe. |
| 3 | Tạo payment intent | `POST /api/booking/:id/createPayment`; booking có thể chuyển `waiting_payment`. |
| 4 | Stripe test card success | Redirect `/renter/payment-result?...`; DB payment + booking `paid` (theo sync). |
| 5 | Stripe cancel / thất bại | Booking / payment state nhất quán; user có hướng dẫn. |

**Negative R-04a:** Checkout không có `carId` (nếu vào `/renter/checkout`) — không crash; thông báo rõ.

**Negative R-04b:** Thanh toán khi booking status không hợp lệ (`payment.service` ALLOWED list) — 400 message tiếng Việt.

#### R-05 — Payment Result (`/renter/payment-result`)

**Lưu ý kỹ thuật:** Route này **không** nằm trong `ProtectedRoute` / `DashboardLayout` (Stripe redirect cần mở được khi session phức tạp). Kiểm thử cần gồm:

| Case | Kỳ vọng |
|------|---------|
| `redirect_status=succeeded` | UI success, link về bookings / home. |
| Thiếu tham số / lỗi | Không white screen. |
| Mở URL trực tiếp khi **chưa** login | Không lộ dữ liệu booking của user khác; không crash. |
| Query giả mạo (booking_id người khác) | Backend từ chối hoặc chỉ hiển thị an toàn (ghi rõ hành vi thực tế). |

#### R-06 — SOS (`/renter/sos`)

| Bước | Hành động | Kỳ vọng |
|------|-----------|---------|
| 1 | Submit form (nếu có API Contact) | 200 hoặc message; không lộ PII trong URL. |

#### R-07 — Chat widget (renter)

| Bước | Hành động | Kỳ vọng |
|------|-----------|---------|
| 1 | FAB chat (global) | Mở panel. |
| 2 | Topbar Chat (trong dashboard renter nếu hiện) | `openChat()` mở cùng state. |

#### R-08 — Đánh giá xe (nếu CarDetail có review)

| Bước | Hành động | Kỳ vọng |
|------|-----------|---------|
| 1 | Renter gửi review | POST reviews; chỉ renter được (403 cho role khác). |

---

### 3.3 Owner — chủ xe

#### O-01 — Dashboard (`/owner/dashboard`)

| Bước | Kiểm tra widget, link “Chi tiết”, không lỗi console. |

#### O-02 — Xe của tôi (`/owner/vehicles`)

| Bước | Hành động | Kỳ vọng |
|------|-----------|---------|
| 1 | List xe `added_by` = owner | Đúng filter backend. |
| 2 | Tạo xe mới | Validate `vehicle_type` ô tô 4 bánh (theo rule dự án). |
| 3 | Sửa / xóa xe của mình | 200 / 403 nếu xe người khác. |

#### O-03 — Theo dõi xe (`/owner/tracking`)

| Bước | Map / danh sách không crash; dữ liệu mock hoặc API — ghi rõ nguồn. |

#### O-04 — Doanh thu (`/owner/revenue`)

| Bước | Xuất CSV hoạt động; biểu đồ render. |

#### O-05 — Hồ sơ (`/owner/profile`)

| Giống pattern PATCH profile; không chỉnh được field showroom. |

---

### 3.4 Showroom — đối tác (ACC-S1 đã duyệt)

#### S-01 — Dashboard (`/showroom/dashboard`)

| Mock vs API — ghi chú phiên bản; nút xuất JSON (nếu có) tải file. |

#### S-02 — Quản lý xe (`/showroom/vehicles`)

| CRUD giống owner nhưng `added_by` showroom; kiểm tra xe hiện trên Home/CarDetail nếu luồng public liên quan. |

#### S-03 — Quản lý đặt xe (`/showroom/bookings`)

| Bước | Hành động | Kỳ vọng |
|------|-----------|---------|
| 1 | List booking | **Chỉ** booking có `showroom_id` = user showroom (backend merge, không tin body client). |
| 2 | Duyệt `pending` → `confirmed` | PATCH 200; badge đúng. |
| 3 | Từ chối → `cancelled` | OK. |
| 4 | Nút “bước tiếp” từ `paid` … | Chỉ các transition hợp lệ theo `constants/bookingStatus.js` + enum backend. |
| 5 | Thử PATCH status không có trong enum | 4xx; không corrupt DB. |

**Negative S-03a:** Tạo booking của showroom khác trong DB, đăng nhập ACC-S1, gọi API list — **không** thấy booking đó.

**Negative S-03b:** Renter cố PATCH status `confirmed` trên booking người khác — 403.

#### S-04 — Khách hàng (`/showroom/customers`)

| Aggregate từ booking + `user_id` populate; không rỗng khi có booking hợp lệ. |

#### S-05 — Hợp đồng (`/showroom/contracts`)

| List từ `/api/contracts/list`; PDF chỉ khi có `pdf_url`. |

#### S-06 — Doanh thu & báo cáo (`/showroom/revenue`)

| CSV / In; biểu đồ mock — ghi “dữ liệu demo” nếu chưa nối API thật. |

#### S-07 — Kiểm tra AI (`/showroom/ai-inspection`)

| Bước | Hành động | Kỳ vọng |
|------|-----------|---------|
| 1 | Chọn xe từ API | Danh sách `added_by` showroom. |
| 2 | Upload trước/sau, Phân tích | So sánh AI trả JSON. |
| 3 | Lưu inspection | POST `/api/vehicle-damage-inspections`; tab Lịch sử có dòng mới. |
| 4 | Lỗi upload / AI | Thông báo; không mất toàn bộ UI. |

#### S-08 — Hồ sơ showroom (`/showroom/profile`)

| GET `/api/auth/me` hydrate form; PATCH lưu `public_address`, `policy_text`, v.v.; reload giữ dữ liệu. |

#### S-09 — Chat topbar

| Nút chat mở `ChatWidget` (context). |

#### S-10 — Showroom **chưa** duyệt (ACC-S0)

| Đăng nhập được không? Truy cập dashboard bị chặn hay chỉ cảnh báo? — **Ghi đặc tả hiện trạng** và kỳ vọng sản phẩm (ví dụ: vẫn vào dashboard nhưng không list xe public — nếu có rule). |

---

### 3.5 Admin

#### A-01 — Dashboard stats & charts

| `GET /api/admin/dashboard/stats`, `.../charts` — số liệu không NaN. |

#### A-02 — Quản lý user (`/admin/users`)

| Bước | Hành động | Kỳ vọng |
|------|-----------|---------|
| 1 | List / search / pagination | Đúng API. |
| 2 | Khóa / mở user (`PATCH .../active`) | Audit log (nếu bật) ghi nhận; user không login được khi khóa. |
| 3 | Không tự khóa admin chính mình (nếu có guard) | An toàn. |

#### A-03 — Xác minh showroom (`/admin/showrooms`)

| Bước | Hành động | Kỳ vọng |
|------|-----------|---------|
| 1 | List pending | Đúng filter. |
| 2 | Approve | `showroom_status=approved`, `is_active=true`; showroom đăng nhập được đầy đủ. |
| 3 | Reject + lý do | Lưu `showroom_rejection_reason` (nếu có field). |
| 4 | Audit stdout | Một dòng JSON `showroom.approve` / `showroom.reject` (nếu đã triển khai). |

#### A-04 — Giao dịch (`/admin/transactions`)

| List từ API; xuất CSV; modal chi tiết. |

#### A-05 — Hồ sơ admin (`/admin/profile`)

| Giống renter pattern; đổi mật khẩu. |

#### A-06 — Redirect legacy

| `/admin/moderation`, `/admin/reports` → `/admin/dashboard`. |

#### A-07 — Negative

| User renter mở `/admin/users` | Redirect về `/renter/profile`. |

---

## 4. Ma trận trạng thái Booking (bắt buộc cho nghiệp vụ thuê xe)

**Enum backend:** `pending`, `confirmed`, `cancelled`, `completed`, `waiting_payment`, `paid`, `waiting_handover`, `handed_over`, `in_use`, `waiting_return_confirmation`.

Với mỗi cặp `(from_status, action, actor)` ghi Pass/Fail:

| Từ | Hành động | Actor | Kỳ vọng HTTP / trạng thái sau |
|----|-----------|-------|-------------------------------|
| `pending` | Approve | Showroom | → `confirmed` |
| `pending` | Reject | Showroom | → `cancelled` |
| `pending` | Cancel | Renter | → `cancelled` (nếu policy cho phép) |
| `confirmed` | Tạo / tiếp tục thanh toán | Renter | → `waiting_payment` khi tạo intent (theo payment service) |
| `waiting_payment` | Stripe success | System/sync | → `paid` |
| `paid` | Bước tiếp showroom | Showroom | → `waiting_handover` (theo UI `bookingNextStatus`) |
| … | … | … | (lặp cho tới `completed`) |
| * | Status không trong enum | Any | 4xx, không đổi DB |

---

## 5. API kiểm thử theo nhóm (Postman / Thunder Client)

Chỉ liệt kê endpoint chính; mỗi request: **auth header**, **body**, **expected status**, **schema field tối thiểu**.

| Nhóm | Method & path | Roles được phép | 401 | 403 | 200/201 |
|------|---------------|-----------------|-----|-----|---------|
| Auth | `POST /api/auth/login` | Public | | | |
| Auth | `GET /api/auth/me` | Logged in | | | |
| Auth | `PATCH /api/auth/me` | Logged in | | | |
| Auth | `POST /api/auth/change-password` | Logged in | | | |
| Auth | `GET /api/auth/sessions` | Logged in | | | |
| Showroom public | `GET /api/showrooms/public/:userId` | Public | | | 404 nếu chưa approved |
| Vehicles | `POST /api/vehicles/getListVehicles` | Tuỳ | | | |
| Vehicles | `POST /api/vehicles/create` | Owner/Showroom | | | |
| Booking | `POST /api/booking/getListBookings` | All logged (filter khác nhau) | | | Showroom chỉ thấy của mình |
| Booking | `PATCH /api/booking/updateBookingStatus/:id` | Showroom / renter cancel / admin | | | |
| Payment | `POST /api/booking/:id/createPayment` | | | | |
| Contracts | `POST /api/contracts/list` | Showroom / Admin | | | |
| Inspections | `POST /api/vehicle-damage-inspections` | Showroom | | | |
| Uploads | `POST /api/uploads/image/*` | Logged | | | |
| Admin | `GET /api/admin/users` | Admin | | | |
| Admin | `PATCH /api/admin/showrooms/:id/approve` | Admin | | | |
| Notifications | `GET /api/notifications/*` | Logged | | | |

---

## 6. Bảo mật & hồi quy (cross-role)

| ID | Kiểm tra |
|----|----------|
| SEC-01 | Không có secret trong response JSON (Stripe secret, `.env`). |
| SEC-02 | CORS: origin lạ bị từ chối (tuỳ cấu hình). |
| SEC-03 | XSS: nhập `<script>` trong policy_text / mô tả — escape khi render (hoặc sanitize). |
| SEC-04 | IDOR: renter `getBookingById` booking người khác → 403. |
| SEC-05 | Showroom `updateBookingStatus` booking showroom khác → 403. |
| SEC-06 | Rate limit (nếu chưa có — ghi **tech debt**). |

---

## 7. Hiệu năng & UX tối thiểu

| ID | Tiêu chí |
|----|----------|
| PERF-01 | Lần đầu vào dashboard < N giây (đo trên máy dev). |
| PERF-02 | Danh sách booking 100+ dòng: pagination hoặc limit 200 không treo UI. |
| A11Y-01 | Skip link dashboard hoạt động. |
| A11Y-02 | Nút quan trọng có `aria-label`. |

---

## 8. Checklist go-live (Definition of Done)

- [ ] Tất cả mục **§2 Ma trận route** Pass cho 4 role + guest.
- [ ] **§3** mỗi role: ít nhất 80% case Pass; mọi Fail có ticket.
- [ ] **§4** booking matrix: mọi transition trong phạm vi sản phẩm Pass.
- [ ] **§5** API: nhóm critical (Auth, Booking, Payment, Admin approve) 100% Pass trên staging.
- [ ] **§6** SEC-04, SEC-05 Pass (IDOR).
- [ ] Regression smoke **30 phút** sau mỗi merge vào nhánh release.

---

## 9. Phụ lục — Trace ID / ghi log khi Fail

Khi báo bug, luôn đính kèm:

1. Role + account (che email: `u***@domain`).
2. URL đầy đủ + thời gian (UTC+7).
3. Request id / response body (che token).
4. Screenshot hoặc video 30s.
5. Mongo document `_id` booking / user liên quan.

---

## 10. Phụ lục — Inventory route `App.js` (đối chiếu nhanh)

| Path | Layout / guard | Page |
|------|----------------|------|
| `/login` | Public | Login |
| `/partner/register` | Public | PartnerRegister |
| `/admin/dashboard` | Protected + Role `admin` + DashboardLayout | AdminDashboard |
| `/admin/users` | … | UserManagement |
| `/admin/showrooms` | … | ShowroomVerification |
| `/admin/transactions` | … | TransactionMonitor |
| `/admin/profile` | … | AdminProfile |
| `/admin/moderation` | Navigate → `/admin/dashboard` | — |
| `/admin/reports` | Navigate → `/admin/dashboard` | — |
| `/showroom/dashboard` | Protected + Role `showroom` + DashboardLayout | ShowroomDashboard |
| `/showroom/vehicles` | … | VehicleManagement |
| `/showroom/bookings` | … | BookingManagement |
| `/showroom/contracts` | … | ContractManagement |
| `/showroom/customers` | … | CustomerManagement |
| `/showroom/revenue` | … | RevenueReports |
| `/showroom/ai-inspection` | … | AIInspection |
| `/showroom/profile` | … | ShowroomProfile |
| `/owner/dashboard` | Protected + Role `owner` + DashboardLayout | OwnerDashboard |
| `/owner/vehicles` | … | MyVehicles |
| `/owner/tracking` | … | VehicleTracking |
| `/owner/revenue` | … | Revenue |
| `/owner/profile` | … | OwnerProfile |
| `/renter/profile` | Protected + Role `renter` + DashboardLayout | Profile |
| `/renter/bookings` | … | MyBookings |
| `/renter/checkout` | Protected + Role `renter` **hoặc** `admin` + DashboardLayout | Checkout |
| `/renter/checkout/:carId` | … | Checkout |
| `/renter/payment-result` | **Không** ProtectedRoute / **Không** DashboardLayout | PaymentResult |
| `/renter/sos` | Protected + Role `renter` + DashboardLayout | SOSReport |
| `/` | Navbar + Footer | Home |
| `/xe/:id` | Navbar + Footer | CarDetail |
| `/map` | Navbar + Footer | MapPage |
| `*` (trong nhóm public) | Navbar + Footer | NotFound |

`ChatWidget` render global trong `App` (mọi route).

---

*Tài liệu này phản ánh cấu trúc `frontend/src/App.js`, `frontend/src/layouts/DashboardLayout.jsx`, `backend/src/app.js` tại thời điểm tạo. Khi thêm route hoặc role mới, cập nhật **§2**, **§3** và **§10** trước khi chạy regression.*
