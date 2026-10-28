export interface User {
  id: string;
  name: string;
  username: string;
  createdAt: string;
  /** Может управлять пользователями (slip, mgairat) — приходит из /auth/me */
  canManageUsers?: boolean;
}

/** Сотрудник в разделе «Пользователи» */
export interface AdminUser {
  id: string;
  username: string;
  name: string | null;
  createdAt: string;
  isBlocked: boolean;
  lastLoginAt: string | null;
  /** Сколько изменений в журнале */
  changes: number;
  canManageUsers: boolean;
}
