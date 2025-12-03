export async function addTaskToDB(task: { name: string; description?: string; status?: string }) {
  const res = await fetch('http://localhost:3000/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  })
  if (!res.ok) throw new Error(`Failed to add task: ${res.status}`)
  const data = await res.json()
  return data
}
