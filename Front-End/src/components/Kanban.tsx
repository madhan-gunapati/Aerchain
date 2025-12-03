import { useEffect, useState } from 'react'
import KanbanCard from './KanbanCard'
import { addTaskToDB } from '../lib/tasksApi'
import Dialog from './Dialog'
import Toast from './Toast'

type Task = {
  id: string | number
  name: string
  description?: string
  status?: 'todo' | 'in-progress' | 'done'
}

export default function Kanban() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<Task['status'] | null>(null)

  const fetchTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('http://localhost:3000/tasks')
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const data = await res.json()
    console.log(data.tasks)
      // assume data is an array of tasks
      setTasks(Array.isArray(data.tasks) ? data.tasks : [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const byStatus = (status: Task['status']) => tasks.filter((t) => (t.status ?? 'todo') === status)

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type?: 'error' | 'info' } | null>(null)

  const onDropTo = async (status: Task['status'] | undefined, ev: React.DragEvent) => {
    ev.preventDefault()
    setDragOverStatus(null)
    const id = ev.dataTransfer.getData('text/task-id')
    if (!id) return

    setTasks((prev) => {
      const updated = prev.map((t) => (String(t.id) === id ? { ...t, status: status ?? 'todo' } : t))
      return updated
    })

    // Optimistically persist change to backend
    try {
      await fetch(`http://localhost:3000/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status ?? 'todo' }),
      })
    } catch (err) {
      // swallow error but optionally you could re-fetch or show toast
      console.error('Failed to update task status:', err)
    }
  }

  const onDragOverColumn = (status: Task['status'] | undefined, ev: React.DragEvent) => {
    ev.preventDefault()
    setDragOverStatus(status ?? null)
  }

  const Column = ({ title, children, status }: { title: string; children: React.ReactNode; status: Task['status'] }) => (
    <div
      onDragOver={(e) => onDragOverColumn(status, e)}
      onDrop={(e) => onDropTo(status, e)}
      className={`flex-1 min-w-[220px] rounded-md p-3 transition-all ${dragOverStatus === status ? 'ring-2 ring-black/40 dark:ring-white/30' : ''} bg-gray-50 dark:bg-slate-800`}
    >
      <h4 className="font-semibold mb-2 text-sm">{title}</h4>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
  // use KanbanCard for each task (handles edit/delete via provided endpoints)
  const onCardUpdated = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (String(t.id) === String(updated.id) ? { ...t, ...updated } : t)))
  }

  const onCardDeleted = (id: string | number) => {
    setTasks((prev) => prev.filter((t) => String(t.id) !== String(id)))
  }

  // Add task using the exported helper
  const handleAddTask = async () => {
    if (!newName.trim()) {
      setToast({ message: 'Task name required', type: 'error' })
      setTimeout(() => setToast(null), 2500)
      return
    }

    setAddLoading(true)
    try {
      await addTaskToDB({ name: newName.trim(), description: newDesc.trim(), status: 'todo' })
      setShowAddDialog(false)
      setNewName('')
      setNewDesc('')
      fetchTasks()
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' })
      setTimeout(() => setToast(null), 4000)
    } finally {
      setAddLoading(false)
    }
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Tasks</h2>
        <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddDialog(true)}
              className="px-3 py-1 rounded-md border bg-gray-100 dark:bg-slate-700 text-sm"
            >
              Add Task
            </button>
            <button
              onClick={fetchTasks}
              className="px-3 py-1 rounded-md border bg-gray-100 dark:bg-slate-700 text-sm"
            >
              Refresh
            </button>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-600 dark:text-gray-300">Loading tasks…</div>}
      {error && <div className="text-sm text-red-600 dark:text-red-400">Error: {error}</div>}

      <div className="mt-4 flex gap-4">
        <Column title="To Do" status="todo">
          {byStatus('todo').length === 0 ? (
            <div className="text-xs text-gray-500">No tasks</div>
          ) : (
            byStatus('todo').map((t) => (
              <KanbanCard key={t.id} task={t} onUpdated={onCardUpdated} onDeleted={onCardDeleted} />
            ))
          )}
        </Column>

        <Column title="In Progress" status="in-progress">
          {byStatus('in-progress').length === 0 ? (
            <div className="text-xs text-gray-500">No tasks</div>
          ) : (
            byStatus('in-progress').map((t) => (
              <KanbanCard key={t.id} task={t} onUpdated={onCardUpdated} onDeleted={onCardDeleted} />
            ))
          )}
        </Column>

        <Column title="Done" status="done">
          {byStatus('done').length === 0 ? (
            <div className="text-xs text-gray-500">No tasks</div>
          ) : (
            byStatus('done').map((t) => (
              <KanbanCard key={t.id} task={t} onUpdated={onCardUpdated} onDeleted={onCardDeleted} />
            ))
          )}
        </Column>
      </div>
      {/* Add Task Dialog */}
      <Dialog
        open={showAddDialog}
        title="Add Task"
        onClose={() => setShowAddDialog(false)}
        action={{ label: addLoading ? 'Adding...' : 'Add', onClick: handleAddTask, variant: 'primary' }}
      >
        <div className="flex flex-col gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Title" className="w-full px-3 py-2 border rounded" />
          <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description" className="w-full px-3 py-2 border rounded" />
        </div>
      </Dialog>

      {toast && <Toast message={toast.message} type={toast.type === 'error' ? 'error' : 'info'} onClose={() => setToast(null)} />}
    </section>
  )
}
