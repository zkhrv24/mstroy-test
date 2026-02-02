export type ItemId = number | string

export interface Item {
  id: ItemId;
  parent: ItemId | null;
  label: string;
}

export interface GridItem {
  id: ItemId;
  parentId: ItemId | null;
  label: string;
  category: 'Группа' | 'Элемент';
  index: number;
  hasChildren?: boolean;
}
