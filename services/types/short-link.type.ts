export interface IShortLink {
  id: string;
  /** Хвост: infomania.ru/go/<slug> */
  slug: string;
  url: string;
  title?: string | null;
  clicks: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShortLinkQuery {
  isDeleted?: boolean;
  limit?: number;
  page?: number;
  search?: string;
}
