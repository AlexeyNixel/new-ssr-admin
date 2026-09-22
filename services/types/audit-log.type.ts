import type { IQuery } from './query.type';

export type AuditAction = 'CREATE' | 'UPDATE';

export interface AuditLogUser {
  id: string;
  username: string;
  name: string | null;
}

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId: string | null;
  createdAt: string;
  user: AuditLogUser | null;
}

export interface AuditLogQuery extends IQuery {
  entityType?: string;
  entityId?: string;
}
