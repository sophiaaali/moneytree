interface ImportMetaEnv {
  VITE_APP_NODE_ENV: string;
  VITE_CLERK_PUBLISHABLE_KEY: string;
  VITE_MAPBOX_TOKEN: string;
}

interface ImportMeta {
  env: ImportMetaEnv;
}
