import { useApi } from './index';
import type { AuditLogEntry, AuditLogQuery } from '../types/audit-log.type';
import { API_ENDPOINTS } from '../endpoints';

export const useAuditLogApi = () => {
  const api = useApi();

  return {
    getAuditLog: (params?: AuditLogQuery) =>
      api.get<AuditLogEntry[]>(API_ENDPOINTS.auditLog, { params }),
  };
};
