import { useParams } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import ProfileCard from '../components/profile/ProfileCard'
import OptInToggle from '../components/profile/OptInToggle'
import ContributionList from '../components/contributions/ContributionList'
import { CURRENT_USER_ID } from '../constants'
import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'

export default function Profile() {
  const { id } = useParams<{ id: string }>()
  const { profile, loading, error, toggleOptIn } = useProfile(id)
  const isMyProfile = id === CURRENT_USER_ID

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="card p-6 h-48" />
        <div className="card p-6 h-32" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 font-medium">{error || 'Perfil não encontrado'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <ProfileCard profile={profile} />

      {/* Opt-in toggle (only for own profile) */}
      {isMyProfile && (
        <div className="card p-5 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Disponível para Mentoria</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {profile.optInMentoring
                ? '✨ Você está disponível como mentora. Outras profissionais podem te encontrar!'
                : 'Ative para aparecer como mentora e ajudar outras mulheres em tech.'}
            </p>
          </div>
          <OptInToggle
            enabled={profile.optInMentoring}
            onChange={toggleOptIn}
          />
        </div>
      )}

      {/* Match CTA */}
      {!isMyProfile && (
        <div className="card p-5 bg-gradient-to-r from-brand-50 to-purple-50 border-brand-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-brand-700">💡 Quer {profile.name} como mentora?</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Veja o score de compatibilidade e agende uma sessão.
            </p>
          </div>
          <Link to="/matchmaking" className="btn-primary flex items-center gap-2">
            <Users className="w-4 h-4" />
            Ver Match
          </Link>
        </div>
      )}

      {/* Contributions */}
      <div>
        <h2 className="font-bold text-gray-900 mb-4">
          Contribuições ({profile.contributionCount})
        </h2>
        <ContributionList
          contributions={profile.contributions}
          loading={false}
        />
      </div>
    </div>
  )
}
