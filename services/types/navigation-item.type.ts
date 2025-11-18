export interface NavigationItem {
  children: NavigationItem[];
  description: string;
  icon: string;
  id: string;
  isExternal: boolean;
  order: number;
  parentId?: string;
  target: string;
  title: string;
}
