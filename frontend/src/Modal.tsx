import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  titleId: string // 中の見出しの id(読み上げ用に、ポップアップの名前として使う)
  closeLabel: string
  onClose: () => void
  children: ReactNode
}

// 標準の <dialog> を、showModal() で開く。背景を暗くする、Esc で閉じる、フォーカスを中に閉じ込める、は標準の機能
export function Modal({ titleId, closeLabel, onClose, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      // 暗い背景(::backdrop)を押したときも閉じる
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="m-auto max-h-none max-w-none overflow-visible bg-transparent p-0 backdrop:bg-navy-950/70"
    >
      <div className="relative rounded-2xl bg-white p-6 text-navy-900 shadow-2xl">
        {/* 閉じるボタンは、パネルの右上の角に重ねる */}
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="absolute -top-4 -right-4 flex size-12 cursor-pointer items-center justify-center rounded-full border border-mist-300 bg-white text-2xl leading-none text-navy-800 shadow-md hover:bg-mist-100 active:bg-mist-200"
        >
          ✕
        </button>
        {children}
      </div>
    </dialog>
  )
}
