# SmartRent Car — Test Guide

## Yêu cầu trước khi test

```
Backend đang chạy: cd backend && npm run dev   → http://localhost:5000
Frontend đang chạy: cd frontend && npm start  → http://localhost:3000
MongoDB Atlas: đã kết nối (kiểm tra MONGO_URI trong backend/.env)
```

---

## Lớp 1 — Kiểm tra API (REST)

Gọi trực tiếp `http://localhost:5000` bằng công cụ bạn chọn (Insomnia, Thunder Client, curl, v.v.). Đăng nhập để lấy JWT, gửi header `Authorization: Bearer <token>` cho các route cần auth.

### Kết quả mong đợi (tham khảo)

| Endpoint | Method | Expected Status | Auth |
|----------|--------|-----------------|------|
| /api/auth/register | POST | 201 | No |
| /api/auth/login | POST | 201 | No |
| /api/uploads/image/files | POST | 200/201 | No |
| /api/vehicles/getListVehicles | POST | 200 | No |
| /api/vehicles/getVehicleById/:id | GET | 201 | No |
| /api/vehicles/create | POST | 201 | Bearer JWT |
| /api/vehicles/deleteVehicleById/:id | DELETE | 201 | Bearer JWT |
| /api/vehicle_location/createVehicleLocation/:id | POST | 200/201 | Bearer JWT |
| /api/vehicle_location/getVehicleLocationByVehicleId/:id | GET | 200 | Bearer JWT |
| /api/vehicle_location/vehicle/:id | PUT | 200 | Bearer JWT |
| /api/reviews/get-by-vehicle | POST | 200 | No |
| /api/reviews/create | POST | 200/201 | Bearer JWT (role: user) |
| /api/reviews/update | PATCH | 200/201 | Bearer JWT (role: user) |
| /api/favorites/toggle | POST | 200 | Bearer JWT (role: user) |
| /api/favorites/my-favorites | POST | 200 | Bearer JWT (role: user) |

---

## Lớp 2 — UI Manual Checklist

### A. Auth Flow

- [ ] Truy cập http://localhost:3000/login
- [ ] Click tài khoản demo "admin@smartrent.com" → tự điền email/pass → Đăng nhập → Redirect `/admin/dashboard`
- [ ] Click demo "showroom@smartrent.com" → Redirect `/showroom/dashboard`
- [ ] Click demo "user@smartrent.com" → Redirect `/renter/profile`
- [ ] Click demo "owner@smartrent.com" → Redirect `/owner/dashboard` (mock-only)
- [ ] Đăng ký tài khoản mới → nhận thông báo "Tạo tài khoản thành công" → chuyển sang tab login
- [ ] Đăng nhập với sai password → hiện lỗi đỏ
- [ ] Đăng nhập với tài khoản mới tạo → thành công
- [ ] Truy cập trang cần auth khi chưa login → redirect về `/login`

### B. Vehicle Catalog Flow

- [ ] Trang chủ load danh sách xe (kiểm tra network tab: gọi POST /api/vehicles/getListVehicles)
- [ ] Nếu backend chạy và có xe → hiện xe từ API; nếu không → hiện banner "offline" + mock data
- [ ] Bộ lọc Brand/Fuel/Seats hoạt động đúng (filter trên data đã load)
- [ ] Search theo tên xe hoặc địa chỉ
- [ ] Click vào xe → trang CarDetail load (URL dạng `/xe/<mongoId>`)
- [ ] Trang CarDetail có map hiển thị đúng địa chỉ
- [ ] Trang CarDetail hiện danh sách reviews (section "Đánh giá")

### C. Favorites Flow (cần đăng nhập với role user)

- [ ] Đăng nhập với user (role "renter")
- [ ] Trang chủ: click heart trên CarCard → không báo lỗi, icon đổi màu đỏ
- [ ] Click heart lần 2 → bỏ yêu thích
- [ ] Khi chưa đăng nhập, click heart → redirect về `/login`

### D. Reviews Flow (cần đăng nhập với role user)

- [ ] Vào trang CarDetail của xe có mongo ID
- [ ] Hiện nút "+ Viết đánh giá" (chỉ khi đã đăng nhập)
- [ ] Click mở form → chọn sao → viết comment → Submit → review hiện ngay dưới
- [ ] Gửi review thiếu rating → thấy lỗi

### E. Upload Flow

- [ ] Vào Profile page của user → thấy FileUpload component
- [ ] Chọn ảnh → tự upload lên Cloudinary qua backend
- [ ] Hiện "✓ Đã tải" sau khi upload xong
- [ ] Nếu backend offline → hiện lỗi đỏ dưới vùng upload

### F. Admin / Showroom Dashboard

- [ ] Login admin → xem AdminDashboard render đúng các section
- [ ] Login showroom → xem ShowroomDashboard, chuyển variant 1/2/3
- [ ] Logout → bị redirect về login khi truy cập lại

---

## Lớp 3 — Smoke Regression Checklist

Chạy nhanh sau mỗi thay đổi lớn:

```
1. npm run build (trong /frontend) → không có compile error
2. Login với 4 role → đúng redirect
3. Home page load → có danh sách xe
4. CarDetail /xe/<id> → không crash
5. Favorite toggle → không crash khi logged in
6. Upload 1 ảnh → không crash
```

---

## Xử lý lỗi thường gặp

### ERR 1: "Không thể kết nối đến máy chủ" (frontend)
- **Hiện tượng**: Trang Home hiện banner màu vàng "Chế độ offline"
- **Nguyên nhân**: Backend không chạy, hoặc PORT sai, hoặc CORS bị chặn
- **Khắc phục**:
  1. Kiểm tra `backend/.env` có `PORT=5000`
  2. Chạy `cd backend && npm run dev`
  3. Kiểm tra console lỗi CORS → đảm bảo `CORS_ORIGINS` trong `backend/.env` có `http://localhost:3000`
  4. Kiểm tra `frontend/.env` có `REACT_APP_API_BASE_URL=http://localhost:5000`

### ERR 2: 422 Validation Error khi tạo xe
- **Hiện tượng**: API trả `{ message: "Validation error", errors: [...] }`
- **Nguyên nhân**: Thiếu các field bắt buộc hoặc sai enum
- **Khắc phục**: Xem `errors[].msg` để biết field nào sai; các enum hợp lệ: `vehicle_type`: Sedan/Bike/Bicycle/SUV/Wagon/Truck/others

### ERR 3: 401 Unauthorized khi gọi API cần auth
- **Hiện tượng**: API trả `{ message: "Missing or invalid Authorization header" }`
- **Nguyên nhân**: Token không được gửi hoặc đã hết hạn (7 ngày)
- **Khắc phục**: Đăng nhập lại, kiểm tra localStorage có `smartrent_token`

### ERR 4: 403 Forbidden khi gọi reviews/favorites
- **Hiện tượng**: API trả `{ message: "Forbidden: insufficient permissions" }`
- **Nguyên nhân**: Role tài khoản không phải `user` trong backend
- **Khắc phục**: Đăng ký tài khoản với `"role": "user"` hoặc đảm bảo đăng nhập bằng tài khoản role=user

### ERR 5: Frontend route `/xe/123` không tìm thấy xe
- **Hiện tượng**: "Không tìm thấy xe"
- **Nguyên nhân**: URL dùng numeric id (mock data) nhưng API cần MongoDB ObjectId
- **Khắc phục**: Khi xe từ API, URL sẽ là `/xe/<24-char-mongoId>`; xe từ mock data dùng `/xe/1`, `/xe/2`...

### ERR 6: Upload ảnh thất bại
- **Hiện tượng**: FileUpload hiện banner lỗi đỏ
- **Nguyên nhân**: Cloudinary credentials sai trong `backend/.env`
- **Khắc phục**: Kiểm tra `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` trong `backend/.env`

### ERR 7: Map không hiển thị
- **Hiện tượng**: Vùng map trống hoặc hiện "Không thể tải bản đồ"
- **Nguyên nhân**: LocationIQ API key hết quota, hoặc địa chỉ không tìm thấy
- **Khắc phục**: Nếu xe từ backend có lat/lng → map bỏ qua geocoding; nếu từ mock data → kiểm tra kết nối internet và API key LocationIQ

---

## Đăng ký & phân loại tài khoản

- **Consumer (Thuê xe / Chủ xe cá nhân):** tab Đăng ký trên `/login` — chọn "Thuê xe" hoặc "Cho thuê xe cá nhân". Backend nhận `account_type`: `renter` → `role: user`, `owner` → `role: owner`. Không thể gửi `admin`/`showroom` qua endpoint này.
- **Đối tác Showroom:** `/partner/register` — `POST /api/auth/register-showroom`. Tài khoản `role: showroom`, `showroom_status: pending`, `is_active: false` cho đến khi admin duyệt và bật tài khoản.
- **Đăng nhập showroom đang pending:** API trả 403 với thông báo chờ duyệt.

---

## Tạo tài khoản Admin (không qua API public)

Admin **không** được tạo qua form đăng ký công khai. Dùng script seed (một lần, trong thư mục `backend`):

```bash
cd backend
npm run seed:admin
```

Biến môi trường tùy chọn: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` (xem [backend/scripts/seedAdmin.js](backend/scripts/seedAdmin.js)).

Mặc định email: `admin@smartrent.local` — đổi mật khẩu sau lần đăng nhập đầu tiên.
