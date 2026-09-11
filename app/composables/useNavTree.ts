import type { NavigationItem } from '~~/services/types/navigation-item.type';
import { useNavigationApi } from '~~/services/api/navigation.api';

export interface NavMoveEvent {
  id: string;
  fromParentId: string;
  toParentId: string;
  oldIndex: number;
  newIndex: number;
}

/** Узел + массив его соседей + индекс в нём. Список — реактивная ссылка. */
export function findNodeAndParentList(
  nodes: NavigationItem[],
  id: string
): { node: NavigationItem; list: NavigationItem[]; index: number } | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i]!.id === id) {
      return { node: nodes[i]!, list: nodes, index: i };
    }
    const child = nodes[i]!.children;
    if (child?.length) {
      const found = findNodeAndParentList(child, id);
      if (found) return found;
    }
  }
  return null;
}

/** Глубина узла-родителя: корень (`''`/undefined) — 0, узлы верхнего уровня — 1. */
export function depthOfParent(
  nodes: NavigationItem[],
  parentId: string,
  depth = 1
): number {
  if (!parentId) return 0;
  for (const node of nodes) {
    if (node.id === parentId) return depth;
    const child = node.children;
    if (child?.length) {
      const found = depthOfParent(child, parentId, depth + 1);
      if (found) return found;
    }
  }
  return 0;
}

/** Высота поддерева: лист — 1. */
export function subtreeHeight(node: NavigationItem): number {
  if (!node.children?.length) return 1;
  return 1 + Math.max(...node.children.map(subtreeHeight));
}

const childrenOf = (nodes: NavigationItem[], parentId: string): NavigationItem[] => {
  if (!parentId) return nodes;
  const parent = findNodeAndParentList(nodes, parentId)?.node;
  if (!parent) return nodes;
  if (!Array.isArray(parent.children)) parent.children = [];
  return parent.children;
};

export function useNavTree() {
  const navigationApi = useNavigationApi();
  const toast = useToast();

  const tree = ref<NavigationItem[]>([]);
  const saving = ref(false);

  const reload = async () => {
    tree.value = await navigationApi.getAllNavigation();
  };

  const persist = async (
    movedId: string,
    toParentId: string,
    parentChanged: boolean,
    destOrders: { id: string; order: number }[],
    sourceOrders: { id: string; order: number }[] | null
  ) => {
    saving.value = true;
    try {
      if (parentChanged) {
        await navigationApi.update(movedId, { parentId: toParentId });
      }
      await navigationApi.updateBatchOrder(destOrders);
      if (sourceOrders) {
        await navigationApi.updateBatchOrder(sourceOrders);
      }
    } catch {
      toast.add({ title: 'Не удалось сохранить порядок', color: 'error' });
      await reload();
    } finally {
      saving.value = false;
    }
  };

  const applyMove = ({
    id,
    fromParentId,
    toParentId,
    newIndex,
  }: NavMoveEvent) => {
    const found = findNodeAndParentList(tree.value, id);
    if (!found) return;

    const { node, list: sourceList } = found;
    const parentChanged = fromParentId !== toParentId;

    sourceList.splice(
      sourceList.findIndex((n) => n.id === id),
      1
    );

    const destList = childrenOf(tree.value, toParentId);
    node.parentId = toParentId;
    destList.splice(newIndex, 0, node);

    destList.forEach((n, i) => (n.order = i + 1));
    if (parentChanged) sourceList.forEach((n, i) => (n.order = i + 1));

    persist(
      id,
      toParentId,
      parentChanged,
      destList.map((n, i) => ({ id: n.id, order: i + 1 })),
      parentChanged
        ? sourceList.map((n, i) => ({ id: n.id, order: i + 1 }))
        : null
    );
  };

  return { tree, saving, reload, applyMove };
}
