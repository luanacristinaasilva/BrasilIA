import { useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { useMatchmaking } from '../hooks/useMatchmaking'
import { useScheduling } from '../hooks/useScheduling'
import MatchList from '../components/matchmaking/MatchList'
import ScheduleModal from '../components/scheduling/ScheduleModal'
import { CURRENT_USER_ID } from '../constants'
import { MatchResult } from '../types'

export default function Matchmaking() {
  const [query, setQuery] = useState('')
  const [connectingId, setConnectingId] = useState<string | undefined>()
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null)

  const { matches, loading, error, notifyMentor } = useMatchmaking(CURRENT_USER_ID, query)
  const { scheduleSession } = useScheduling(CURRENT_USER_ID)

  const handleConnect = async (mentorId: string) => {
    setConnectingId(mentorId)
    const match = matches.find((m) => m.mentor.id === mentorId)
    if (match) {
      await notifyMentor(mentorId)
      setSelectedMatch(match)
    }
    setConnectingId(undefined)
  }

  const handleSchedule = async (data: {
    mentorId: string
    menteeId: string
    scheduledAt: string
    durationMinutes: number
    topic: string
    notes?: string
  }) => {
    await scheduleSession(data)
    setSelectedMatch(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="section-title">Matchmaking de Mentoria ✨</h1>
        <p className="section-subtitle">
          Encontre mentoras compatíveis com seu perfil e trajetória. O algoritmo analisa skills,
          experiência e contribuições para calcular o score de compatibilidade.
        </p>
      </div>

      {/* Info card */}
      <div className="card p-4 bg-gradient-to-r from-brand-50 to-purple-50 border-brand-100 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-brand-700">Como funciona o match?</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            O algoritmo considera complementaridade de skills, experiência da mentora, contribuições de alto impacto,
            áreas de atuação diferentes (cross-pollination) e histórico de contribuições em comum.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrar por skill, nome ou cargo..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
        />
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-gray-500">
          {matches.length} mentora{matches.length !== 1 ? 's' : ''} encontrada{matches.length !== 1 ? 's' : ''}
          {query && ` para "${query}"`}
        </p>
      )}

      <MatchList
        matches={matches}
        loading={loading}
        error={error}
        onConnect={handleConnect}
        connectingId={connectingId}
      />

      {/* Schedule modal */}
      {selectedMatch && (
        <ScheduleModal
          mentorId={selectedMatch.mentor.id}
          mentorName={selectedMatch.mentor.name}
          menteeId={CURRENT_USER_ID}
          onSchedule={handleSchedule}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  )
}
