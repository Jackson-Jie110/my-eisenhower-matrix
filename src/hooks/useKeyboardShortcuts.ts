import React from "react";

type ShortcutOptions = {
  inputRef?: React.RefObject<HTMLInputElement>;
  onEscape?: () => void;
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
}: ShortcutOptions) => {
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
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
        if (inputRef?.current) {
          inputRef.current.blur();
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [inputRef, onEscape]);
};
