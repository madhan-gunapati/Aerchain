import { useEffect, useState } from 'react'
import {   List , Grid} from 'lucide-react'

import Kanban from "./components/Kanban"

// Helper to update CSS variables for theme
function setThemeVars(theme: 'light' | 'dark') {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.style.setProperty('--bg', '#0f1724');
    root.style.setProperty('--text', '#f8fafc');
  } else {
    root.style.setProperty('--bg', '#f8fafc');
    root.style.setProperty('--text', '#0f172a');
  }
}

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
      const dark = async ()=>{
          await setTheme('dark')
        }
      if (theme === 'dark') {
        
        document.documentElement.classList.add('dark');
        dark()
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        
        localStorage.setItem('theme', 'light');
        
      }
      setThemeVars(theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  
  

  return (
    <div className="min-h-screen px-2 sm:px-4 py-8 bg-white dark:bg-slate-900 dark:text-gray-100 transition-colors duration-200">
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Voice Task Manager</h1>
        <div className="flex items-center gap-2">
          
          <button
            onClick={() => setViewMode((v) => (v === 'kanban' ? 'list' : 'kanban'))}
            className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-sm flex items-center gap-2"
            title={viewMode === 'kanban' ? 'Switch to List View' : 'Switch to Kanban View'}
          >
            {viewMode === 'kanban' ? <List /> : <Grid />}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <Kanban viewMode={viewMode} />
      </main>
    </div>
  )
}

export default App