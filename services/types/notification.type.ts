export interface Notification {
  id: string;
  title: string;
  description: string;
  postId: string;
  startTime: string;
  endTime: string;
  isDeleted: boolean;
  type: 'error' | 'warning' | 'success';
}
