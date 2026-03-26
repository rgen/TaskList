'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext({ theme: 'default', setTheme: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

export default function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('default')

  useEffect(() => {
    const saved = localStorage.getItem('app_theme') || 'default'
    setThemeState(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  function setTheme(t) {
    setThemeState(t)
    localStorage.setItem('app_theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
