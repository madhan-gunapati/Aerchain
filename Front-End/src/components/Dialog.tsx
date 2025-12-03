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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 text-black">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-sm sm:max-w-md md:max-w-lg w-full z-10 max-h-[90vh] overflow-y-auto">
        {title && <h3 className="text-lg md:text-xl font-semibold mb-4">{title}</h3>}
        <div className="mb-6">{children}</div>
        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
          <button 
            className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 transition-colors text-sm md:text-base" 
            onClick={onClose}
          >
            Close
          </button>
          {action && (
            <button
              onClick={action.onClick}
              className={`px-4 py-2 rounded-md transition-colors text-sm md:text-base ${action.variant === 'primary' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
