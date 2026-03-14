import { Link, useLocation } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'

const navLinks = [
  { to: '/', label: '首页' },
  { to: '/requests', label: '需求' },
  { to: '/logs', label: '实验日志' },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2 font-bold text-teal-600">
          <FlaskConical size={22} />
          <span className="text-lg">AI保险实验室</span>
          <span className="text-xs font-normal text-gray-400 hidden sm:inline">AI Insurance Lab</span>
        </Link>

        {/* Desktop nav only */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                pathname === link.to
                  ? 'bg-teal-50 text-teal-600'
                  : 'text-gray-600 hover:text-teal-600 hover:bg-gray-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
