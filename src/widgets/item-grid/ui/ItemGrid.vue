<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { AgGridVue } from "ag-grid-vue3";
import type { AutoGroupColumnDef, CellClassParams, ColDef } from "ag-grid-community";
import type { Item, GridItem, ItemId } from "../model/types";
import { TreeStore } from "../model/TreeStore";

interface Props {
  items: Item[];
}

const props = defineProps<Props>();

const gridData = ref<GridItem[]>([]);

const prepareGridData = (items: Item[]): GridItem[] => {
  const treeStore = new TreeStore(items);
  const result: GridItem[] = [];
  let currentIndex = 1;

  const traverse = (id: ItemId): void => {
    const item = treeStore.getItem(id);
    if (!item) return;

    const children = treeStore.getChildren(id);
    const hasChildren = children.length > 0;

    result.push({
      id: item.id,
      parentId: item.parent,
      label: item.label,
      category: hasChildren ? "Группа" : "Элемент",
      index: currentIndex++,
      hasChildren,
    });

    children.forEach((child) => traverse(child.id));
  };

  const rootItems = items.filter((item) => item.parent === null);
  rootItems.forEach((root) => traverse(root.id));

  return result;
};

const autoGroupColumnDef = computed<AutoGroupColumnDef>(() => ({
  headerName: "Категория",
  field: "category",
  suppressHeaderMenuButton: true,
  cellRendererParams: {
    suppressCount: true,
  },
  width: 400,
  cellRenderer: "agGroupCellRenderer",
  cellClassRules: {
    "category-group": (params: CellClassParams<GridItem>) =>
      params.data?.category === "Группа",
    "category-item": (params: CellClassParams<GridItem>) =>
      params.data?.category === "Элемент",
  },
}));

const columnDefs = computed<ColDef<GridItem>[]>(() => [
  {
    headerName: "№ п\\п",
    field: "index",
    width: 75,
    type: "numericColumn",
    cellStyle: { "text-align": "left", "font-weight": "bold" },
    pinned: "left",
    suppressHeaderMenuButton: true,
  },
  {
    headerName: "Наименование",
    field: "label",
    flex: 1,
    cellStyle: { "text-align": "left", "font-weight": "normal" },
    cellClassRules: {
      "category-group": (params: CellClassParams<GridItem>) =>
        params.data?.category === "Группа",
      "category-item": (params: CellClassParams<GridItem>) =>
        params.data?.category === "Элемент",
    },
    suppressHeaderMenuButton: true,
  },
]);

const getDataPath = (data: GridItem): string[] => {
  const treeStore = new TreeStore(props.items);
  const parents = treeStore.getAllParents(data.id);

  return parents.map((parent) => parent.id.toString()).reverse();
};

onMounted(() => {
  gridData.value = prepareGridData(props.items);
});
</script>

<template>
  <div class="tree-grid-container">
    <AgGridVue
      :columnDefs="columnDefs"
      :rowData="gridData"
      :treeData="true"
      :getDataPath="getDataPath"
      :autoGroupColumnDef="autoGroupColumnDef"
      :groupDefaultExpanded="1"
      class="ag-theme-alpine"
      style="width: 100%; height: 600px"
    />
  </div>
</template>

<style scoped>
.tree-grid-container {
  width: 100%;
  height: 100%;
}

.ag-theme-alpine {
  --ag-header-background-color: #f8f9fa;
  --ag-header-foreground-color: #333;
  --ag-row-hover-color: #f5f5f5;
  --ag-header-column-resize-handle-height: 100%;
  --ag-header-column-resize-handle-width: 1px;
  --ag-border-color: rgb(195, 195, 195);
  --ag-wrapper-border: none;
  --ag-row-group-indent-size: 8px;
}

/* Стили для категории в столбце группы */
:deep(.category-group) {
  font-weight: 500 !important;
}

:deep(.ag-header-cell-label) {
  flex-direction: row;
}

:deep(.ag-pinned-left-header) {
  border-right: none;
}

:deep(.ag-cell-last-left-pinned) {
  border-right: none !important;
}

:deep(.ag-body-viewport) {
  border: none !important;
}

.text-center {
  text-align: center;
}
</style>
