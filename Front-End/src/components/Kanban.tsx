import { useEffect, useMemo, useState } from 'react'
import KanbanCard from './KanbanCard'
import TaskEditDialog from './TaskEditDialog'
import { addTaskToDB } from '../lib/tasksApi'
import Toast from './Toast'
import Dialog from './Dialog'
import AudioRecorder from './Audiorecorder'
import { PlusCircle, Search, Filter, Mic } from 'lucide-react'

type Task = {
  id?: string | number
  name: string
  description?: string
  dueDate?: string
  priority?: 'low' | 'medium' | 'high'
  status?: 'to-do' | 'in-progress' | 'completed'
}

type KanbanProps = {
  viewMode?: 'kanban' | 'list';
};

export default function Kanban({ viewMode = 'kanban' }: KanbanProps) {
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

  

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [filterDate, setFilterDate] = useState('')
  const [showRecorderPopup, setShowRecorderPopup] = useState(false)
  const [toast, setToast] = useState<{ message: string; type?: 'error' | 'info' } | null>(null)

  const filteredTasks = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    return tasks.filter((t) => {
      if (filterPriority !== 'all' && (t.priority ?? 'medium') !== filterPriority) return false
      if (filterDate) {
        // Only include tasks with a dueDate matching filterDate
        if (!t.dueDate) return false;
        // Compare only date part (ignore time)
        const taskDate = t.dueDate.split('T')[0];
        if (taskDate !== filterDate) return false;
      }
      if (!q) return true
      return (
        (t.name ?? '').toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q)
      )
    })
  }, [tasks, searchText, filterPriority, filterDate])

  const byStatusFiltered = (status: Task['status']) => filteredTasks.filter((t) => (t.status ?? 'to-do') === status)

  const onDropTo = async (status: Task['status'] | undefined, ev: React.DragEvent) => {
    ev.preventDefault()
    setDragOverStatus(null)
    const id = ev.dataTransfer.getData('text/task-id')
    if (!id) return

    setTasks((prev) => {
      const updated = prev.map((t) => (String(t.id) === id ? { ...t, status: status ?? 'to-do' } : t))
      return updated
    })

    // Optimistically persist change to backend using the edit endpoint
    try {
      const taskToUpdate = tasks.find((t) => String(t.id) === id)
      if (taskToUpdate) {
        await fetch(`http://localhost:3000/update-task/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...taskToUpdate, status: status ?? 'to-do' }),
        })
      }
    } catch (err) {
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
      className={`shrink-0 md:flex-1 w-full md:w-auto min-w-[280px] md:min-w-[220px] rounded-md p-3 md:p-4 transition-all ${dragOverStatus === status ? 'ring-2 ring-black/40' : ''} bg-gray-50`}
    >
      <h4 className="font-semibold mb-2 text-sm md:text-base">{title}</h4>
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

  // Add task using TaskEditDialog callback
  const handleAddTask = async (taskData: Task) => {
    if (!taskData.name.trim()) {
      setToast({ message: 'Task name required', type: 'error' })
      setTimeout(() => setToast(null), 2500)
      return
    }

    try {
      await addTaskToDB({
        name: taskData.name.trim(),
        description: taskData.description?.trim() ?? '',
        status: taskData.status ?? 'to-do',
        priority: taskData.priority,
        dueDate: taskData.dueDate,
      })
      setShowAddDialog(false)
      fetchTasks()
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' })
      setTimeout(() => setToast(null), 4000)
    }
  }

  // Provide fetchTasks to AudioRecorder via prop
  // Also expose fetchTasks globally for KanbanCard dialogs
  if (typeof window !== 'undefined') {
    (window as any).__kanbanAfterSave = fetchTasks;
  }
  return (
    <section className="mt-8 px-2 sm:px-4 bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <h2 className="text-lg md:text-xl font-semibold text-white">Tasks</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto text-gray-900">
          <div className="flex items-center gap-2 flex-1 sm:flex-none ">
            <div className="relative flex-1 ">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900" size={16} />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search tasks"
                className="w-full pl-9 pr-3 py-2 rounded-md border bg-white text-gray-900 border-gray-200 text-sm"
              />
            </div>
            {/* By Date Filter */}
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="px-3 py-2 rounded-md border bg-white text-gray-900 border-gray-200 text-sm"
              title="Filter by due date"
              style={{ minWidth: 0 }}
            />
            <button
              onClick={() => setFilterPriority((p) => (p === 'all' ? 'high' : p === 'high' ? 'medium' : p === 'medium' ? 'low' : 'all'))}
              title="Toggle priority filter"
              className=" px-3 py-2 rounded-md border bg-gray-100 text-sm hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Filter size={16} />
              <span className="hidden sm:inline">{filterPriority === 'all' ? 'All' : filterPriority}</span>
            </button>
            <button
              onClick={() => setShowRecorderPopup(true)}
              title="Open voice recorder"
              className="px-3 py-2 rounded-md border bg-gray-100 text-sm hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Mic size={16} />
              <span className="hidden sm:inline">Voice</span>
            </button>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-md border bg-gray-100 text-sm hover:bg-gray-200 transition-colors"
            >
              <PlusCircle size={18} />
              <span className="hidden sm:inline">Add Task</span>
            </button>
            <button
              onClick={fetchTasks}
              className="px-3 py-2 rounded-md border bg-gray-100 text-sm hover:bg-gray-200 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-600 dark:text-gray-300">Loading tasks…</div>}
      {error && <div className="text-sm text-red-600 dark:text-red-400">Error: {error}</div>}

      {viewMode === 'kanban' ? (
        <div className="mt-4 flex gap-3 md:gap-4 overflow-x-auto pb-2 md:overflow-x-visible text-gray-900">
          <Column title="To Do" status="to-do">
            {byStatusFiltered('to-do').length === 0 ? (
              <div className="text-xs text-gray-500">No tasks</div>
            ) : (
              byStatusFiltered('to-do').map((t) => (
                <KanbanCard key={t.id} task={t} onUpdated={onCardUpdated} onDeleted={onCardDeleted} />
              ))
            )}
          </Column>

          <Column title="In Progress" status="in-progress">
            {byStatusFiltered('in-progress').length === 0 ? (
              <div className="text-xs text-gray-500">No tasks</div>
            ) : (
              byStatusFiltered('in-progress').map((t) => (
                <KanbanCard key={t.id} task={t} onUpdated={onCardUpdated} onDeleted={onCardDeleted} />
              ))
            )}
          </Column>

          <Column title="Completed" status="completed">
            {byStatusFiltered('completed').length === 0 ? (
              <div className="text-xs text-gray-500">No tasks</div>
            ) : (
              byStatusFiltered('completed').map((t) => (
                <KanbanCard key={t.id} task={t} onUpdated={onCardUpdated} onDeleted={onCardDeleted} />
              ))
            )}
          </Column>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {filteredTasks.length === 0 ? (
            <div className="text-xs text-gray-500">No tasks</div>
          ) : (
            filteredTasks.map((t) => (
              <KanbanCard key={t.id} task={t} onUpdated={onCardUpdated} onDeleted={onCardDeleted} viewMode="list" />
            ))
          )}
        </div>
      )}

      {/* Add Task Dialog */}
      <TaskEditDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSave={handleAddTask}
        afterSave={fetchTasks}
      />

      {/* Audio recorder popup dialog (opens when mic button clicked) */}
      <Dialog open={showRecorderPopup} title="Voice Recorder" onClose={() => setShowRecorderPopup(false)}>
        <div className="p-0">
          <AudioRecorder afterSave={fetchTasks} />
        </div>
      </Dialog>

      {toast && <Toast message={toast.message} type={toast.type === 'error' ? 'error' : 'info'} onClose={() => setToast(null)} />}
    </section>
  )
}
