## API Review – Postman Body Examples

Router mount tại **`/api/reviews`** (`app.js`).

---

### 1. Lấy danh sách review theo xe

- **Method**: `POST`
- **URL**: `/api/reviews/get-by-vehicle`
- **Auth**: Không (route này đứng **trước** `authMiddleware` trong `review.route.js`)

**Body (JSON)**:

- **vehicle_id**: bắt buộc, MongoId
- **page**: tùy chọn, số nguyên ≥ 1 (mặc định **1** trong service)
- **limit**: tùy chọn, 1–100 (mặc định **10**)

**Ví dụ body Postman**:

```json
{
  "vehicle_id": "6648c4c2e0a1c231b8c9f123",
  "page": 1,
  "limit": 10
}
```

**Response (200 – ví dụ)**:

```json
{
  "message": "Reviews received successfully",
  "data": [
    {
      "_id": "6650a4d5f2b3a11234567890",
      "user": {
        "_id": "6648c4c2e0a1c231b8c9aaaa",
        "name": "User A"
      },
      "vehicle_id": "6648c4c2e0a1c231b8c9f123",
      "rating": 5,
      "comment": "Xe chạy rất tốt",
      "createdAt": "2024-05-28T10:15:00.000Z",
      "updatedAt": "2024-05-28T10:15:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

- Xe không tồn tại → **404** (`Không tìm thấy xe`).
- Sai validation → **422** (`message: "Validation error"`, `errors: [...]`).

---

### 2. Tạo review cho xe

- **Method**: `POST`
- **URL**: `/api/reviews/create`
- **Auth**: **Bearer Token**, role **`user`** (`authorizeRoles("user")`)

**Body (JSON)**:

| Field | Bắt buộc | Ghi chú |
|--------|----------|---------|
| `vehicle_id` | Có | MongoId |
| `rating` | Có | Số nguyên 1–5 |
| `comment` | Không | Tối đa 1000 ký tự |

**Ví dụ body Postman**:

```json
{
  "vehicle_id": "6648c4c2e0a1c231b8c9f123",
  "rating": 5,
  "comment": "Xe rất tốt, tài xế thân thiện."
}
```

**Response (201)**:

```json
{
  "message": "Review created successfully",
  "data": {
    "_id": "6650a4d5f2b3a11234567890",
    "user": "6648c4c2e0a1c231b8c9aaaa",
    "vehicle_id": "6648c4c2e0a1c231b8c9f123",
    "rating": 5,
    "comment": "Xe rất tốt, tài xế thân thiện.",
    "createdAt": "2024-05-28T10:15:00.000Z",
    "updatedAt": "2024-05-28T10:15:00.000Z"
  }
}
```

- Xe không tồn tại → **404** (`Không tìm thấy xe`).
- Thiếu / sai token hoặc không phải role `user` → **401** / **403** (tùy middleware).

---

### 3. Cập nhật review đã có

- **Method**: `PATCH`
- **URL**: `/api/reviews/update`
- **Auth**: **Bearer Token**, role **`user`**

**Body (JSON)**:

| Field | Bắt buộc | Ghi chú |
|--------|----------|---------|
| `review_id` | Có | MongoId của bản review |
| `rating` | Có | 1–5 |
| `comment` | Không | Tối đa 1000 ký tự |

**Ví dụ body Postman**:

```json
{
  "review_id": "6650a4d5f2b3a11234567890",
  "rating": 4,
  "comment": "Sau vài chuyến vẫn ổn nhưng cần bảo dưỡng thêm."
}
```

**Response (200)**:

```json
{
  "message": "Review updated successfully",
  "data": {
    "_id": "6650a4d5f2b3a11234567890",
    "user": "6648c4c2e0a1c231b8c9aaaa",
    "vehicle_id": "6648c4c2e0a1c231b8c9f123",
    "rating": 4,
    "comment": "Sau vài chuyến vẫn ổn nhưng cần bảo dưỡng thêm.",
    "createdAt": "2024-05-28T10:15:00.000Z",
    "updatedAt": "2024-05-28T11:00:00.000Z"
  }
}
```

- Không tìm thấy review hoặc không phải review của user hiện tại → **404** (`Không tìm thấy đánh giá để cập nhật`).

---

### Tóm tắt nhanh Postman

| # | Method | URL | Auth | Body |
|---|--------|-----|------|------|
| 1 | POST | `{{baseUrl}}/api/reviews/get-by-vehicle` | Không | `vehicle_id`, optional `page`, `limit` |
| 2 | POST | `{{baseUrl}}/api/reviews/create` | Bearer (`user`) | `vehicle_id`, `rating`, optional `comment` |
| 3 | PATCH | `{{baseUrl}}/api/reviews/update` | Bearer (`user`) | `review_id`, `rating`, optional `comment` |

> Các ID trong ví dụ chỉ mang tính minh họa; thay bằng giá trị thật khi test.
