import { Node, mergeAttributes } from '@tiptap/core';
import type { NodeSelection } from '@tiptap/pm/state';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import IframeNodeComponent from './EditorIframeNode.vue';

export interface IframeOptions {
  allowFullscreen: boolean;
  HTMLAttributes: Record<string, unknown>;
}

export interface IframeAttrs {
  src: string;
  width?: string | null;
  height?: string | null;
  title?: string | null;
  allow?: string | null;
}

export const IFRAME_DEFAULT_WIDTH = '100%';
export const IFRAME_DEFAULT_HEIGHT = '450';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    iframe: {
      /** Вставить iframe (или заменить выделенный) */
      setIframe: (attrs: IframeAttrs) => ReturnType;
      /** Обновить атрибуты выделенного iframe */
      updateIframe: (attrs: Partial<IframeAttrs>) => ReturnType;
    };
  }
}

/** Разрешаем только http(s) — защита от javascript:/data: в src. */
export const sanitizeIframeSrc = (src?: string | null): string | null => {
  if (!src) return null;
  const value = src.trim().replace(/^\/\//, 'https://');
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
};

/** Приводит обычные ссылки на видео (YouTube, Rutube, VK) к embed-адресу. */
export const toEmbedUrl = (src: string): string => {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }
  const host = url.hostname.replace(/^www\.|^m\./, '');

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1);
    if (id) return `https://www.youtube.com/embed/${id}`;
  }
  if (host === 'youtube.com') {
    const id = url.searchParams.get('v');
    if (url.pathname === '/watch' && id) return `https://www.youtube.com/embed/${id}`;
    const shorts = url.pathname.match(/^\/(?:shorts|live)\/([\w-]+)/);
    if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`;
  }
  if (host === 'rutube.ru') {
    const video = url.pathname.match(/^\/video\/([\w]+)/);
    if (video) return `https://rutube.ru/play/embed/${video[1]}`;
  }
  if (host === 'vk.com' || host === 'vkvideo.ru') {
    const video = url.pathname.match(/^\/video(-?\d+)_(\d+)/);
    if (video) return `https://vk.com/video_ext.php?oid=${video[1]}&id=${video[2]}`;
  }

  return src;
};

/**
 * Разбирает ввод пользователя: HTML-код iframe (как дают кнопки «Поделиться»
 * → «Встроить») или просто ссылку. Возвращает null, если src невалидный.
 */
export const parseIframeInput = (input: string): IframeAttrs | null => {
  const value = input.trim();
  if (!value) return null;

  if (value.startsWith('<')) {
    const doc = new DOMParser().parseFromString(value, 'text/html');
    const el = doc.querySelector('iframe');
    const src = sanitizeIframeSrc(el?.getAttribute('src'));
    if (!el || !src) return null;
    return {
      src,
      width: el.getAttribute('width') || null,
      height: el.getAttribute('height') || null,
      title: el.getAttribute('title') || null,
      allow: el.getAttribute('allow') || null,
    };
  }

  const src = sanitizeIframeSrc(value);
  return src ? { src: toEmbedUrl(src) } : null;
};

const emptyToNull = (value: string | null) => (value === '' ? null : value);

export default Node.create<IframeOptions>({
  name: 'iframe',

  group: 'block',

  atom: true,

  draggable: true,

  selectable: true,

  addOptions() {
    return {
      allowFullscreen: true,
      HTMLAttributes: {
        class: 'iframe-wrapper',
      },
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (el) => sanitizeIframeSrc(el.getAttribute('src')),
      },
      width: {
        default: IFRAME_DEFAULT_WIDTH,
        parseHTML: (el) => emptyToNull(el.getAttribute('width')) ?? IFRAME_DEFAULT_WIDTH,
      },
      height: {
        default: IFRAME_DEFAULT_HEIGHT,
        parseHTML: (el) => emptyToNull(el.getAttribute('height')) ?? IFRAME_DEFAULT_HEIGHT,
      },
      title: {
        default: null,
        parseHTML: (el) => emptyToNull(el.getAttribute('title')),
      },
      allow: {
        default: null,
        parseHTML: (el) => emptyToNull(el.getAttribute('allow')),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe[src]',
        getAttrs: (el) => (sanitizeIframeSrc(el.getAttribute('src')) ? null : false),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // null-атрибуты (title, allow) ProseMirror не выводит
    const iframeAttrs = mergeAttributes(HTMLAttributes, {
      frameborder: '0',
      ...(this.options.allowFullscreen ? { allowfullscreen: 'true' } : {}),
    });
    return ['div', this.options.HTMLAttributes, ['iframe', iframeAttrs]];
  },

  addNodeView() {
    return VueNodeViewRenderer(IframeNodeComponent);
  },

  addCommands() {
    return {
      setIframe:
        (attrs) =>
        ({ commands, state }) => {
          const src = sanitizeIframeSrc(attrs.src);
          if (!src) return false;

          const clean = Object.fromEntries(
            Object.entries({ ...attrs, src }).filter(([, v]) => v != null && v !== '')
          );

          if ((state.selection as NodeSelection).node?.type.name === this.name) {
            return commands.updateAttributes(this.name, clean);
          }

          return commands.insertContent({ type: this.name, attrs: clean });
        },
      updateIframe:
        (attrs) =>
        ({ commands }) => {
          if (attrs.src !== undefined) {
            const src = sanitizeIframeSrc(attrs.src);
            if (!src) return false;
            attrs = { ...attrs, src };
          }
          return commands.updateAttributes(this.name, attrs);
        },
    };
  },
});
