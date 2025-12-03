import { useState, useEffect } from 'react'
import Dialog from './Dialog'

type Task = {
  id?: string | number
  name: string
  desc?: string
  status?: 'to-do' | 'in-progress' | 'completed'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
}

type Props = {
  open: boolean
  onClose: () => void
  initialTask?: Task | null
  onSave: (task: Task) => Promise<void>
  isLoading?: boolean
  title?: string
  afterSave?: () => void
}

export default function TaskEditDialog({
  open,
  onClose,
  initialTask,
  onSave,
  isLoading = false,
  title = 'Task Details',
  afterSave,
}: Props) {
  const [name, setName] = useState(initialTask?.name || '')
  const [description, setDescription] = useState(initialTask?.desc || '')
  const [status, setStatus] = useState<'to-do' | 'in-progress' | 'completed'>(initialTask?.status || 'to-do')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(initialTask?.priority || 'medium')
  const [dueDate, setDueDate] = useState<string | undefined>(initialTask?.dueDate || undefined)

  // reset when dialog opens or initialTask changes while open
  useEffect(() => {
    if (!open) return
    // schedule state updates asynchronously to avoid synchronous setState in effect
    setTimeout(() => {
      setName(initialTask?.name || '')
      setDescription(initialTask?.desc || '')
      setStatus(initialTask?.status || 'to-do')
      setPriority(initialTask?.priority || 'medium')
      setDueDate(initialTask?.dueDate || undefined)
    }, 0)
  }, [initialTask, open])

  const handleSave = async () => {
    if (!name.trim()) return
    const payload: Task = {
      ...(initialTask?.id && { id: initialTask.id }),
      name: name.trim(),
      desc: description.trim(),
      status,
      priority,
      ...(dueDate ? { dueDate } : {}),
    }
    await onSave(payload)
    if (typeof afterSave === 'function') afterSave()
  }

  if (!open) return null

  return (
    <Dialog
      open={open}
      title={title}
      onClose={onClose}
      action={{
        label: isLoading ? 'Saving...' : 'Save',
        onClick: handleSave,
        variant: 'primary',
      }}
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Task title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task description"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white   dark:text-gray-900 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'to-do' | 'in-progress' | 'completed')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white  dark:text-gray-900 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all"
          >
            <option value="to-do">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white  dark:text-gray-900 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <input
            type="date"
            value={dueDate ?? ''}
            onChange={(e) => setDueDate(e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white  dark:text-gray-900 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all"
          />
        </div>
      </div>
    </Dialog>
  )
}
