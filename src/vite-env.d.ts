/// <reference types="vite/client" />

// Public build-time values only. Secrets use non-VITE_ names and stay on the server
// (MEMWAL_PRIVATE_KEY, MEMWAL_OWNER_SECRET_KEY, ENOKI_API_KEY, TATUM_API_KEY).
interface ImportMetaEnv {
  readonly VITE_MEMWAL_ENV?: string;
  readonly VITE_MEMWAL_PACKAGE_ID?: string;
  readonly VITE_MEMWAL_REGISTRY_ID?: string;
  readonly VITE_MEMWAL_SUI_GRPC_URL?: string;
  readonly VITE_MEMWAL_ACCOUNT_ID?: string;
  readonly VITE_MEMWAL_SERVER_URL?: string;
  readonly VITE_MEMWAL_NAMESPACE?: string;
  readonly VITE_MEMWAL_OWNER_ADDRESS?: string;
  readonly VITE_MEMWAL_CREATE_TX_DIGEST?: string;
  readonly VITE_MEMWAL_ADD_KEYS_TX_DIGEST?: string;
  readonly VITE_ENOKI_API_KEY?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
