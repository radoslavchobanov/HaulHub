import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { chatApi } from '../../api/chat'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useAuthStore } from '../../stores/authStore'
import type { Message } from '../../types'
import { format } from 'date-fns'

interface ChatWindowProps {
  roomId: string
}

export default function ChatWindow({ roomId }: ChatWindowProps) {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: initialMessages } = useQuery({
    queryKey: ['messages', roomId],
    queryFn: () => chatApi.messages(roomId).then((r) => r.data),
    enabled: !!roomId,
  })

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages)
    }
  }, [initialMessages])

  const handleNewMessage = useCallback((msg: Message) => {
    setMessages((prev) => {
      if (prev.find((m) => m.id === msg.id)) return prev
      return [...prev, msg]
    })
  }, [])

  const { sendMessage } = useWebSocket(roomId, handleNewMessage)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    const content = input.trim()
    if (!content) return
    sendMessage(content)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">No messages yet. Say hello!</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender?.id === user?.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md ${isMe ? 'order-2' : ''}`}>
                {!isMe && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1">
                    {msg.sender?.full_name || msg.sender_name}
                  </p>
                )}
                <div
                  className={`px-4 py-2 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-brand-600 text-white rounded-br-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <p className={`text-xs text-gray-400 dark:text-gray-500 mt-1 ${isMe ? 'text-right' : 'text-left'} ml-1`}>
                  {format(new Date(msg.sent_at), 'HH:mm')}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-gray-200 dark:border-gray-700 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="input flex-1"
        />
        <button type="submit" className="btn-primary px-4" disabled={!input.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}
