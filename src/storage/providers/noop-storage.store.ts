/** In-memory object store for noop storage provider (tests / local dev). */
export const noopStorageObjects = new Map<string, Buffer>();

export function clearNoopStorageObjects(): void {
  noopStorageObjects.clear();
}
