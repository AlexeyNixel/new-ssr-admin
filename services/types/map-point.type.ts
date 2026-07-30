export interface IMapPoint {
  id: string;
  title: string;
  description?: string;
  image?: string;
  content?: string;
  lat: number;
  lng: number;
  preset?: string;
  isDeleted: boolean;
}

export interface MapPointQuery {
  isDeleted?: boolean;
  limit?: number;
  page?: number;
}
