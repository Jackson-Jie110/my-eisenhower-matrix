import React from "react";

import type { QuadrantId } from "../types";

type ShortcutOptions = {
  inputRef?: React.RefObject<HTMLInputElement>;
  onEscape?: () => void;
  onDelete?: () => void;
  onFocusBacklog?: () => void;
  onSelectTask?: (index: number) => void;
  onMoveTask?: (quadrantId: QuadrantId) => void;
};

const isEditableTarget = (target: EventTarget | null) => {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    target.isContentEditable
  );
};

export const useKeyboardShortcuts = ({
  inputRef,
  onEscape,
  onDelete,
  onFocusBacklog,
  onSelectTask,
  onMoveTask,
}: ShortcutOptions) => {
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      if (event.altKey && event.key === "1") {
        event.preventDefault();
        onFocusBacklog?.();
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key === "Enter") {
        if (!isEditableTarget(event.target)) {
          inputRef?.current?.focus();
        }
        return;
      }

      if (event.key === "Escape") {
        onEscape?.();
        if (typeof document !== "undefined") {
          const active = document.activeElement;
          if (isEditableTarget(active)) {
            (active as HTMLElement).blur();
          }
        } else {
          inputRef?.current?.blur();
        }
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        onDelete?.();
        return;
      }

      if (event.key >= "1" && event.key <= "9") {
        onSelectTask?.(Number(event.key));
        return;
      }

      const quadrantMap: Record<string, QuadrantId> = {
        q: "q1",
        w: "q2",
        e: "q3",
        r: "q4",
      };
      const targetQuadrant = quadrantMap[event.key.toLowerCase()];
      if (targetQuadrant) {
        onMoveTask?.(targetQuadrant);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    inputRef,
    onDelete,
    onEscape,
    onFocusBacklog,
    onMoveTask,
    onSelectTask,
  ]);
};
