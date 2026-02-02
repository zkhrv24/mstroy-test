export type ItemId = number | string

export interface Item {
  id: ItemId;
  parent: ItemId | null;
  label: string;
}
