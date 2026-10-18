import { create } from "zustand";

import { fetchNewApiKeyUsage, type NewApiKeyUsage } from "@/services/api/new-api";
import { fetchChannelModels } from "@/services/api/image";
import { OFFICIAL_CHANNEL_ID, useConfigStore } from "@/stores/use-config-store";

/** 开始创作前的账号可用性：ready 可以继续，另外两种都要引导去帐号中心。 */
export type AccountUsability = "ready" | "missing-key" | "insufficient-quota";

/** 账号相关的状态都基于本地密钥：余额、可用模型、以及密钥本身。 */
type AccountStore = {
    usage: NewApiKeyUsage | null;
    refreshUsage: () => Promise<void>;
    ensureUsable: () => Promise<AccountUsability>;
    clearApiKey: () => void;
    /** 保存密钥并用它拉一次模型，拉不到就抛错，让调用方提示用户。 */
    applyApiKey: (apiKey: string) => Promise<number>;
    refreshOfficialModels: () => Promise<number>;
};

function officialChannel() {
    return useConfigStore.getState().config.channels.find((item) => item.id === OFFICIAL_CHANNEL_ID);
}

export const useAccountStore = create<AccountStore>()((set, get) => ({
    usage: null,

    /** 用密钥本身查余额和用量，不需要登录态。 */
    refreshUsage: async () => {
        const apiKey = officialChannel()?.apiKey || "";
        if (!apiKey) {
            set({ usage: null });
            return;
        }
        try {
            set({ usage: await fetchNewApiKeyUsage(apiKey) });
        } catch {
            set({ usage: null });
        }
    },

    /** 没有密钥、或余额已经用完时返回原因；余额查不到时不拦截，交给服务端报错。 */
    ensureUsable: async () => {
        if (!officialChannel()?.apiKey) return "missing-key";
        await get().refreshUsage();
        const usage = get().usage;
        if (!usage) return "ready";
        const available = usage.unlimitedQuota ? usage.userAvailable : usage.totalAvailable;
        return available === undefined || available > 0 ? "ready" : "insufficient-quota";
    },

    /** 清除本地保存的密钥：模型列表保留，下次保存新密钥时会重新同步。 */
    clearApiKey: () => {
        useConfigStore.getState().applyOfficialChannel({ apiKey: "" });
        void get().refreshUsage();
    },

    applyApiKey: async (apiKey) => {
        const key = apiKey.trim();
        if (!key) throw new Error("missing key");
        useConfigStore.getState().applyOfficialChannel({ apiKey: key });
        const count = await get().refreshOfficialModels();
        await get().refreshUsage();
        return count;
    },

    refreshOfficialModels: async () => {
        const channel = officialChannel();
        if (!channel?.apiKey) throw new Error("missing key");
        const models = await fetchChannelModels(channel);
        useConfigStore.getState().applyOfficialChannel({ models });
        return models.length;
    },
}));
