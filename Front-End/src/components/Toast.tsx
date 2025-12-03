import React from 'react'

type Props = {
  message: string
  type?: 'error' | 'info'
  onClose?: () => void
}

export default function Toast({ message, type = 'info', onClose }: Props) {
  return (
    <div className={`fixed right-4 bottom-6 z-50 max-w-xs w-full ${type === 'error' ? 'bg-gray-800 text-white dark:bg-gray-600' : 'bg-gray-700 text-white dark:bg-gray-500'} rounded-md shadow-lg px-4 py-3`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm">{message}</div>
        <button onClick={onClose} className="text-sm opacity-80">Dismiss</button>
      </div>
    </div>
  )
}
