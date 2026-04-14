# SmartRent Car — Gap Analysis
> Phân tích sau khi tích hợp 15 API hiện có. Đây là backlog cho giai đoạn tiếp theo.

---

## PHẦN 1 — API CÒN THIẾU (Backend cần bổ sung)

### Mức độ ưu tiên: P0 = Chặn toàn bộ flow | P1 = Ảnh hưởng nghiệp vụ chính | P2 = Nice-to-have

---

### MODULE: Booking (Đặt xe / Thuê xe)
| # | Method | Path | Mô tả | Priority | Frontend cần |
|---|--------|------|--------|----------|--------------|
| 1 | POST | /api/bookings/create | Tạo đơn đặt xe | **P0** | Checkout.jsx → Đặt xe ngay |
| 2 | GET | /api/bookings/my-bookings | Lịch sử thuê của renter | **P0** | MyBookings.jsx |
| 3 | GET | /api/bookings/:id | Chi tiết 1 booking | **P0** | MyBookings detail, contract view |
| 4 | PUT | /api/bookings/:id/status | Showroom cập nhật trạng thái booking | **P0** | BookingManagement.jsx |
| 5 | GET | /api/bookings/showroom | Danh sách booking của showroom | **P0** | BookingManagement.jsx |
| 6 | POST | /api/bookings/:id/cancel | Renter hủy booking | P1 | MyBookings → Hủy |
| 7 | GET | /api/bookings/admin | Admin xem tất cả booking | P1 | AdminDashboard, TransactionMonitor |

**Schema tối thiểu (Booking model)**:
```js
{
  renter_id: ObjectId,
  vehicle_id: ObjectId,
  showroom_id: ObjectId,
  pickup_datetime: Date,
  return_datetime: Date,
  total_price: Number,
  status: enum['pending','confirmed','in_progress','completed','cancelled'],
  payment_status: enum['unpaid','paid','refunded'],
  notes: String,
}
```

---

### MODULE: Payment (Thanh toán)
| # | Method | Path | Mô tả | Priority | Frontend cần |
|---|--------|------|--------|----------|--------------|
| 8 | POST | /api/payments/create | Tạo giao dịch thanh toán | **P0** | Checkout.jsx → Pay |
| 9 | POST | /api/payments/callback | Webhook nhận kết quả thanh toán | **P0** | PaymentResult.jsx |
| 10 | GET | /api/payments/:bookingId | Thông tin thanh toán của booking | **P1** | PaymentResult, MyBookings |
| 11 | GET | /api/payments/admin | Admin xem tất cả transactions | P1 | TransactionMonitor.jsx |
| 12 | GET | /api/payments/revenue | Tổng doanh thu showroom/owner | P1 | RevenueReports.jsx, Revenue.jsx |

> Cân nhắc tích hợp **VNPay** hoặc **MoMo** cho thanh toán VN. Backend cần `payment_gateway` field.

---

### MODULE: Contract (Hợp đồng)
| # | Method | Path | Mô tả | Priority | Frontend cần |
|---|--------|------|--------|----------|--------------|
| 13 | POST | /api/contracts/generate | Tự động tạo hợp đồng từ booking | P1 | ContractManagement.jsx |
| 14 | GET | /api/contracts/:id | Xem chi tiết hợp đồng | P1 | ContractManagement.jsx |
| 15 | GET | /api/contracts/my | Hợp đồng của renter | P1 | MyBookings → Hợp đồng |
| 16 | PUT | /api/contracts/:id/sign | Ký hợp đồng điện tử | P2 | Digital signature flow |

---

### MODULE: Admin Moderation
| # | Method | Path | Mô tả | Priority | Frontend cần |
|---|--------|------|--------|----------|--------------|
| 17 | GET | /api/admin/reviews | Lấy tất cả review để kiểm duyệt | **P0** | ContentModeration.jsx |
| 18 | PUT | /api/admin/reviews/:id/approve | Duyệt review | **P0** | ContentModeration.jsx |
| 19 | DELETE | /api/admin/reviews/:id | Xóa review vi phạm | **P0** | ContentModeration.jsx |
| 20 | GET | /api/admin/users | Danh sách tất cả users | **P0** | UserManagement.jsx |
| 21 | PUT | /api/admin/users/:id/status | Kích hoạt / tắt tài khoản | P1 | UserManagement.jsx |
| 22 | GET | /api/admin/showrooms | Danh sách showroom chờ duyệt | **P0** | ShowroomVerification.jsx |
| 23 | PUT | /api/admin/showrooms/:id/verify | Duyệt/từ chối showroom | **P0** | ShowroomVerification.jsx |

---

### MODULE: SOS / Support
| # | Method | Path | Mô tả | Priority | Frontend cần |
|---|--------|------|--------|----------|--------------|
| 24 | POST | /api/support/incident | Gửi báo cáo sự cố | P1 | SOSReport.jsx |
| 25 | GET | /api/support/incidents | Admin xem tất cả sự cố | P1 | Admin support page |
| 26 | PUT | /api/support/incidents/:id/resolve | Admin đánh dấu đã xử lý | P2 | Admin support page |

> Backend đã có `contactUs.model.js` — chỉ cần thêm route + controller cho model này.

---

### MODULE: Notifications
| # | Method | Path | Mô tả | Priority | Frontend cần |
|---|--------|------|--------|----------|--------------|
| 27 | GET | /api/notifications | Lấy thông báo của user | P1 | NotificationBell.jsx |
| 28 | PUT | /api/notifications/:id/read | Đánh dấu đã đọc | P1 | NotificationBell.jsx |
| 29 | DELETE | /api/notifications/all | Xóa tất cả thông báo | P2 | NotificationBell.jsx |

---

### MODULE: Chat / Messaging
| # | Method | Path | Mô tả | Priority | Frontend cần |
|---|--------|------|--------|----------|--------------|
| 30 | GET | /api/chat/conversations | Danh sách cuộc hội thoại | P1 | ChatWidget.jsx |
| 31 | GET | /api/chat/:conversationId/messages | Tin nhắn trong cuộc hội thoại | P1 | ChatWidget.jsx |
| 32 | POST | /api/chat/:conversationId/send | Gửi tin nhắn | P1 | ChatWidget.jsx |
> Real-time chat → cân nhắc **Socket.IO** thay vì REST polling.

---

### MODULE: AI Damage Detection
| # | Method | Path | Mô tả | Priority | Frontend cần |
|---|--------|------|--------|----------|--------------|
| 33 | POST | /api/ai/inspect | Gửi ảnh xe để AI phân tích hư hỏng | P1 | AIInspection.jsx |
| 34 | GET | /api/ai/inspections/:vehicleId | Lịch sử kiểm tra AI | P2 | AIInspection.jsx |

---

### MODULE: User Profile
| # | Method | Path | Mô tả | Priority | Frontend cần |
|---|--------|------|--------|----------|--------------|
| 35 | GET | /api/users/me | Lấy thông tin profile hiện tại | **P0** | Profile.jsx, AdminProfile.jsx |
| 36 | PUT | /api/users/me | Cập nhật profile | **P0** | Profile.jsx, AdminProfile.jsx |
| 37 | PUT | /api/users/me/password | Đổi mật khẩu | P1 | Profile settings |
| 38 | POST | /api/users/me/avatar | Upload ảnh đại diện | P1 | Profile.jsx (FileUpload) |

---

## PHẦN 2 — TRANG FRONTEND CÒN THIẾU

### Renter Portal (P0)

| Trang | Route | Mô tả | API cần |
|-------|-------|--------|---------|
| Checkout (real) | /renter/checkout/:carId | Form đặt xe có chọn ngày, voucher, tính giá real | Booking create, Vehicle getById |
| Payment Gateway | /renter/payment | Redirect sang VNPay/MoMo / hiện QR code | Payment create |
| Payment Result (real) | /renter/payment-result | Xác nhận kết quả, hiện booking detail | Payment callback, Booking getById |
| My Bookings (real) | /renter/bookings | Danh sách booking từ API, lọc theo status | Booking my-bookings |
| Booking Detail | /renter/bookings/:id | Chi tiết chuyến đi + hợp đồng + timeline | Booking getById, Contract |

### Owner Portal (P0)

| Trang | Route | Mô tả | API cần |
|-------|-------|--------|---------|
| Owner đăng ký xe | /owner/vehicles/add | Form đăng ký xe mới (hiện chưa có form đầy đủ) | Vehicle create, Upload |
| My Vehicles (real) | /owner/vehicles | Danh sách xe từ API, quản lý trạng thái | Vehicle getList (filter by added_by) |
| Vehicle Tracking (real) | /owner/vehicles/:id/track | Map real-time vị trí xe | VehicleLocation getById |
| Revenue (real) | /owner/revenue | Doanh thu thực từ API | Payment revenue |

### Showroom Portal (P1)

| Trang | Route | Mô tả | API cần |
|-------|-------|--------|---------|
| Quản lý xe (real) | /showroom/vehicles | CRUD xe của showroom từ API | Vehicle create/list/delete |
| Booking management (real) | /showroom/bookings | Danh sách booking thực, update status | Booking showroom list |
| Contract management (real) | /showroom/contracts | Xem/tạo hợp đồng | Contract generate/list |
| Customer Management (real) | /showroom/customers | Danh sách khách hàng đã thuê | Booking getList → aggregate renters |
| Revenue Reports (real) | /showroom/revenue | Biểu đồ doanh thu thực | Payment revenue |
| AI Inspection (real) | /showroom/ai-inspect | Upload ảnh → AI phân tích | AI inspect API |

### Admin Portal (P1)

| Trang | Route | Mô tả | API cần |
|-------|-------|--------|---------|
| User Management (real) | /admin/users | Danh sách user từ API, ban/unban | Admin users list/update |
| Showroom Verification (real) | /admin/showrooms/verify | Duyệt showroom mới đăng ký | Admin showrooms list/verify |
| Content Moderation (real) | /admin/moderation | Review/report từ API, approve/reject | Admin reviews list |
| Transaction Monitor (real) | /admin/transactions | Giao dịch thực từ payment API | Payment admin list |

### Pages chưa có

| Trang | Route | Mô tả | Priority |
|-------|-------|--------|----------|
| Notifications Page | /notifications | Trang xem tất cả thông báo | P1 |
| Search Results | /search | Kết quả tìm kiếm có filter nâng cao | P1 |
| Vehicle Compare | /compare | So sánh 2-3 xe cùng lúc | P2 |
| Showroom Public Profile | /showroom/:id | Trang public của showroom (khách xem) | P2 |
| Forgot Password | /forgot-password | Form gửi email reset mật khẩu | P1 |
| Reset Password | /reset-password/:token | Form đặt lại mật khẩu | P1 |
| Terms of Service | /terms | Điều khoản dịch vụ | P2 |
| About / Contact | /about | Trang giới thiệu | P2 |

---

## PHẦN 3 — PHÂN TÍCH ƯU TIÊN TRIỂN KHAI TIẾP THEO

### Sprint tiếp theo (Cao nhất — P0):

```
1. Backend: Booking module (create, list, status update)
2. Backend: Payment create + webhook
3. Backend: User profile GET/PUT /api/users/me
4. Frontend: Checkout.jsx gọi API thật
5. Frontend: MyBookings.jsx gọi API thật
6. Frontend: Profile.jsx gọi API thật
```

### Sprint sau (P1):

```
7. Backend: Admin user management routes
8. Backend: Admin showroom verification routes
9. Backend: contactUs → SOS/incident routes
10. Frontend: Admin pages gọi API thật (UserManagement, ShowroomVerification, ContentModeration)
11. Frontend: SOSReport.jsx gọi API thật
12. Frontend: Forgot password flow
```

### Sprint dài hạn (P2):

```
13. Real-time chat (Socket.IO)
14. AI Damage Detection API
15. Identity verification integration
16. Payment gateway (VNPay / MoMo)
17. Push notifications
```

---

## TÓM TẮT SỐ LIỆU

| Hạng mục | Số lượng |
|----------|----------|
| API backend hiện có | 15 |
| API backend còn thiếu | 40 |
| Trang frontend hiện có | 25+ |
| Trang frontend còn thiếu/chưa kết nối API | 20+ |
| **Tổng API cần có cho sản phẩm đầy đủ** | **~55** |
