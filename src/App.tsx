import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { FlaskConical, MessageSquare, BookOpen } from 'lucide-react'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import ToolsPage from './pages/ToolsPage'
import ToolDetailPage from './pages/ToolDetailPage'
import RequestsPage from './pages/RequestsPage'
import LogsPage from './pages/LogsPage'
import AdminPage from './pages/AdminPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/tools/:id" element={<ToolDetailPage />} />
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  )
}

function BottomNav() {
  const { pathname } = useLocation()
  const links = [
    { to: '/', label: '工具', icon: <FlaskConical size={20} /> },
    { to: '/requests', label: '需求', icon: <MessageSquare size={20} /> },
    { to: '/logs', label: '实验日志', icon: <BookOpen size={20} /> },
  ]

  // 不在 admin 页显示底部导航
  if (pathname === '/admin') return null

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg">
      <div className="flex">
        {links.map(link => {
          const active = pathname === link.to
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                active ? 'text-teal-600' : 'text-gray-400'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
