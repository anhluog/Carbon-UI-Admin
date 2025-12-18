/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_CARBONCREDIT_ADDRESS: string;
    readonly VITE_OTHER_CONTRACT_ADDRESS?: string;
    readonly VITE_MARKETPLACE_ADDRESS: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  