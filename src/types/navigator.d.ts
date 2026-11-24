// Network Information API & Device Memory API (non standardisées dans lib.dom)
export {};

declare global {
  interface NetworkInformation extends EventTarget {
    readonly saveData?: boolean;
    readonly effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  }

  interface Navigator {
    readonly connection?: NetworkInformation;
    readonly deviceMemory?: number;
  }
}
