import { Link, useLocation } from 'react-router-dom'
import { Sparkles, Bell, User } from 'lucide-react'
import { CURRENT_USER_ID } from '../../constants'

const nav = [
  { to: '/', label: 'Início' },
  { to: '/contributions', label: 'Contribuições' },
  { to: '/matchmaking', label: 'Mentoria' },
  { to: '/scheduling', label: 'Agenda' },
]

export default function Header() {
  const location = useLocation()

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-gray-900 text-sm">I've Seen This Before</span>
              <span className="block text-xs text-brand-600 font-medium -mt-0.5">Sororidade & Mentoria</span>
            </div>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => {
              const isActive = location.pathname === item.to ||
                (item.to !== '/' && location.pathname.startsWith(item.to))
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
            </button>
            <Link
              to={`/profile/${CURRENT_USER_ID}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-brand-600" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">Meu Perfil</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-gray-100 bg-gray-50 px-4 py-2 flex gap-1 overflow-x-auto">
        {nav.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to))
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </header>
  )
}
