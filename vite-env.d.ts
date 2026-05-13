// vite-env.d.ts
interface ImportMetaEnv {
  VITE_ADMOB_BANNER_ID?: string;
  VITE_ADMOB_REWARD_ID?: string;
  VITE_ADMOB_INTERSTITIAL_ID?: string;
  VITE_REVENUECAT_KEY?: string;
  MODE?: string;
  // Add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
