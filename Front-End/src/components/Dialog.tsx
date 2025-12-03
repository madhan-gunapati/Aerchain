import React from 'react'

type Action = {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

type Props = {
  open: boolean
  title?: string
  onClose: () => void
  children?: React.ReactNode
  action?: Action
}

export default function Dialog({ open, title, onClose, children, action }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 dark:text-gray-100 rounded-lg shadow-lg p-6 max-w-xl mx-4 z-10">
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        <div className="mb-4">{children}</div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500" onClick={onClose}>Close</button>
          {action && (
            <button
              onClick={action.onClick}
              className={`px-4 py-2 rounded-md ${action.variant === 'primary' ? 'bg-gray-700 text-white dark:bg-gray-300 dark:text-black' : 'bg-white dark:bg-slate-700'}`}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
