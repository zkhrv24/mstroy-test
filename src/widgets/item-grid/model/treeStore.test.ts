// tests/treeStore.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { TreeStore } from "./TreeStore";
import type { Item } from "./types";

// Тестовые данные
const mockItems: Item[] = [
  { id: "1", parent: null, label: "Root 1" },
  { id: "2", parent: "1", label: "Child 1-1" },
  { id: "3", parent: "1", label: "Child 1-2" },
  { id: "4", parent: "2", label: "Child 2-1" },
  { id: "5", parent: "2", label: "Child 2-2" },
  { id: "6", parent: null, label: "Root 2" },
  { id: "7", parent: "6", label: "Child 6-1" },
];

describe("TreeStore", () => {
  let treeStore: TreeStore;

  beforeEach(() => {
    treeStore = new TreeStore(mockItems);
  });

  describe("constructor", () => {
    it("should initialize with items", () => {
      expect(treeStore.getAll()).toHaveLength(7);
    });

    it("should create maps correctly", () => {
      const item = treeStore.getItem("1");
      expect(item).toBeDefined();
      expect(item?.id).toBe("1");
    });
  });

  describe("getAll", () => {
    it("should return all items", () => {
      const items = treeStore.getAll();
      expect(items).toHaveLength(7);
      expect(items).toContainEqual({ id: "1", parent: null, label: "Root 1" });
    });

    it("should return a copy, not reference", () => {
      const items = treeStore.getAll();
      items.push({ id: "8", parent: null, label: "New Item" });
      expect(treeStore.getAll()).toHaveLength(7);
    });
  });

  describe("getItem", () => {
    it("should return item by id", () => {
      const item = treeStore.getItem("1");
      expect(item).toEqual({ id: "1", parent: null, label: "Root 1" });
    });

    it("should return undefined for non-existent id", () => {
      const item = treeStore.getItem("999");
      expect(item).toBeUndefined();
    });
  });

  describe("getChildren", () => {
    it("should return direct children of an item", () => {
      const children = treeStore.getChildren("1");
      expect(children).toHaveLength(2);
      expect(children).toContainEqual({
        id: "2",
        parent: "1",
        label: "Child 1-1",
      });
      expect(children).toContainEqual({
        id: "3",
        parent: "1",
        label: "Child 1-2",
      });
    });

    it("should return empty array for item with no children", () => {
      const children = treeStore.getChildren("3");
      expect(children).toHaveLength(0);
    });

    it("should return empty array for non-existent parent", () => {
      const children = treeStore.getChildren("999");
      expect(children).toHaveLength(0);
    });
  });

  describe("getAllChildren", () => {
    it("should return all descendants recursively", () => {
      const allChildren = treeStore.getAllChildren("1");
      expect(allChildren).toHaveLength(4);
      expect(allChildren.map((c) => c.id)).toEqual(["2", "3", "4", "5"]);
    });

    it("should return empty array for leaf node", () => {
      const allChildren = treeStore.getAllChildren("5");
      expect(allChildren).toHaveLength(0);
    });

    it("should return empty array for non-existent id", () => {
      const allChildren = treeStore.getAllChildren("999");
      expect(allChildren).toHaveLength(0);
    });

    it("should handle deep nesting correctly", () => {
      const allChildren = treeStore.getAllChildren("2");
      expect(allChildren).toHaveLength(2);
      expect(allChildren.map((c) => c.id)).toEqual(["4", "5"]);
    });
  });

  describe("getAllParents", () => {
    it("should return all ancestors including self", () => {
      const parents = treeStore.getAllParents("4");
      expect(parents).toHaveLength(3);
      expect(parents.map((p) => p.id)).toEqual(["4", "2", "1"]);
    });

    it("should return only self for root item", () => {
      const parents = treeStore.getAllParents("1");
      expect(parents).toHaveLength(1);
      expect(parents[0]?.id).toBe("1");
    });

    it("should return empty array for non-existent id", () => {
      const parents = treeStore.getAllParents("999");
      expect(parents).toHaveLength(0);
    });
  });

  describe("addItem", () => {
    it("should add new item successfully", () => {
      const newItem: Item = { id: "8", parent: "1", label: "New Child" };
      treeStore.addItem(newItem);

      expect(treeStore.getItem("8")).toEqual(newItem);
      expect(treeStore.getChildren("1")).toHaveLength(3);
    });

    it("should not add duplicate item", () => {
      const duplicateItem: Item = { id: "1", parent: null, label: "Duplicate" };
      treeStore.addItem(duplicateItem);

      const items = treeStore.getAll();
      expect(items).toHaveLength(7);
      expect(treeStore.getItem("1")?.label).toBe("Root 1");
    });

    it("should add item with null parent", () => {
      const newItem: Item = { id: "9", parent: null, label: "New Root" };
      treeStore.addItem(newItem);

      expect(treeStore.getItem("9")).toEqual(newItem);
      expect(treeStore.getAll()).toHaveLength(8);
    });
  });

  describe("removeItem", () => {
    it("should remove item and all its descendants", () => {
      treeStore.removeItem("2");

      expect(treeStore.getItem("2")).toBeUndefined();
      expect(treeStore.getItem("4")).toBeUndefined();
      expect(treeStore.getItem("5")).toBeUndefined();
      expect(treeStore.getAll()).toHaveLength(4);
    });

    it("should not remove anything for non-existent id", () => {
      treeStore.removeItem("999");

      expect(treeStore.getAll()).toHaveLength(7);
    });

    it("should remove root item with all descendants", () => {
      treeStore.removeItem("1");

      expect(treeStore.getItem("1")).toBeUndefined();
      expect(treeStore.getItem("2")).toBeUndefined();
      expect(treeStore.getItem("3")).toBeUndefined();
      expect(treeStore.getAll()).toHaveLength(2);
    });

    it("should update children map after removal", () => {
      treeStore.removeItem("2");

      const children = treeStore.getChildren("1");
      expect(children).toHaveLength(1);
      expect(children[0]?.id).toBe("3");
    });
  });

  describe("updateItem", () => {
    it("should update item properties", () => {
      treeStore.updateItem({ id: "1", label: "Updated Root" });

      const item = treeStore.getItem("1");
      expect(item?.label).toBe("Updated Root");
    });

    it("should move item to different parent", () => {
      treeStore.updateItem({ id: "2", parent: "6" });

      const oldParentChildren = treeStore.getChildren("1");
      expect(oldParentChildren).toHaveLength(1);
      expect(oldParentChildren[0]?.id).toBe("3");

      const newParentChildren = treeStore.getChildren("6");
      expect(newParentChildren).toHaveLength(2);
      expect(newParentChildren.map((c) => c.id)).toContain("2");
    });

    it("should handle parent change from null to value", () => {
      treeStore.updateItem({ id: "6", parent: "1" });

      const children = treeStore.getChildren("1");
      expect(children).toHaveLength(3);
      expect(children.map((c) => c.id)).toContain("6");
    });

    it("should handle parent change from value to null", () => {
      treeStore.updateItem({ id: "2", parent: null });

      const oldParentChildren = treeStore.getChildren("1");
      expect(oldParentChildren).toHaveLength(1);

      const newParentChildren = treeStore.getChildren("2");
      expect(newParentChildren).toHaveLength(2);
    });

    it("should not update non-existent item", () => {
      treeStore.updateItem({ id: "999", label: "Non-existent" });

      expect(treeStore.getAll()).toHaveLength(7);
    });

    it("should update multiple properties", () => {
      treeStore.updateItem({ id: "1", label: "Updated", parent: "6" });

      const item = treeStore.getItem("1");
      expect(item?.label).toBe("Updated");
      expect(item?.parent).toBe("6");
    });
  });

  describe("edge cases", () => {
    it("should handle empty initial array", () => {
      const emptyStore = new TreeStore([]);
      expect(emptyStore.getAll()).toHaveLength(0);
      expect(emptyStore.getChildren("1")).toHaveLength(0);
    });

    it("should handle single item", () => {
      const singleStore = new TreeStore([
        { id: "1", parent: null, label: "Single" },
      ]);
      expect(singleStore.getAll()).toHaveLength(1);
      expect(singleStore.getChildren("1")).toHaveLength(0);
    });
  });

  describe("performance", () => {
    it("should handle large dataset efficiently", () => {
      const largeItems: Item[] = [];
      for (let i = 1; i <= 1000; i++) {
        largeItems.push({
          id: i.toString(),
          parent: i > 1 ? Math.floor(i / 2).toString() : null,
          label: `Item ${i}`,
        });
      }

      const startTime = performance.now();
      const largeStore = new TreeStore(largeItems);
      const initTime = performance.now() - startTime;

      expect(initTime).toBeLessThan(100); // Should initialize in under 100ms
      expect(largeStore.getAll()).toHaveLength(1000);
    });
  });
});
