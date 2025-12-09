import { useApi } from './index';
import { API_ENDPOINTS } from '../endpoints';

export const useUploadApi = () => {
  const api = useApi();
  return {
    uploadImage: (body: any) => api.postFile(API_ENDPOINTS.uploadImage, body),
    uploadDocument: (body: any) =>
      api.postFile(API_ENDPOINTS.uploadDocument, body),
    uploadExhibition: (body: any) =>
      api.postFile(API_ENDPOINTS.uploadExhibition, body),
  };
};
