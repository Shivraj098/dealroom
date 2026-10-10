import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const STORAGE_KEY = 'dealroom-theme'
const ThemeContext = createContext<ThemeContextValue | null>(null)

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const theme = stored === 'dark' || stored === 'light' ? stored : 'light'
    applyTheme(theme)
    return theme
  } catch {
    return 'light'
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.dataset.theme = theme
  root.style.colorScheme = theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Theme still works for the current session when storage is unavailable.
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(current => current === 'light' ? 'dark' : 'light')
  }, [])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme()
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={theme === 'dark'}
      title={`Switch to ${nextTheme} mode`}
      className={`dr-icon-button ${compact ? 'dr-icon-button-compact' : ''}`}
    >
      {theme === 'dark' ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
      <span className={compact ? 'sr-only' : 'hidden md:inline'}>{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  )
}
