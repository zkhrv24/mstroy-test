import type { Item, ItemId } from "./types";

export class TreeStore {
  private items: Item[];
  private itemsMap: Map<ItemId, Item>;
  private parentMap: Map<ItemId, ItemId | null>;
  private childrenMap: Map<ItemId, ItemId[]>;

  private addToChildrenMap(item: Item): void {
    if (item.parent !== null) {
      if (!this.childrenMap.has(item.parent)) {
        this.childrenMap.set(item.parent, []);
      }
      const children = this.childrenMap.get(item.parent);
      if (children) {
        children.push(item.id);
      }
    }
  }

  private initMaps(): void {
    this.itemsMap.clear();
    this.parentMap.clear();
    this.childrenMap.clear();

    this.items.forEach((item) => {
      this.itemsMap.set(item.id, item);

      this.parentMap.set(item.id, item.parent);

      this.addToChildrenMap(item);
    });
  }

  constructor(items: Item[]) {
    this.items = [...items];
    this.itemsMap = new Map();
    this.parentMap = new Map();
    this.childrenMap = new Map();

    this.initMaps();
  }

  getAll(): Item[] {
    return [...this.items];
  }

  getItem(id: ItemId): Item | undefined {
    return this.itemsMap.get(id);
  }

  getChildren(id: ItemId): Item[] {
    const childrenIds = this.childrenMap.get(id) || [];
    const result: Item[] = [];

    for (const childId of childrenIds) {
      const item = this.itemsMap.get(childId);
      if (item !== undefined) {
        result.push(item);
      }
    }

    return result;
  }

  getAllChildren(id: ItemId): Item[] {
    if (!this.itemsMap.has(id)) return [];

    const result: Item[] = [];
    const queue: ItemId[] = [id];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (currentId === undefined) {
        continue;
      }
      const childrenIds = this.childrenMap.get(currentId) || [];
      for (const childId of childrenIds) {
        const child = this.itemsMap.get(childId);

        if (child) {
          result.push(child);
          queue.push(childId);
        }
      }
    }
    return result;
  }

  getAllParents(id: ItemId): Item[] {
    const result: Item[] = [];
    let currentId: ItemId | null = id;

    while (currentId !== null) {
      const item = this.itemsMap.get(currentId);
      if (!item) break;

      result.push(item);
      currentId = this.parentMap.get(currentId) || null;
    }

    return result;
  }

  addItem(item: Item): void {
    if (this.itemsMap.has(item.id)) {
      console.error(`Объект с id: ${item.id} уже существует!`);
      return;
    }
    this.items.push(item);
    this.itemsMap.set(item.id, item);
    this.parentMap.set(item.id, item.parent);
    this.addToChildrenMap(item);
  }

  removeItem(id: ItemId): void {
    const item = this.itemsMap.get(id);
    if (!item) return;

    const allChildren = this.getAllChildren(id);
    const childrenIdsSet = new Set<ItemId>(
      allChildren.map((child) => child.id),
    );

    this.items = this.items.filter(
      (item) => item.id !== id && !childrenIdsSet.has(item.id),
    );

    this.initMaps();
  }

  updateItem(updatedItem: Partial<Item> & { id: ItemId }): void {
    const existingItem = this.itemsMap.get(updatedItem.id);

    if (!existingItem) {
      console.error(`Элемент с id: ${updatedItem.id} не найден`);
      return;
    }

    const oldParent = existingItem.parent;

    const newItem = { ...existingItem, ...updatedItem };

    const index = this.items.findIndex((item) => item.id === updatedItem.id);
    if (index !== -1) {
      this.items[index] = newItem;
    }

    this.itemsMap.set(updatedItem.id, newItem);
    this.parentMap.set(updatedItem.id, newItem.parent);

    if (oldParent !== newItem.parent) {
      if (oldParent !== null) {
        const oldParentChildren = this.childrenMap.get(oldParent);

        if (oldParentChildren) {
          const filteredChildren = oldParentChildren.filter(
            (childId) => childId !== updatedItem.id,
          );

          if (filteredChildren.length > 0) {
            this.childrenMap.set(oldParent, filteredChildren);
          } else {
            this.childrenMap.delete(oldParent);
          }
        }
      }

      if (newItem.parent !== null) {
        let newParentChildren = this.childrenMap.get(newItem.parent);

        if (!newParentChildren) {
          newParentChildren = [];
          this.childrenMap.set(newItem.parent, newParentChildren);
        }

        newParentChildren.push(updatedItem.id);
      }
    }
  }
}
