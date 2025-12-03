export async function addTaskToDB(task: { name: string; desc?: string; status?: string; priority?: string; dueDate?: string }) {
  // include priority and dueDate if provided
  const payload = {
    name: task.name,
    desc: task.desc ?? '',
    status: task.status ?? 'todo',
    // pass through optional fields if present
    ...(task.priority ? { priority: task.priority } : {}),
    ...(task.dueDate ? { dueDate: task.dueDate } : {}),
  }
  

  const res = await fetch('http://localhost:3000/add-task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Failed to add task: ${res.status}`)
  const data = await res.json()
  return data
}
