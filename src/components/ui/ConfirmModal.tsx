import React from "react";
import dayjs from "dayjs";

import { Button } from "./Button";
import { cn } from "../../lib/utils";

type ConfirmModalProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  isDanger?: boolean;
  featureKey: string;
};

export function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = "确认",
  isDanger = false,
  featureKey,
}: ConfirmModalProps) {
  const [dontRemindToday, setDontRemindToday] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setDontRemindToday(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    if (dontRemindToday && typeof window !== "undefined") {
      const payload = {
        date: dayjs().format("YYYY-MM-DD"),
        suppressed: true,
      };
      localStorage.setItem(
        `suppress_confirm_${featureKey}`,
        JSON.stringify(payload)
      );
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        role="presentation"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-glass-border bg-slate-900/90 p-6 text-white backdrop-blur-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-2 text-sm text-slate-300">{message}</div>
        <label className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border border-white/20 bg-transparent"
            checked={dontRemindToday}
            onChange={(event) => setDontRemindToday(event.target.checked)}
          />
          今日不再提醒
        </label>
        <div className="mt-6 flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            className={cn(
              "border",
              isDanger
                ? "border-red-500/40 bg-red-500/20 text-red-100 hover:bg-red-500/30"
                : "border-glass-border"
            )}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
