/*
 * Адрес короткой ссылки на сайте: <siteUrl>/go/<slug>.
 * Перенаправление делает сайт (frontend: server/routes/go/[...slug].ts).
 */
export function useShortLinkUrl() {
  const siteUrl = (useRuntimeConfig().public.siteUrl as string).replace(/\/+$/, '');
  const prefix = `${siteUrl}/go/`;

  return {
    /** Полный адрес — для копирования и перехода */
    full: (slug: string) => prefix + slug,
    /** Без протокола — для показа: infomania.ru/go/leto2026 */
    display: (slug: string) => (prefix + slug).replace(/^https?:\/\//, ''),
    displayPrefix: prefix.replace(/^https?:\/\//, ''),
  };
}
