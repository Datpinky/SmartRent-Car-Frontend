import apiClient from './apiClient';

export const uploadService = {
  /**
   * Upload up to 5 image files to Cloudinary via backend.
   * files: File[] array (from <input type="file">)
   * Returns: [{ url: string, publicId: string }]
   */
  async uploadImages(files) {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));

    const res = await apiClient.post('/api/uploads/image/files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data.data || [];
  },
};

export default uploadService;
