import type { IQuery } from './query.type';

/** Виртуальная выставка — HTML-пакет iSpring (File с type=EXHIBITION) */
export interface Exhibition {
  id: string;
  originalName: string;
  /** `/dev/exhibitions/<slug>/index.html` или `/site/exhibition/<uuid>/<slug>/index.html` */
  path: string;
  title: string | null;
  isHidden: boolean;
  size: number;
  createdAt: string;
}

export interface ExhibitionQuery extends IQuery {
  status?: 'visible' | 'hidden';
}
