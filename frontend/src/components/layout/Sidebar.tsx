import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, GitPullRequest, Users, Calendar, Star } from 'lucide-react'
import { CURRENT_USER_ID } from '../../constants'

const items = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contributions', icon: GitPullRequest, label: 'Contribuições' },
  { to: `/profile/${CURRENT_USER_ID}`, icon: Star, label: 'Meu Perfil' },
  { to: '/matchmaking', icon: Users, label: 'Mentoria' },
  { to: '/scheduling', icon: Calendar, label: 'Agenda' },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="hidden lg:flex flex-col w-56 border-r border-gray-100 bg-white py-6 px-3 gap-1 shrink-0">
      {items.map(({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to ||
          (to !== '/' && !to.includes('/profile/') && location.pathname.startsWith(to))
        return (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-brand-50 text-brand-700 border border-brand-100'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-gray-400'}`} />
            {label}
          </Link>
        )
      })}

      <div className="mt-auto pt-4 border-t border-gray-100">
        <div className="rounded-xl bg-gradient-to-br from-brand-50 to-purple-50 border border-brand-100 p-3">
          <p className="text-xs font-semibold text-brand-700 mb-1">✨ Sororidade Tech</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Quando ajudamos umas às outras, todas chegamos mais longe.
          </p>
        </div>
      </div>
    </aside>
  )
}
