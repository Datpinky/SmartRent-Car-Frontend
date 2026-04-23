## API Vehicle Location – Postman Body Examples

Router mount tại **`/api/vehicle_location`** (`app.js`).

**Tất cả route** dùng **`authMiddleware`** — cần header **`Authorization: Bearer <access_token>`**.  
`authorizeRoles("showroom")` đang bị comment trong code; hiện mọi user đã đăng nhập đều có thể gọi (tùy bạn bật lại sau).

---

### 1. Tạo vị trí xe (`createVehicleLocation`)

- **Method**: `POST`
- **URL**: `/api/vehicle_location/createVehicleLocation/:vehicleId`
- **Auth**: Bearer Token

**Path params**:

- **vehicleId**: MongoId của xe

**Body (JSON)** — tất cả optional (theo validator):

| Field | Ghi chú |
|--------|---------|
| `address` | Chuỗi |
| `latitude` | Chuỗi (tọa độ) |
| `longitude` | Chuỗi |
| `plus_code` | Chuỗi (Google Plus Code, v.v.) |

**Ví dụ URL Postman**:

```text
{{baseUrl}}/api/vehicle_location/createVehicleLocation/6648c4c2e0a1c231b8c9f123
```

**Ví dụ body Postman**:

```json
{
  "address": "123 Đường ABC, Quận 1, TP.HCM",
  "latitude": "10.776889",
  "longitude": "106.700806",
  "plus_code": "7P2V+8W"
}
```

Hoặc body rỗng `{}` vẫn hợp lệ nếu chỉ cần gắn bản ghi với `vehicleId`.

**Response (201)**:

```json
{
  "message": "Vehicle location created successfully ",
  "data": {
    "_id": "6650a4d5f2b3a11234567890",
    "vehicle": "6648c4c2e0a1c231b8c9f123",
    "address": "123 Đường ABC, Quận 1, TP.HCM",
    "latitude": "10.776889",
    "longitude": "106.700806",
    "plus_code": "7P2V+8W",
    "createdAt": "2024-05-28T10:15:00.000Z",
    "updatedAt": "2024-05-28T10:15:00.000Z"
  }
}
```

- `vehicleId` không phải MongoId → **422** (validation).

---

### 2. Lấy vị trí theo xe (`getVehicleLocationByVehicleId`)

- **Method**: `GET`
- **URL**: `/api/vehicle_location/getVehicleLocationByVehicleId/:vehicleId`
- **Auth**: Bearer Token

**Path params**:

- **vehicleId**: MongoId hợp lệ

**Body**: không bắt buộc (GET thường không gửi body).

**Ví dụ URL Postman**:

```text
{{baseUrl}}/api/vehicle_location/getVehicleLocationByVehicleId/6648c4c2e0a1c231b8c9f123
```

**Response (200)**:

```json
{
  "message": "User location received successfully",
  "data": null
}
```

*(Giá trị `data` phụ thuộc logic service/DB; có thể là object location hoặc `null`.)*

---

### 3. Cập nhật vị trí hiện tại (`updateCurrentLocation`)

- **Method**: `PUT`
- **URL**: `/api/vehicle_location/vehicle/:vehicleId`
- **Auth**: Bearer Token

**Path params**:

- **vehicleId**: MongoId xe

**Body (JSON)**:

| Field | Bắt buộc |
|--------|----------|
| `latitude` | Có |
| `longitude` | Có |
| `address` | Không |
| `plus_code` | Không |

**Ví dụ URL Postman**:

```text
{{baseUrl}}/api/vehicle_location/vehicle/6648c4c2e0a1c231b8c9f123
```

**Ví dụ body Postman**:

```json
{
  "latitude": "10.780000",
  "longitude": "106.705000",
  "address": "456 Đường XYZ",
  "plus_code": "7P3C+99"
}
```

**Response (200)**:

```json
{
  "message": "Vehicle location updated successfully",
  "data": {
    "_id": "6650a4d5f2b3a11234567890",
    "vehicle": "6648c4c2e0a1c231b8c9f123",
    "latitude": "10.780000",
    "longitude": "106.705000",
    "address": "456 Đường XYZ",
    "plus_code": "7P3C+99"
  }
}
```

- Xe không tồn tại → lỗi từ service (ví dụ **404** `Khong tim thay xe`).
- Thiếu `latitude` / `longitude` → **422**.

---

### Tóm tắt nhanh Postman

| # | Method | URL | Body |
|---|--------|-----|------|
| 1 | POST | `{{baseUrl}}/api/vehicle_location/createVehicleLocation/:vehicleId` | JSON optional: `address`, `latitude`, `longitude`, `plus_code` |
| 2 | GET | `{{baseUrl}}/api/vehicle_location/getVehicleLocationByVehicleId/:vehicleId` | — |
| 3 | PUT | `{{baseUrl}}/api/vehicle_location/vehicle/:vehicleId` | JSON bắt buộc: `latitude`, `longitude`; optional: `address`, `plus_code` |

> Mọi request: **Authorization: Bearer &lt;token&gt;**. Thay `:vehicleId` bằng MongoId thật.
