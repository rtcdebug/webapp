import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const VisualizerPage = lazy(() => import('./pages/VisualizerPage'))
const BlogPage = lazy(() => import('./pages/BlogPage'))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'))

function Loading() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0b',
      color: '#888'
    }}>
      Loading...
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/visualizer" element={<VisualizerPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
      </Routes>
    </Suspense>
  )
}

export default App
