import api from './api';

// GET /api/posts/listPost
export const getListPosts = async () => {
  const response = await api.get('/posts/listPost');
  return response.data; // { message, data: [...posts] }
};

// GET /api/posts/getPostById/:post_id
export const getPostById = async (postId) => {
  const response = await api.get(`/posts/getPostById/${postId}`);
  return response.data;
};

// GET /api/posts/getPostByUserId  (cần token)
export const getPostByUserId = async () => {
  const response = await api.get('/posts/getPostByUserId');
  return response.data;
};

// POST /api/posts/create  (cần token + role admin)
export const createPost = async (postData) => {
  const response = await api.post('/posts/create', postData);
  return response.data;
};

// PUT /api/posts/updatePostById/:post_id
export const updatePostById = async (postId, data) => {
  const response = await api.put(`/posts/updatePostById/${postId}`, data);
  return response.data;
};

// DELETE /api/posts/deletePostById/:post_id
export const deletePostById = async (postId) => {
  const response = await api.delete(`/posts/deletePostById/${postId}`);
  return response.data;
};
