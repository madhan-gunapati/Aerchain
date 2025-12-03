import { useState } from 'react'

type Task = {
  id: string | number
  name: string
  description?: string
  status?: 'todo' | 'in-progress' | 'done'
}

type Props = {
  task: Task
  onUpdated?: (t: Task) => void
  onDeleted?: (id: string | number) => void
}

export default function KanbanCard({ task, onUpdated, onDeleted }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleDelete = async () => {
    try {
      const res = await fetch(`http://localhost:3000/delete-task/${task.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      onDeleted?.(task.id)
    } catch (err) {
      console.error('Delete error', err)
      // optionally show toast
    } finally {
      setMenuOpen(false)
    }
  }

  const handleEdit = async () => {
    const newTitle = window.prompt('Edit title', task.name)
    if (newTitle == null) {
      setMenuOpen(false)
      return
    }

    try {
      const payload = { ...task, name: newTitle }
      const res = await fetch(`http://localhost:3000/update-task/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Update failed')
      const updated = await res.json()
      onUpdated?.(updated)
    } catch (err) {
      console.error('Update error', err)
    } finally {
      setMenuOpen(false)
    }
  }

  return (
    <div className="relative">
      <div
        draggable
        onDragStart={(ev) => {
          ev.dataTransfer.setData('text/task-id', String(task.id))
          try {
            ev.dataTransfer.effectAllowed = 'move'
          } catch {
            /* ignore */
          }
        }}
        className="p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-700 text-sm cursor-grab"
      >
        <div className="flex justify-between">
          <div className="font-medium">{task.name}</div>
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen((s) => !s) }} className="px-2">⋯</button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-28 rounded-md border bg-white dark:bg-slate-800 shadow-md z-20">
                <button onClick={handleEdit} className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Edit</button>
                <button onClick={handleDelete} className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Delete</button>
              </div>
            )}
          </div>
        </div>
        {task.description && <div className="text-xs mt-1 text-gray-600 dark:text-gray-300">{task.description}</div>}
      </div>
    </div>
  )
}
