import { useState } from 'react'
import { Send } from 'lucide-react'
import { ChatMessage } from '../../types'
import { CURRENT_USER_ID } from '../../constants'

interface Props {
  messages: ChatMessage[]
  onSend: (message: string) => Promise<void>
  loading?: boolean
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ChatCard({ messages, onSend, loading }: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    await onSend(text.trim())
    setText('')
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="card flex flex-col h-96">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="text-center text-xs text-gray-400 py-4">Carregando mensagens...</div>
        )}
        {messages.length === 0 && !loading && (
          <div className="text-center text-xs text-gray-400 py-8">
            Nenhuma mensagem ainda. Diga oi! 👋
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === CURRENT_USER_ID
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                  isMe
                    ? 'bg-brand-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >
                {!isMe && (
                  <p className="text-xs font-semibold text-brand-600 mb-0.5">{msg.senderName}</p>
                )}
                <p className="text-sm leading-relaxed">{msg.message}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-brand-200' : 'text-gray-400'}`}>
                  {formatTime(msg.sentAt)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-3 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem..."
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="btn-primary w-9 h-9 p-0 flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
