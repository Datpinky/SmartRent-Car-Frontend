import api from './api';

/**
 * userService – gọi API /api/users
 * Mapping với User model trong DB:
 *   first_name, other_name, last_name, email, phone
 *   roles: "user" | "admin" | "owner" | "showroom"
 *   id_type, id_number, date_of_birth, address
 *   user_image_path, user_identification_image
 *   active, verified
 */

// GET /api/users/getListUsers  (admin)
export const getAllUsers = async () => {
  const response = await api.get('/users/getListUsers');
  return response.data;
};

// GET /api/users/getUserById/:id
export const getUserById = async (id) => {
  const response = await api.get(`/users/getUserById/${id}`);
  return response.data;
};

// PUT /api/users/updateUserById/:id
export const updateUserById = async (id, data) => {
  // data có thể gồm: first_name, last_name, phone, address, date_of_birth, id_type, id_number...
  const response = await api.put(`/users/updateUserById/${id}`, data);
  return response.data;
};

// DELETE /api/users/deleteUserById/:id  (admin)
export const deleteUserById = async (id) => {
  const response = await api.delete(`/users/deleteUserById/${id}`);
  return response.data;
};

// POST /api/users/create (admin tạo user)
export const createUser = async (userData) => {
  const response = await api.post('/users/create', userData);
  return response.data;
};
