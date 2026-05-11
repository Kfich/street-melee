/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Socket.io server URL used by the browser client for multiplayer.
   *  Set this in your hosting platform's environment variable settings.
   *  Defaults to http://localhost:3001 for local development.
   */
  readonly VITE_SERVER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
