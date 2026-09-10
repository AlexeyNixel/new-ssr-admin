interface ModalHandle {
  open: (props?: Record<string, unknown>) => { result: Promise<unknown> };
}

interface UseModalRouteOpenerOptions {
  /** Результат `overlay.create(ModalsAdminX)` со страницы. */
  modal: ModalHandle;
  /** Вызывается, если модалка закрылась с сохранением (обычно — рефетч списка). */
  onClosed?: () => unknown;
  /** Имя query-параметра. По умолчанию `editId`. */
  param?: string;
}

/**
 * Открывает модалку редактирования при заходе на страницу-список по ссылке
 * `/<entity>?editId=<id>`. Сущность модалка резолвит сама (`useModalEntity`) —
 * здесь только факт открытия. Параметр читается один раз при инициализации
 * страницы (SPA), URL не изменяется.
 */
export function useModalRouteOpener(options: UseModalRouteOpenerOptions) {
  const { modal, onClosed, param = 'editId' } = options;
  const route = useRoute();

  if (import.meta.client) {
    const id = route.query[param];
    if (typeof id === 'string' && id) {
      // nextTick — чтобы overlay успел смонтироваться и вызов не зависел от
      // места в setup (до/после top-level await).
      nextTick(async () => {
        const result = await modal.open().result;
        if (result) await onClosed?.();
      });
    }
  }
}
