## API Favorites – Postman Body Examples

Tất cả route favorites được mount tại **`/api/favorites`** (`app.js`). Mọi endpoint đều dùng **`authMiddleware`** và **`authorizeRoles("user")`** — chỉ user có role `user` mới gọi được.

### Auth (Postman)

- Tab **Authorization** → Type **Bearer Token**, dán access token sau khi login.
- Hoặc header thủ công: `Authorization: Bearer <access_token>`

---

### 1. Bật / tắt yêu thích xe (toggle)

- **Method**: `POST`
- **URL**: `/api/favorites/toggle`
- **Auth**: Bearer Token (role `user`)

**Body (JSON)**:

- **vehicle_id**: bắt buộc, MongoId của xe

**Ví dụ body Postman**:

```json
{
  "vehicle_id": "6648c4c2e0a1c231b8c9f123"
}
```

**Response (200 – thêm vào yêu thích)**:

```json
{
  "message": "Favorite toggled successfully",
  "data": {
    "favorite": true,
    "vehicle_id": "6648c4c2e0a1c231b8c9f123"
  }
}
```

**Response (200 – bỏ yêu thích)**:

```json
{
  "message": "Favorite toggled successfully",
  "data": {
    "favorited": false,
    "vehicle_id": "6648c4c2e0a1c231b8c9f123"
  }
}
```

- Xe không tồn tại → **404** (`khong tim thay xe`).
- Thiếu / sai token → **401**.

---

### 2. Danh sách yêu thích của tôi (có phân trang)

- **Method**: `POST`
- **URL**: `/api/favorites/my-favorites`
- **Auth**: Bearer Token (role `user`)

**Body (JSON)**:

- **page**: tùy chọn, số nguyên ≥ 1 (mặc định **1**)
- **limit**: tùy chọn, số nguyên từ 1 đến **100** (mặc định **10**)

**Ví dụ body Postman (mặc định phân trang)**:

```json
{}
```

**Ví dụ body Postman (tùy chỉnh trang)**:

```json
{
  "page": 1,
  "limit": 10
}
```

**Response (200 – ví dụ)**:

```json
{
  "message": "My favorites received successfully",
  "data": [
    {
      "_id": "6650a4d5f2b3a11234567890",
      "user_id": "6648c4c2e0a1c231b8c9aaaa",
      "vehicle_id": {
        "_id": "6648c4c2e0a1c231b8c9f123",
        "vehicle_name": "Toyota Camry",
        "brand": "Toyota",
        "model": "Camry",
        "vehicle_hire_rate_in_figures": 500000,
        "status": "available",
        "images": []
      },
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

---

### Tóm tắt nhanh Postman

| # | Method | URL | Body JSON |
|---|--------|-----|-----------|
| 1 | POST | `{{baseUrl}}/api/favorites/toggle` | `{ "vehicle_id": "<mongoId>" }` |
| 2 | POST | `{{baseUrl}}/api/favorites/my-favorites` | `{ "page": 1, "limit": 10 }` hoặc `{}` |

> **Lưu ý**: `vehicle_id`, `_id`… chỉ là ví dụ; thay bằng ID thật từ DB. Trong response toggle, field boolean khi thêm là `favorite`, khi xóa là `favorited` — đúng theo code hiện tại của service.
