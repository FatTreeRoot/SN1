"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { t } from "@/config/strings";

/**
 * iOS gives no automatic install prompt, so the first visit from a mobile
 * browser gets a short platform-detected walkthrough for adding the app to
 * the home screen. Dismissible, remembered.
 */
export function InstallWalkthrough() {
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem("sn-install-dismissed")) return;
    } catch {
      return;
    }
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari exposes standalone on navigator
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) setPlatform("ios");
    else if (/Android/.test(ua)) setPlatform("android");
  }, []);

  if (!platform) return null;

  function dismiss() {
    try {
      localStorage.setItem("sn-install-dismissed", "1");
    } catch {}
    setPlatform(null);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-raised p-4 pb-6 shadow-lg">
      <div className="mx-auto flex w-full max-w-md flex-col gap-3">
        <h2 className="text-h3 font-semibold">{t("installTitle")}</h2>
        <p className="text-ink-muted">{t("installBody")}</p>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-ink">
          {platform === "ios" ? (
            <>
              <li>
                Tap the Share button
                <span aria-hidden className="mx-1 inline-block rounded border border-line px-1.5">
                  ↑
                </span>
                in Safari
              </li>
              <li>Scroll down and tap “Add to Home Screen”</li>
              <li>Tap “Add”</li>
            </>
          ) : (
            <>
              <li>Tap the menu (⋮) in your browser</li>
              <li>Tap “Add to Home screen”</li>
              <li>Tap “Add”</li>
            </>
          )}
        </ol>
        <Button variant="quiet" size="large" onClick={dismiss}>
          {t("installDismiss")}
        </Button>
      </div>
    </div>
  );
}
