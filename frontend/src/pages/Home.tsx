import { Link } from 'react-router-dom'
import { Sparkles, Users, GitPullRequest, Calendar, TrendingUp, ArrowRight } from 'lucide-react'
import { useProfiles } from '../hooks/useProfile'
import { useContributions } from '../hooks/useContributions'
import { CURRENT_USER_ID } from '../constants'

export default function Home() {
  const { profiles } = useProfiles()
  const { contributions } = useContributions()

  const mentoringCount = profiles.filter((p) => p.optInMentoring).length
  const highImpact = contributions.filter((c) => c.impact === 'high').length

  const stats = [
    { label: 'Profissionais', value: profiles.length, icon: Users, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Disponíveis p/ Mentoria', value: mentoringCount, icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Contribuições', value: contributions.length, icon: GitPullRequest, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Alto Impacto', value: highImpact, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  const recentContributions = [...contributions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  const topMentors = profiles.filter((p) => p.optInMentoring).slice(0, 4)

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-purple-800 text-white p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-brand-200" />
            <span className="text-brand-200 text-sm font-medium">BrasilIA Hackaton 2024</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            I've Seen This Before ✨
          </h1>
          <p className="text-brand-100 text-lg mb-6 max-w-xl">
            A plataforma de sororidade que conecta mulheres em tech. Quando a dev escreve uma spec,
            o agente encontra padrões passados e mentoras perfeitas para ela.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/matchmaking"
              className="flex items-center gap-2 bg-white text-brand-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-50 transition-colors shadow-lg"
            >
              <Users className="w-4 h-4" />
              Encontrar Mentora
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contributions"
              className="flex items-center gap-2 bg-brand-500/30 text-white font-medium px-5 py-2.5 rounded-xl hover:bg-brand-500/50 transition-colors border border-brand-400/50"
            >
              <GitPullRequest className="w-4 h-4" />
              Ver Contribuições
            </Link>
          </div>
        </div>
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 right-8 w-32 h-32 bg-brand-400/20 rounded-full translate-y-1/2" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent contributions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Contribuições Recentes</h2>
            <Link to="/contributions" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentContributions.map((c) => (
              <div key={c.id} className="card p-4 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${c.type === 'pull_request' ? 'bg-purple-50' : 'bg-blue-50'}`}>
                  <GitPullRequest className={`w-4 h-4 ${c.type === 'pull_request' ? 'text-purple-600' : 'text-blue-600'}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{c.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {c.tags.slice(0, 2).join(' · ')}
                  </p>
                </div>
                <span className={`shrink-0 badge ${c.impact === 'high' ? 'badge-impact-high' : c.impact === 'medium' ? 'badge-impact-medium' : 'badge-impact-low'}`}>
                  {c.impact}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top mentors */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Mentoras Disponíveis</h2>
            <Link to="/matchmaking" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              Ver matches <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {topMentors.map((mentor) => (
              <div key={mentor.id} className="card p-4 flex items-center gap-3">
                <img src={mentor.avatar} alt={mentor.name} className="w-10 h-10 rounded-xl border-2 border-brand-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${mentor.id}`} className="text-sm font-semibold text-gray-900 hover:text-brand-600 transition-colors">
                    {mentor.name}
                  </Link>
                  <p className="text-xs text-gray-500 truncate">{mentor.role} · {mentor.squad}</p>
                </div>
                <Link to={`/scheduling`} className="shrink-0 btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Agendar
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="card p-6 bg-gradient-to-r from-brand-50 to-purple-50 border-brand-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 mb-1">💜 Seja uma mentora</h3>
          <p className="text-sm text-gray-600">
            Compartilhe sua experiência e faça parte da rede de sororidade tech.
          </p>
        </div>
        <Link
          to={`/profile/${CURRENT_USER_ID}`}
          className="shrink-0 btn-primary flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Meu Perfil
        </Link>
      </div>
    </div>
  )
}
