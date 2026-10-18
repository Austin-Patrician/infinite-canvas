export const APP_VERSION = __APP_VERSION__ || "dev";

export const DOCS_URL = import.meta.env.VITE_DOC_URL || "https://docs.canvas.best";

// 官方渠道固定指向我们自己的 new-api，自部署时用环境变量覆盖。
export const NEW_API_URL = (import.meta.env.VITE_NEW_API_URL || "https://newapi.20250230.xyz").replace(/\/+$/, "");

// 金额换算口径与 new-api 的 CNY 显示一致：quota / quota_per_unit * usd_exchange_rate。
// 两个值都要与实例的 /api/status 里 quota_per_unit、usd_exchange_rate 保持一致。
export const NEW_API_QUOTA_PER_UNIT = Number(import.meta.env.VITE_NEW_API_QUOTA_PER_UNIT) || 500000;
export const NEW_API_USD_EXCHANGE_RATE = Number(import.meta.env.VITE_NEW_API_USD_EXCHANGE_RATE) || 1;
export const NEW_API_CURRENCY_SYMBOL = import.meta.env.VITE_NEW_API_CURRENCY_SYMBOL || "¥";

// Official plugin registry URL: CI publishes to plugins-dist for jsDelivr delivery; an environment variable may override it for self-hosting.
export const PLUGIN_REGISTRY_URL = import.meta.env.VITE_PLUGIN_REGISTRY_URL || "https://cdn.jsdelivr.net/gh/basketikun/infinite-canvas@plugins-dist/official-plugins.json";
