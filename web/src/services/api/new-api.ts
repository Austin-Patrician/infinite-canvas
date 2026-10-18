import i18n from "@/i18n";
import { NEW_API_CURRENCY_SYMBOL, NEW_API_QUOTA_PER_UNIT, NEW_API_URL, NEW_API_USD_EXCHANGE_RATE } from "@/constant/env";

/** 官方渠道固定使用我们的 new-api。 */
export const NEW_API_BASE_URL = NEW_API_URL;
/** 账号、注册与密钥管理都在 new-api 官网完成，canvas 只做指引。 */
export const NEW_API_KEYS_URL = `${NEW_API_BASE_URL}/keys`;

export type NewApiKeyUsage = {
    name: string;
    totalAvailable: number;
    totalUsed: number;
    unlimitedQuota: boolean;
    /** 密钥允许查询时返回的账号额度；未开启时为 undefined。 */
    userAvailable?: number;
    userUsed?: number;
};

type Envelope<T> = { success?: boolean; message?: string; code?: string; data?: T };

async function newApiRequest<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${NEW_API_BASE_URL}${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    const payload = (await response.json().catch(() => null)) as Envelope<T> | null;
    // new-api 业务失败也返回 HTTP 200，只以 success === false 判定。
    if (!payload || payload.success === false) {
        throw new Error(payload?.message || payload?.code || i18n.t("config.account.requestFailed", { status: response.status }));
    }
    if (!response.ok) throw new Error(i18n.t("config.account.requestFailed", { status: response.status }));
    return payload.data as T;
}

/** 用密钥本身查询用量和余额，不需要登录态。 */
export async function fetchNewApiKeyUsage(apiKey: string): Promise<NewApiKeyUsage> {
    const data = await newApiRequest<Record<string, unknown>>("/api/usage/token/", { headers: { Authorization: `Bearer ${apiKey}` } });
    const userQuota = (data.user_quota || {}) as Record<string, unknown>;
    return {
        name: String(data.name || ""),
        totalAvailable: Number(data.total_available) || 0,
        totalUsed: Number(data.total_used) || 0,
        unlimitedQuota: data.unlimited_quota === true,
        userAvailable: userQuota.total_available === undefined ? undefined : Number(userQuota.total_available),
        userUsed: userQuota.total_used === undefined ? undefined : Number(userQuota.total_used),
    };
}

/** 与 new-api 的 CNY 显示口径一致：quota / quota_per_unit * usd_exchange_rate。 */
export function formatNewApiQuota(quota: number) {
    return `${NEW_API_CURRENCY_SYMBOL}${((quota / NEW_API_QUOTA_PER_UNIT) * NEW_API_USD_EXCHANGE_RATE).toFixed(2)}`;
}
