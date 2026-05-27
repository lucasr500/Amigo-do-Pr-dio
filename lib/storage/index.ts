// Ponto de entrada da Storage Abstraction Layer.
// Exporta o adapter ativo e os tipos necessários.
// Para migrar para outro adapter: alterar somente este arquivo.

export type { StorageAdapter, StorageEvent, StorageStatus } from "./types";
export { localStorageAdapter, checkStorageStatus } from "./local-storage-adapter";

// Adapter singleton — usado pelos módulos que quiserem a interface assíncrona.
// Componentes e session.ts continuam usando safeRead/safeWrite sincronamente
// até que a migração incremental ocorra.
import { localStorageAdapter } from "./local-storage-adapter";
export const storage = localStorageAdapter;
