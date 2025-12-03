type Props = {
  message: string
  type?: 'error' | 'info'
  onClose?: () => void
}

export default function Toast({ message, type = 'info', onClose }: Props) {
  return (
    <div className={`fixed right-4 bottom-6 z-50 max-w-xs sm:max-w-sm w-full ${type === 'error' ? 'bg-red-600' : 'bg-gray-800'} text-white rounded-md shadow-xl px-4 py-3 animate-in fade-in slide-in-from-bottom-4 duration-300`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm flex-1">{message}</div>
        <button 
          onClick={onClose} 
          className="text-sm opacity-70 hover:opacity-100 transition-opacity shrink-0 font-bold"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
