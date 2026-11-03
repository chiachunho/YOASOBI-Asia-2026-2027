import { useEffect, useRef, type ReactNode } from "react";

/** 底部抽屜。開啟時焦點移進去，Esc 或點背景關閉，關閉後焦點回到原本的按鈕。 */
export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const returnTo = useRef<Element | null>(null);
  // onClose 通常是每次 render 都新建的箭頭函式；放進 ref，effect 才不會每次 render 重跑而搶走焦點
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement;
    panel.current?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      (returnTo.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);
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
