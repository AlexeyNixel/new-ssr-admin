import { useApi } from './index';
import { API_ENDPOINTS } from '../endpoints';

export const useUploadApi = () => {
  const api = useApi();
  return {
    uploadImage: (body: FormData) => api.postFile(API_ENDPOINTS.uploadImage, body),
    uploadDocument: (body: FormData) =>
      api.postFile(API_ENDPOINTS.uploadDocument, body),
    uploadAudio: (body: FormData) =>
      api.postFile(API_ENDPOINTS.uploadAudio, body),
  };
};
