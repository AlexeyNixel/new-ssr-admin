export type LinkCheckStatus = 'RUNNING' | 'DONE' | 'FAILED';

export interface LinkSource {
  /** Sitemap — страница сайта; иначе тип записи (Post, Page, Event…) */
  type: string;
  id?: string;
  title: string;
}

export interface BrokenLink {
  url: string;
  status: number | null;
  error?: string;
  severity: 'broken' | 'warning';
  sources: LinkSource[];
}

export interface LinkCheckReport {
  id: string;
  status: LinkCheckStatus;
  startedAt: string;
  finishedAt: string | null;
  total: number;
  checked: number;
  brokenCount: number;
  results?: BrokenLink[] | null;
  error: string | null;
}
