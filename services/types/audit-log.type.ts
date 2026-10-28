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
  /** Название записи (бэкенд подставляет по id); null — запись удалена или тип без названия */
  entityTitle?: string | null;
  /** Slug — для страниц, которые открываются по нему */
  entitySlug?: string | null;
}

export interface AuditLogAuthor extends AuditLogUser {
  changes: number;
}

export interface AuditLogQuery extends IQuery {
  entityType?: string;
  entityId?: string;
  userId?: string;
  /** ISO-дата, включительно */
  from?: string;
  to?: string;
}
