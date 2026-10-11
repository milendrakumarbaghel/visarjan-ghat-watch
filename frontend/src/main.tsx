import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
// Fonts are bundled with the app, so it works offline and the PDF brief can embed them.
import '@fontsource-variable/inter/wght.css'
import '@fontsource/noto-sans-devanagari/devanagari-400.css'
import '@fontsource/noto-sans-devanagari/devanagari-500.css'
import '@fontsource/noto-sans-devanagari/devanagari-600.css'
import '@fontsource/noto-sans-devanagari/devanagari-700.css'
import '@fontsource/noto-sans-devanagari/devanagari-800.css'
import './index.css'
import { AppProvider } from './state'
import { AppShell } from './components/AppShell'
import { LandingPage } from './pages/LandingPage'
import { OverviewPage } from './pages/OverviewPage'
import { RankingsPage } from './pages/RankingsPage'
import { GhatDetailPage } from './pages/GhatDetailPage'
import { MapPage } from './pages/MapPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { EvidencePage } from './pages/EvidencePage'
import { BriefPage } from './pages/BriefPage'
import { AboutPage } from './pages/AboutPage'
import { ReadingsPage } from './pages/ReadingsPage'
import { SchedulePage } from './pages/SchedulePage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route index element={<LandingPage />} />
          <Route path="app" element={<AppShell />}>
            <Route index element={<OverviewPage />} />
            <Route path="rankings" element={<RankingsPage />} />
            <Route path="ghat/:ghatId" element={<GhatDetailPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="evidence" element={<EvidencePage />} />
            <Route path="brief" element={<BriefPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="readings" element={<ReadingsPage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  </StrictMode>,
)
