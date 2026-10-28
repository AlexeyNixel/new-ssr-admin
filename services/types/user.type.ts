export interface User {
  id: string;
  name: string;
  username: string;
  createdAt: string;
  /** Может управлять пользователями (slip, mgairat) — приходит из /auth/me */
  canManageUsers?: boolean;
  /** Доступные разделы админки (app/constants/sections.ts); null — все */
  sections?: string[] | null;
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
  /** null — все разделы */
  sections: string[] | null;
}
