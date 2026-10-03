import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { Landing, Login, Register } from './pages/Public'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Resume from './pages/Resume'
import { Domains, Jobs, SkillGaps } from './pages/Career'
import Roadmap from './pages/Roadmap'
import Interview from './pages/Interview'
import { ProgressPage, Report, Settings } from './pages/ProgressReport'

function applySavedAppearance() {
  const appearance =
    localStorage.getItem('prepmate_appearance') || 'System'

  const isDark = appearance === 'Dark'

  document.documentElement.classList.toggle(
    'prepmate-dark',
    isDark
  )

  document.body.classList.toggle(
    'prepmate-dark',
    isDark
  )
}

export default function App() {
  useEffect(() => {
    // Apply saved theme when the application starts
    applySavedAppearance()

    // Re-apply when Settings changes the preference
    const handleSettingsChange = () => {
      applySavedAppearance()
    }

    window.addEventListener(
      'prepmate-settings-changed',
      handleSettingsChange
    )

    return () => {
      window.removeEventListener(
        'prepmate-settings-changed',
        handleSettingsChange
      )
    }
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/app" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="resume" element={<Resume />} />
        <Route path="domains" element={<Domains />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="skill-gaps" element={<SkillGaps />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="interview" element={<Interview />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="report" element={<Report />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  )
}