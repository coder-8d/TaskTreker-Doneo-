import { useAuth } from './context/AuthContext.jsx'
import { useTasks } from './hooks/useTasks.js'
import { useI18n } from './i18n/index.jsx'
import { useRouter } from './router/index.jsx'
import { useOnline } from './hooks/useOnline.js'
import Header from './components/Header.jsx'
import Splash from './components/Splash.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import AdSlot from './components/AdSlot.jsx'
import OfflineScreen from './components/OfflineScreen.jsx'
import TasksPage from './pages/TasksPage.jsx'
import StatsPage from './pages/StatsPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import PricingPage from './pages/PricingPage.jsx'
import AiPage from './pages/AiPage.jsx'
import HelpPage from './pages/HelpPage.jsx'

// Оболочка приложения: шапка с навигацией, активная страница и подвал.
// Состояние задач общее для всех страниц, поэтому хук вызывается один раз.
function Tracker() {
  const { user, mode, logout } = useAuth()
  const { route } = useRouter()
  const { t, lang, langs } = useI18n()
  const online = useOnline()
  const {
    tasks,
    stats,
    loading,
    error,
    clearError,
    addTask,
    updateTask,
    removeTask,
    toggleStatus,
    clearCompleted,
    reorderTasks,
  } = useTasks(user.id, mode)

  return (
    <div className="app">
      <div className="app__inner">
        <Header taskCount={stats.total} />

        <main className="app__main">
          {error && (
            <div className="app__alert" role="alert">
              <span>{error}</span>
              <button className="btn btn--link" type="button" onClick={clearError}>
                {t('common.close')}
              </button>
            </div>
          )}

          {route === 'stats' && <StatsPage tasks={tasks} stats={stats} />}

          {route === 'pricing' && <PricingPage />}

          {route === 'ai' && <AiPage />}

          {route === 'settings' && (
            <SettingsPage
              user={user}
              mode={mode}
              tasks={tasks}
              stats={stats}
              clearCompleted={clearCompleted}
              logout={logout}
            />
          )}

          {route === 'help' && <HelpPage />}

          {route === 'tasks' && (
            <TasksPage
              user={user}
              tasks={tasks}
              stats={stats}
              loading={loading}
              addTask={addTask}
              updateTask={updateTask}
              removeTask={removeTask}
              toggleStatus={toggleStatus}
              clearCompleted={clearCompleted}
              reorderTasks={reorderTasks}
            />
          )}
        </main>

        <footer className="app__footer">
          <span>
            {t('meta.name')} · {t('meta.tagline')}
          </span>
          <span>
            {mode === 'server'
              ? t('pages.settings.modeServer')
              : t('pages.settings.modeLocal')}
            {' · '}
            {t('pages.settings.language')}:{' '}
            {(langs.find((item) => item.code === lang) || {}).label || lang}
          </span>
        </footer>

        <AdSlot />

        <OfflineScreen online={online} />
      </div>
    </div>
  )
}

export default function App() {
  const { ready, user } = useAuth()

  if (!ready) return <Splash />
  if (!user) return <AuthScreen />
  return <Tracker key={user.id} />
}
