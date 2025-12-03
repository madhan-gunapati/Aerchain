import { useEffect, useState } from 'react'
import AudioRecorder from "./components/Audiorecorder"
import Kanban from "./components/Kanban"

const App = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
    } catch {
      // ignore
    }
  }, [theme])

  return (
    <div className="min-h-screen px-4 py-8 bg-(--bg) text-(--text) transition-colors">
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Voice Assisted Task Manager</h1>
        <div>
          <button
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="  px-3 py-2 rounded-md border bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            {theme === 'dark' ?  '☀️ ' :'🌙 ' }
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <AudioRecorder />
        <Kanban />
      </main>
    </div>
  )
}

export default App