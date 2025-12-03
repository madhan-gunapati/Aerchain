import { useState } from 'react'
import TaskEditDialog from './TaskEditDialog'
import { MoreHorizontal, Edit3, Trash2 } from 'lucide-react'

type Task = {
  id?: string | number
  name: string
  desc?: string
  dueDate?: string
  priority?: 'low' | 'medium' | 'high'
  status?: 'to-do' | 'in-progress' | 'completed'
}

type Props = {
  task: Task
  onUpdated?: (t: Task) => void
  onDeleted?: (id: string | number) => void
  viewMode?: 'kanban' | 'list'
}

export default function KanbanCard({ task, onUpdated, onDeleted, viewMode }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const handleDelete = async () => {
    try {
      if (!task.id) throw new Error('Task ID is required')
      const res = await fetch(`http://localhost:3000/delete-task/${task.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      onDeleted?.(task.id)
    } catch (err) {
      console.error('Delete error', err)
    } finally {
      setMenuOpen(false)
    }
  }

  const handleEditSave = async (updatedTask: Task) => {
    setIsEditing(true)
    try {
      const idToUse = updatedTask.id ?? task.id
      if (!idToUse) throw new Error('Task ID required')
      const res = await fetch(`http://localhost:3000/update-task/${idToUse}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask),
      })
      if (!res.ok) throw new Error('Update failed')
      const updated = await res.json()
      onUpdated?.(updated)
      setShowEditDialog(false)
    } catch (err) {
      console.error('Update error', err)
    } finally {
      setIsEditing(false)
      setMenuOpen(false)
    }
  }

  // Color maps for priority and status
  const priorityColors: Record<string, string> = {
    low: 'bg-green-100 text-green-800 border-green-300',
    medium: 'bg-yellow-400 text-yellow-900 border-yellow-400',
    high: 'bg-red-300 text-red-900 border-red-300',
  }
  // All cards use neutral gray backgrounds
  const statusColors: Record<string, string> = {
    'to-do': 'bg-gray-50 text-gray-800 border-gray-200',
    'in-progress': 'bg-gray-100 text-gray-800 border-gray-200',
    'completed': 'bg-gray-200 text-gray-800 border-gray-300',
  }
  const cardBorder = 'border-gray-200'
  const cardBg = viewMode === 'list' ? 'bg-white' : (task.status ? statusColors[task.status] : 'bg-white')

  return (
    <div className="relative group text-black">
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
        className={`p-3 md:p-4 rounded-xl border ${cardBorder} ${cardBg} hover:shadow-lg transition-shadow text-sm cursor-grab`}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base break-normal mb-1">{task.name}</div>
            {task.desc && <div className="text-xs mb-2 text-gray-600 line-clamp-2">{task.desc}</div>}
            <div className="flex flex-wrap gap-2 mt-2">
              {task.dueDate && (
                <span className="inline-block text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">Due: {task.dueDate.split('T')[0]}</span>
              )}
              {task.priority && (
                <span className={`inline-block text-xs px-2 py-1 rounded border ${priorityColors[task.priority]}`}>Priority: {task.priority}</span>
              )}
              {task.status && (
                <span className={`inline-block text-xs px-2 py-1 rounded border ${statusColors[task.status]}`}>Status: {task.status.replace('-', ' ')}</span>
              )}
            </div>
          </div>
          <div className="relative shrink-0">
            <button 
              onClick={(e) => { e.stopPropagation(); setMenuOpen((s) => !s) }} 
              className="p-1 md:p-2 hover:bg-gray-100 rounded transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-32 rounded-md border border-gray-200 bg-white shadow-lg z-20">
                <button 
                  onClick={() => { setShowEditDialog(true); setMenuOpen(false) }} 
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2"><Edit3 size={14} />Edit</div>
                </button>
                <button 
                  onClick={handleDelete} 
                  className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2 text-red-600"><Trash2 size={14} />Delete</div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TaskEditDialog for editing */}
      <TaskEditDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        initialTask={task}
        onSave={handleEditSave}
        isLoading={isEditing}
        title="Edit Task"
        afterSave={typeof window !== 'undefined' && typeof (window as any).__kanbanAfterSave === 'function' ? (window as any).__kanbanAfterSave : undefined}
      />
    </div>
  )
}
