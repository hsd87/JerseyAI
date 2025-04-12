import { useEditorStoreBase } from './editor-store';
import { ItemConfig } from './index';

// Direct update methods that don't rely on hooks
export const updateItem = (id: string, changes: Partial<ItemConfig>) => {
  const store = useEditorStoreBase.getState();
  store.updateItem(id, changes);
};

export const dragMoveItem = (id: string, x: number, y: number) => {
  updateItem(id, { x, y });
};

export const transformTextItem = (id: string, fontSize: number, rotation: number) => {
  updateItem(id, { fontSize, rotation });
};

export const transformImageItem = (id: string, scaleX: number, scaleY: number, rotation: number) => {
  updateItem(id, { scaleX, scaleY, rotation });
};