import { useEffect, useState } from "react";
import { Alert, App, Button, Input } from "antd";
import { ExternalLink, KeyRound, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCopyText } from "@/hooks/use-copy-text";
import { formatNewApiQuota, NEW_API_BASE_URL, NEW_API_KEYS_URL } from "@/services/api/new-api";
import { useAccountStore } from "@/stores/use-account-store";
import { OFFICIAL_CHANNEL_ID, useConfigStore } from "@/stores/use-config-store";

function readErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message ? error.message : fallback;
}

/** 账号体系全部在 new-api 官网，这里只做指引、密钥填写和用量展示。 */
export function AccountCenter() {
    const { message, modal } = App.useApp();
    const { t } = useTranslation();
    const copyText = useCopyText();
    const [draftKey, setDraftKey] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const usage = useAccountStore((state) => state.usage);
    const applyApiKey = useAccountStore((state) => state.applyApiKey);
    const clearApiKey = useAccountStore((state) => state.clearApiKey);
    const refreshOfficialModels = useAccountStore((state) => state.refreshOfficialModels);
    const refreshUsage = useAccountStore((state) => state.refreshUsage);
    const channel = useConfigStore((state) => state.config.channels.find((item) => item.id === OFFICIAL_CHANNEL_ID));
    const apiKey = channel?.apiKey || "";
    const modelCount = channel?.models.length || 0;

    // 无限额度密钥的额度记在账号上，固定额度密钥的额度记在密钥自己身上，两者的「余额/已用」来源不同。
    const unlimited = usage?.unlimitedQuota === true;
    const accountAvailable = usage?.userAvailable;
    const balanceQuota = unlimited ? accountAvailable : usage?.totalAvailable;
    const usedQuota = unlimited ? usage?.userUsed ?? usage?.totalUsed : usage?.totalUsed;
    const quotaHint = !usage
        ? ""
        : unlimited
          ? accountAvailable === undefined
              ? t("config.account.balanceUnavailableHint")
              : t("config.account.quotaFromAccount")
          : t("config.account.quotaFromKey", { total: formatNewApiQuota(usage.totalAvailable + usage.totalUsed) });

    useEffect(() => {
        void refreshUsage();
    }, [refreshUsage]);

    useEffect(() => {
        setDraftKey(apiKey);
    }, [apiKey]);

    const run = async (action: () => Promise<number>, success: (count: number) => string) => {
        setError("");
        setBusy(true);
        try {
            message.success(success(await action()));
        } catch (actionError) {
            setError(readErrorMessage(actionError, t("apiErrors.requestFailed")));
        } finally {
            setBusy(false);
        }
    };

    const confirmClearKey = () => {
        modal.confirm({
            title: t("config.account.clearKeyTitle"),
            content: t("config.account.clearKeyDescription"),
            okText: t("common.delete"),
            okButtonProps: { danger: true },
            cancelText: t("common.cancel"),
            onOk: clearApiKey,
        });
    };

    const quotaCell = (label: string, quota: number | undefined) => (
        <div>
            <div className="text-xs text-stone-500">{label}</div>
            <div className="mt-1 font-medium">{quota === undefined ? t("config.account.balanceUnavailable") : formatNewApiQuota(quota)}</div>
        </div>
    );

    return (
        <div className="space-y-4">
            <section className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
                <div className="text-sm font-semibold">{t("config.account.guideTitle")}</div>
                <ol className="mt-2 list-decimal space-y-2.5 pl-5 text-sm text-stone-600 dark:text-stone-300">
                    <li>
                        {t("config.account.stepAccount")}{" "}
                        <Button size="small" href={NEW_API_BASE_URL} target="_blank" rel="noopener noreferrer" icon={<ExternalLink className="size-3.5" />}>
                            {t("config.account.openSite")}
                        </Button>
                    </li>
                    <li>
                        {t("config.account.stepCreateKey")}{" "}
                        <Button size="small" href={NEW_API_KEYS_URL} target="_blank" rel="noopener noreferrer" icon={<ExternalLink className="size-3.5" />}>
                            {t("config.account.openKeys")}
                        </Button>
                    </li>
                    <li>{t("config.account.stepPaste")}</li>
                </ol>
            </section>

            {error ? <Alert type="error" showIcon message={error} /> : null}

            <section className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <KeyRound className="size-4" />
                    {t("config.account.apiKey")}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Input.Password className="max-w-[420px]" value={draftKey} onChange={(event) => setDraftKey(event.target.value)} placeholder="sk-..." />
                    <Button type="primary" loading={busy} disabled={!draftKey.trim() || draftKey.trim() === apiKey} onClick={() => void run(() => applyApiKey(draftKey), (count) => t("config.account.keySaved", { count }))}>
                        {t("config.account.saveKey")}
                    </Button>
                    {apiKey ? (
                        <>
                            <Button type="text" onClick={() => copyText(apiKey, t("config.account.keyCopied"))}>
                                {t("common.copy")}
                            </Button>
                            <Button size="small" danger onClick={confirmClearKey}>
                                {t("config.account.clearKey")}
                            </Button>
                        </>
                    ) : null}
                </div>
                <div className="mt-2 text-xs text-stone-500">{t("config.account.keyDescription")}</div>

                {apiKey ? (
                    <>
                        {usage ? (
                            <div className="mt-4 grid gap-3 border-t border-stone-200 pt-3 text-sm dark:border-stone-800 md:grid-cols-3">
                                {quotaCell(t("config.account.balance"), balanceQuota)}
                                {quotaCell(t("config.account.used"), usedQuota)}
                                <div>
                                    <div className="text-xs text-stone-500">{t("config.account.models")}</div>
                                    <div className="mt-1 font-medium">{t("config.account.modelCount", { count: modelCount })}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 border-t border-stone-200 pt-3 text-xs text-stone-500 dark:border-stone-800">{t("config.account.usageFailed")}</div>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button size="small" icon={<RefreshCw className="size-3.5" />} loading={busy} onClick={() => void run(refreshOfficialModels, (count) => t("config.account.synced", { count }))}>
                                {t("config.account.syncModels")}
                            </Button>
                            {quotaHint ? <span className="text-xs text-stone-500">{quotaHint}</span> : null}
                        </div>
                    </>
                ) : null}
            </section>
        </div>
    );
}
