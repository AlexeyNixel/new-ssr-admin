export interface IQuery {
  page?: number;
  limit?: number;
  isDeleted?: boolean;
  sortBy?: string;
  sortOrder?: 'desc' | 'asc';
}
