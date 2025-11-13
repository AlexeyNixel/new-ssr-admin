export interface Department {
  id: string;
  title: string;
  slug: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentResponse {
  data: Department[];
  meta: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
  status: number;
}
