import { useState } from 'react'
import { Calendar, Clock, ExternalLink, MessageSquare } from 'lucide-react'
import { useScheduling, useChat } from '../hooks/useScheduling'
import { MentoringSession } from '../types'
import ChatCard from '../components/scheduling/ChatCard'
import { CURRENT_USER_ID } from '../constants'

const statusLabel: Record<string, string> = {
  pending: '⏳ Pendente',
  confirmed: '✅ Confirmada',
  completed: '🎉 Concluída',
  cancelled: '❌ Cancelada',
}
const statusClass: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  confirmed: 'bg-green-50 text-green-700 border border-green-200',
  completed: 'bg-blue-50 text-blue-700 border border-blue-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SessionCard({
  session,
  onSelect,
  isSelected,
}: {
  session: MentoringSession
  onSelect: () => void
  isSelected: boolean
}) {
  return (
    <div
      onClick={onSelect}
      className={`card p-4 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-brand-400 border-brand-200' : 'hover:border-gray-200'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm line-clamp-1">{session.topic}</p>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            <span className="capitalize">{formatDate(session.scheduledAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{session.durationMinutes} minutos</span>
          </div>
        </div>
        <span className={`shrink-0 badge ${statusClass[session.status]}`}>
          {statusLabel[session.status]}
        </span>
      </div>

      {session.meetingUrl && session.status === 'confirmed' && (
        <a
          href={session.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-3 flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Entrar na reunião
        </a>
      )}
    </div>
  )
}

function ChatSection({ sessionId }: { sessionId: string }) {
  const { messages, loading, send } = useChat(sessionId)

  const handleSend = async (message: string) => {
    await send(CURRENT_USER_ID, message)
  }

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-brand-600" />
        Chat da Sessão
      </h3>
      <ChatCard messages={messages} onSend={handleSend} loading={loading} />
    </div>
  )
}

export default function Scheduling() {
  const { sessions, loading } = useScheduling(CURRENT_USER_ID)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedSession = sessions.find((s) => s.id === selectedId)

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-48" />
        {[1, 2].map((i) => (
          <div key={i} className="card p-4 h-24" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Agenda de Mentorias</h1>
        <p className="section-subtitle">
          Suas sessões de mentoria agendadas. Clique em uma sessão para ver o chat.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-500">Nenhuma sessão agendada</p>
          <p className="text-sm text-gray-400 mt-1">
            Encontre uma mentora e agende sua primeira sessão!
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Sessions list */}
          <div>
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider mb-3">
              Sessões ({sessions.length})
            </h2>
            <div className="space-y-3">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onSelect={() => setSelectedId(session.id === selectedId ? null : session.id)}
                  isSelected={session.id === selectedId}
                />
              ))}
            </div>
          </div>

          {/* Chat */}
          <div>
            {selectedSession ? (
              <ChatSection sessionId={selectedSession.id} />
            ) : (
              <div className="card p-8 text-center flex flex-col items-center justify-center h-full min-h-[200px]">
                <MessageSquare className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">
                  Selecione uma sessão para ver o chat
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
