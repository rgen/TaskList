'use client'
import { useTheme } from '@/components/ThemeProvider'
import clsx from 'clsx'

const THEMES = [
  {
    id: 'default',
    name: 'Classic Light',
    description: 'Clean light gray with blue accents — the default look',
    preview: {
      sidebar: '#f3f4f6',
      body: '#f9fafb',
      card: '#ffffff',
      accent: '#2563eb',
      text: '#111827',
    },
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Easy on the eyes with a sleek dark interface',
    preview: {
      sidebar: '#1f2937',
      body: '#111827',
      card: '#1f2937',
      accent: '#3b82f6',
      text: '#f9fafb',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Deep navy sidebar with soft blue tones throughout',
    preview: {
      sidebar: '#1e3a5f',
      body: '#eff6ff',
      card: '#ffffff',
      accent: '#2563eb',
      text: '#1e3a5f',
    },
  },
  {
    id: 'forest',
    name: 'Forest Green',
    description: 'Rich green sidebar with fresh, natural tones',
    preview: {
      sidebar: '#14532d',
      body: '#f0fdf4',
      card: '#ffffff',
      accent: '#16a34a',
      text: '#14532d',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset Purple',
    description: 'Bold purple sidebar with warm violet accents',
    preview: {
      sidebar: '#3b0764',
      body: '#faf5ff',
      card: '#ffffff',
      accent: '#9333ea',
      text: '#3b0764',
    },
  },
  {
    id: 'rose',
    name: 'Rose Pink',
    description: 'Warm rose sidebar with soft pink tones',
    preview: {
      sidebar: '#9f1239',
      body: '#fff1f2',
      card: '#ffffff',
      accent: '#e11d48',
      text: '#881337',
    },
  },
]

function ThemeCard({ theme, isActive, onSelect }) {
  return (
    <button
      onClick={() => onSelect(theme.id)}
      className={clsx(
        'w-full text-left rounded-xl border-2 overflow-hidden transition-all',
        isActive
          ? 'border-blue-500 ring-2 ring-blue-200 shadow-md'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      )}
    >
      {/* Preview */}
      <div className="flex h-24" style={{ backgroundColor: theme.preview.body }}>
        {/* Mini sidebar */}
        <div className="w-12 h-full flex flex-col items-center gap-1.5 pt-3" style={{ backgroundColor: theme.preview.sidebar }}>
          <div className="w-6 h-1 rounded-full" style={{ backgroundColor: theme.preview.accent, opacity: 0.8 }} />
          <div className="w-5 h-0.5 rounded-full bg-white opacity-30" />
          <div className="w-5 h-0.5 rounded-full bg-white opacity-30" />
          <div className="w-5 h-0.5 rounded-full bg-white opacity-30" />
          <div className="w-5 h-0.5 rounded-full bg-white opacity-20" />
        </div>
        {/* Mini content area */}
        <div className="flex-1 p-2.5 flex flex-col gap-1.5">
          <div className="flex gap-1.5">
            <div className="h-6 w-14 rounded" style={{ backgroundColor: theme.preview.card, border: `1px solid ${theme.preview.accent}20` }} />
            <div className="h-6 w-14 rounded" style={{ backgroundColor: theme.preview.card, border: `1px solid ${theme.preview.accent}20` }} />
            <div className="h-6 w-14 rounded" style={{ backgroundColor: theme.preview.card, border: `1px solid ${theme.preview.accent}20` }} />
          </div>
          <div className="flex-1 rounded" style={{ backgroundColor: theme.preview.card, border: `1px solid ${theme.preview.accent}15` }}>
            <div className="flex gap-1 p-1.5">
              <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: theme.preview.text, opacity: 0.15 }} />
              <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: theme.preview.accent, opacity: 0.3 }} />
            </div>
            <div className="flex gap-1 px-1.5">
              <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: theme.preview.text, opacity: 0.1 }} />
              <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: theme.preview.text, opacity: 0.1 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 bg-white border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">{theme.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{theme.description}</p>
          </div>
          {isActive && (
            <span className="shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export default function AppearancePage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Appearance</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Choose a color scheme for your app</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {THEMES.map((t) => (
          <ThemeCard
            key={t.id}
            theme={t}
            isActive={theme === t.id}
            onSelect={setTheme}
          />
        ))}
      </div>

      <p className="text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
        Theme is applied instantly and saved to your browser. Each user can have their own theme.
      </p>
    </div>
  )
}
