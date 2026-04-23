## API Vehicle – Postman Body Examples

Router vehicle mount tại **`/api/vehicles`** (`app.js`).

---

### Giá trị enum (theo `vehicle.validation.js`)

- **vehicle_type**: `Sedan`, `Bike`, `Bicyle`, `SUV`, `Wagon`, `Truck`, `others`
- **vehicle_hire_rate_currency** (optional): `VND`, `USD`
- **vehicle_hire_charge_per_timing** (optional): `minutes`, `seconds`, `hourly`, `day`, `negotiable`
- **status** (optional): `Available`, `Maintenance`, `Rented`, `Reserved`
- **getListVehicles — sort_by / sort_by_price**: `-1` hoặc `1` (số nguyên)

> **Lưu ý**: Schema `vehicle.model.js` dùng `status` chữ thường (`available`, `maintenance`, …) và `vehicle_type` có `Bicycle` (khác chính tả `Bicyle` ở validator). Khi **tạo xe**, nên **bỏ qua** field `status` để dùng default của DB, hoặc đồng bộ validator với model — nếu gửi `status` đúng validator nhưng không khớp enum MongoDB, có thể lỗi khi lưu.

---

### 1. Tạo xe (`create`)

- **Method**: `POST`
- **URL**: `/api/vehicles/create`
- **Auth**: **Bearer Token** (bắt buộc — `authMiddleware`)

**Body (JSON)** — các field bắt buộc theo validator:

| Field | Bắt buộc | Ghi chú |
|--------|----------|---------|
| `vehicle_type` | Có | Một trong enum ở trên |
| `vehicle_brand` | Có | Chuỗi |
| `vehicle_model` | Có | Chuỗi |
| `vehicle_engine_number` | Có | Chuỗi |
| `vehicle_identification_number` | Có | Chuỗi |
| `vehicle_plate_number` | Có | Chuỗi |
| `vehicle_images_paths` | Không | Mảng URL |
| `vehicle_hire_rate_in_figures` | Không | Số > 0 |
| `vehicle_hire_rate_currency` | Không | `VND` / `USD` |
| `vehicle_hire_charge_per_timing` | Không | Theo enum |
| `maximum_allowable_distance` | Không | Chuỗi |
| `status` | Không | Theo enum validator (xem lưu ý trên) |
| `company_owned` | Không | Boolean |
| `active` | Không | Boolean |

Server gắn thêm **`added_by`** = `userId` từ token.

**Ví dụ body Postman**:

```json
{
  "vehicle_type": "Sedan",
  "vehicle_brand": "Toyota",
  "vehicle_model": "Camry",
  "vehicle_engine_number": "ENG-2024-001",
  "vehicle_identification_number": "VIN-1HGBH41JXMN109186",
  "vehicle_plate_number": "51A-12345",
  "vehicle_images_paths": [
    "https://example.com/uploads/car1.jpg"
  ],
  "vehicle_hire_rate_in_figures": 800000,
  "vehicle_hire_rate_currency": "VND",
  "vehicle_hire_charge_per_timing": "day",
  "maximum_allowable_distance": "500 km/ngày",
  "company_owned": false,
  "active": true
}
```

**Response (201)**:

```json
{
  "message": "Vehicle created successfully",
  "data": {
    "_id": "6648c4c2e0a1c231b8c9f123",
    "vehicle_type": "Sedan",
    "vehicle_brand": "Toyota",
    "vehicle_model": "Camry",
    "added_by": "6648c4c2e0a1c231b8c9aaaa",
    "createdAt": "2024-05-28T10:15:00.000Z",
    "updatedAt": "2024-05-28T10:15:00.000Z"
  }
}
```

- Lỗi validation → **422** (`message: "Validation error"`, `errors: [{ field, msg }]`).
- Thiếu / sai token → **401**.

---

### 2. Danh sách xe (`getListVehicles`)

- **Method**: `POST`
- **URL**: `/api/vehicles/getListVehicles`
- **Auth**: Không

**Body (JSON)** — tất cả optional:

| Field | Ghi chú |
|--------|---------|
| `search` | Tìm theo regex (không phân biệt hoa thường) trên **`vehicle_brand`**, **`vehicle_model`** |
| `page` | Số nguyên ≥ 1 (mặc định service: 1) |
| `limit` | 1–100 (mặc định 10) |
| `sort_by` | `-1` = mới nhất trước, `1` = cũ nhất (`createdAt`) |
| `sort_by_price` | `-1` / `1` sắp theo **`vehicle_hire_rate_in_figures`** |
| `vehicle_type` | Lọc đúng enum |
| `added_by` | MongoId user tạo xe |

**Ví dụ body Postman (rỗng — lấy trang 1 mặc định)**:

```json
{}
```

**Ví dụ body Postman (lọc + phân trang + sort)**:

```json
{
  "search": "Toyota",
  "vehicle_type": "Sedan",
  "page": 1,
  "limit": 20,
  "sort_by": -1,
  "sort_by_price": 1,
  "added_by": "6648c4c2e0a1c231b8c9aaaa"
}
```

**Response (200)**:

```json
{
  "message": "Vehicle received successfully",
  "data": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0
  }
}
```

---

### 3. Chi tiết xe theo ID (`getVehicleById`)

- **Method**: `GET`
- **URL**: `/api/vehicles/getVehicleById/:vehicleId`
- **Auth**: Không

**Params**: `vehicleId` — MongoId hợp lệ.

**Ví dụ URL Postman**:

```text
{{baseUrl}}/api/vehicles/getVehicleById/6648c4c2e0a1c231b8c9f123
```

**Body**: không cần.

**Response**: controller trả **201** với `data` là document xe hoặc `null` nếu không tìm thấy (hành vi hiện tại của code).

```json
{
  "message": " Vehicle  received successfully",
  "data": {
    "_id": "6648c4c2e0a1c231b8c9f123",
    "vehicle_brand": "Toyota",
    "vehicle_model": "Camry"
  }
}
```

- `vehicleId` không hợp lệ → **422** (validation).

---

### 4. Xóa xe theo ID (`deleteVehicleById`)

- **Method**: `DELETE`
- **URL**: `/api/vehicles/deleteVehicleById/:vehicleId`
- **Auth**: Không *(route hiện tại không bật `authMiddleware`)*

**Ví dụ URL Postman**:

```text
{{baseUrl}}/api/vehicles/deleteVehicleById/6648c4c2e0a1c231b8c9f123
```

**Body**: không cần.

**Response (201)** *(status code theo controller)*:

```json
{
  "message": "Vehicle delete successfully",
  "data": {
    "_id": "6648c4c2e0a1c231b8c9f123"
  }
}
```

- Nếu ID không tồn tại, `data` có thể là `null`.

---

### Tóm tắt nhanh Postman

| # | Method | URL | Auth | Body / Params |
|---|--------|-----|------|----------------|
| 1 | POST | `/api/vehicles/create` | Bearer | JSON đầy đủ field bắt buộc tạo xe |
| 2 | POST | `/api/vehicles/getListVehicles` | Không | JSON (optional): `search`, `page`, `limit`, `sort_by`, `sort_by_price`, `vehicle_type`, `added_by` |
| 3 | GET | `/api/vehicles/getVehicleById/:vehicleId` | Không | Path param `vehicleId` |
| 4 | DELETE | `/api/vehicles/deleteVehicleById/:vehicleId` | Không | Path param `vehicleId` |

> Các `_id` và URL chỉ là ví dụ; thay bằng giá trị thật khi test.
