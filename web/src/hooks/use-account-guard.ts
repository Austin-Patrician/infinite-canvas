import { useCallback } from "react";
import { App } from "antd";
import { useTranslation } from "react-i18next";

import { useAccountStore } from "@/stores/use-account-store";
import { useConfigStore } from "@/stores/use-config-store";

/**
 * 开始创作前的账号检查：没有密钥或余额不足时提示，并把配置弹窗停在帐号中心。
 * 返回 true 表示可以继续，调用方直接 return 即可。
 */
export function useAccountGuard() {
    const { message } = App.useApp();
    const { t } = useTranslation();
    const ensureUsable = useAccountStore((state) => state.ensureUsable);
    const openConfigDialog = useConfigStore((state) => state.openConfigDialog);

    return useCallback(async () => {
        const usability = await ensureUsable();
        if (usability === "ready") return true;
        message.warning(t(usability === "missing-key" ? "config.account.needKey" : "config.account.needQuota"));
        openConfigDialog(false, "account");
        return false;
    }, [ensureUsable, message, openConfigDialog, t]);
}
