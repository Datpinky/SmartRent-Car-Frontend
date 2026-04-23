## API Auth – Postman Body Examples

Router auth được mount tại **`/api/auth`** (`app.js`). Các route **không** yêu cầu Bearer token.

---

### 1. Đăng ký (register)

- **Method**: `POST`
- **URL**: `/api/auth/register`
- **Auth**: Không

**Body (JSON)** — theo `user.model.js`:

| Field | Bắt buộc | Ghi chú |
|--------|----------|---------|
| `name` | Có | Chuỗi, trim |
| `email` | Có | Unique |
| `password` | Có | Tối thiểu **6** ký tự (sẽ hash trước khi lưu) |
| `role` | Không | `"user"` \| `"showroom"` \| `"admin"` — mặc định **`user`** |
| `is_active` | Không | Boolean, mặc định `true` |
| `age` | Không | Số |

**Ví dụ body Postman (tối thiểu)**:

```json
{
  "name": "Nguyen Van A",
  "email": "nguyenvana@example.com",
  "password": "secret123"
}
```

**Ví dụ body Postman (đầy đủ tùy chọn)**:

```json
{
  "name": "Nguyen Van A",
  "email": "nguyenvana@example.com",
  "password": "secret123",
  "role": "user",
  "is_active": true,
  "age": 25
}
```

**Response (201)**:

```json
{
  "message": "Register successfully",
  "data": {
    "_id": "6648c4c2e0a1c231b8c9aaaa",
    "name": "Nguyen Van A",
    "email": "nguyenvana@example.com",
    "role": "user",
    "is_active": true,
    "age": 25,
    "createdAt": "2024-05-28T10:15:00.000Z",
    "updatedAt": "2024-05-28T10:15:00.000Z"
  }
}
```

- Email đã tồn tại → lỗi **`Email already in use`** (status theo `throwError`, mặc định **404**).
- Thiếu field bắt buộc / validation Mongoose → lỗi validation tương ứng.

> Trong response, **`password`** không được trả về (Mongoose mặc định không `select` password ra JSON nếu không bật).

---

### 2. Đăng nhập (login)

- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Auth**: Không

**Body (JSON)**:

- **email**: bắt buộc
- **password**: bắt buộc (plain text, so khớp với hash trong DB)

**Ví dụ body Postman**:

```json
{
  "email": "nguyenvana@example.com",
  "password": "secret123"
}
```

**Response (201)** — lưu **`data.token`** để dùng header `Authorization: Bearer <token>` cho các API khác:

```json
{
  "message": "Login successfully",
  "data": {
    "user": {
      "_id": "6648c4c2e0a1c231b8c9aaaa",
      "email": "nguyenvana@example.com",
      "name": "Nguyen Van A",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

- Sai email hoặc user không tồn tại → **`Invalid email or password`**.
- Sai mật khẩu → **`Password not compare`**.

---

### Tóm tắt nhanh Postman

| # | Method | URL | Body JSON |
|---|--------|-----|-----------|
| 1 | POST | `{{baseUrl}}/api/auth/register` | `name`, `email`, `password` (+ tùy chọn `role`, `is_active`, `age`) |
| 2 | POST | `{{baseUrl}}/api/auth/login` | `email`, `password` |

**Postman tip**: Sau login, có thể set biến collection `access_token` = `data.token` (Tests tab) để các request sau dùng Bearer auth.

> Các `email`, `_id`, `token` trong ví dụ chỉ minh họa; thay bằng giá trị thật khi test.
