import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import type { Message } from '../types'

interface WSMessage {
  id: string
  sender_id: string
  sender_name: string
  sender_type?: 'client' | 'hauler'
  content: string
  sent_at: string
  is_read: boolean
}

export function useWebSocket(
  roomId: string | null,
  onMessage: (msg: Message) => void
) {
  const ws = useRef<WebSocket | null>(null)
  const { accessToken, user } = useAuthStore()

  const connect = useCallback(() => {
    if (!roomId || !accessToken) return

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const wsBase = `${proto}://${window.location.host}/ws`
    const url = `${wsBase}/chat/${roomId}/?token=${accessToken}`

    ws.current = new WebSocket(url)

    ws.current.onmessage = (event) => {
      const data: WSMessage = JSON.parse(event.data)
      const message: Message = {
        id: data.id,
        chat_room: roomId,
        sender: {
          id: data.sender_id,
          full_name: data.sender_name,
          first_name: data.sender_name.split(' ')[0],
          last_name: data.sender_name.split(' ').slice(1).join(' '),
          email: '',
          phone: '',
          phone_verified: false,
          user_type: data.sender_type ?? (user?.id === data.sender_id ? (user?.user_type ?? 'client') : 'client'),
          auth_provider: 'email',
          country: '',
          city: '',
          account_status: 'active',
          verification_tier: 'unverified',
          cancellation_rate: null,
          created_at: '',
        },
        content: data.content,
        sent_at: data.sent_at,
        is_read: data.is_read,
      }
      onMessage(message)
    }

    ws.current.onerror = () => {
      setTimeout(connect, 3000)
    }
  }, [roomId, accessToken, onMessage])

  useEffect(() => {
    connect()
    return () => {
      ws.current?.close()
    }
  }, [connect])

  const sendMessage = useCallback((content: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ content }))
    }
  }, [])

  return { sendMessage }
}
