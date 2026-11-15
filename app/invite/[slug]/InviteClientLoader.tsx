'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { EventSettings } from '@/lib/storage'
import DesktopMascots from './DesktopMascots'
import InviteCard from './InviteCard'
import './invite.css'

interface InviteApiPayload {
  valid: boolean
  mode: 'personal' | 'public'
  inviteSlug: string
  guestName: string
  customGreeting?: string
  settings: EventSettings
  error?: string
}

export default function InviteClientLoader({ token }: { token: string }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'invalid'>('loading')
  const [data, setData] = useState<InviteApiPayload | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function verifyToken() {
      setStatus('loading')
      try {
        const res = await fetch(
          `/api/invite?token=${encodeURIComponent(token)}`,
          {
            cache: 'no-store',
            signal: controller.signal,
          }
        )
        const json = (await res.json()) as InviteApiPayload
        if (!res.ok || !json.valid) {
          setErrorMessage(
            json.error || 'Thiệp mời không tồn tại hoặc mã token không hợp lệ.'
          )
          setStatus('invalid')
          return
        }
        setData(json)
        setStatus('ready')
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setErrorMessage('Không thể kết nối máy chủ để kiểm tra mã token.')
        setStatus('invalid')
      }
    }

    verifyToken()
    return () => controller.abort()
  }, [token])

  if (status === 'ready' && data) {
    return (
      <InviteCard
        mode={data.mode}
        guestName={data.guestName}
        customGreeting={data.customGreeting}
        inviteSlug={data.inviteSlug}
        settings={data.settings}
      />
    )
  }

  return (
    <main className="invite-shell theme-hcmut-navy">
      <DesktopMascots />
      <div className="token-status-card" role="status" aria-live="polite">
        <Image
          src="/hcmut-logo.png"
          alt="Logo Trường Đại học Bách Khoa"
          width={84}
          height={84}
          priority
          className="token-status-logo"
        />
        {status === 'loading' ? (
          <>
            <h1 className="token-status-title">Đang xác thực thiệp mời</h1>
            <p className="token-status-desc">
              Đang kiểm tra mã token từ hệ thống...
            </p>
          </>
        ) : (
          <>
            <h1 className="token-status-title">Không tìm thấy thiệp mời</h1>
            <p className="token-status-desc">
              {errorMessage ||
                'Thiệp mời không tồn tại hoặc mã token không hợp lệ.'}
            </p>
          </>
        )}
      </div>
    </main>
  )
}
