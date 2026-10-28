import { sectionForPath } from '~/constants/sections';
import type { User } from '~~/services/types/user.type';

/*
 * Доступ текущего сотрудника к разделам админки. Данные — из /auth/me (кука user_data):
 * sections = null — все разделы. Это только для интерфейса: бэкенд проверяет доступ сам.
 */
export function useAccess() {
  const user = useCookie<User | null>('user_data');

  const can = (section: string) => {
    if (user.value?.canManageUsers) return true;
    const sections = user.value?.sections;
    return sections == null || sections.includes(section);
  };

  /** Можно ли открыть страницу админки по адресу */
  const canPath = (path: string) => {
    const section = sectionForPath(path);
    return !section || can(section.key);
  };

  return { can, canPath };
}
