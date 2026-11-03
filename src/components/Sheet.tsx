import { useEffect, useRef, type ReactNode } from "react";

/** 底部抽屜。開啟時焦點移進去，Esc 或點背景關閉，關閉後焦點回到原本的按鈕。 */
export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const returnTo = useRef<Element | null>(null);
  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement;
    panel.current?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      (returnTo.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-wrap">
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={panel}>
        <div className="sheet-head">
          <b>{title}</b>
          <button type="button" className="close" onClick={onClose} aria-label="關閉">
            ✕
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
