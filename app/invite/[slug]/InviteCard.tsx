'use client'

import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'
import { submitGuestMessage } from '@/lib/actions'
import type { EventSettings } from '@/lib/storage'
import DesktopMascots from './DesktopMascots'
import './invite.css'

interface InviteCardProps {
  guestName: string
  customGreeting?: string
  inviteSlug: string
  settings: EventSettings
  mode?: 'personal' | 'public'
  isPreview?: boolean
}

function getSafeExternalUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed
  }
  return null
}

export default function InviteCard({
  guestName,
  customGreeting,
  inviteSlug,
  settings,
  mode = 'personal',
  isPreview = false,
}: InviteCardProps) {
  const [flipped, setFlipped] = useState(false)
  const [customSenderName, setCustomSenderName] = useState<string | null>(null)
  const senderName = customSenderName ?? (mode === 'public' ? '' : guestName)
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState('')
  const [messageTouched, setMessageTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitFeedback, setSubmitFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const dialogRef = useRef<HTMLDialogElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)

  const dialogTitleId = useId()
  const nameInputId = useId()
  const msgInputId = useId()
  const msgHintId = useId()
  const msgErrorId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClose = () => {
      dialog.returnValue = ''
    }
    dialog.addEventListener('close', handleClose)

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const isOutside = (e: PointerEvent) => {
        const rect = dialog.getBoundingClientRect()
        return (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        )
      }

      let pressedOutside = false
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = isOutside(e)
      }
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && isOutside(e)) {
          dialog.close()
        }
        pressedOutside = false
      }

      dialog.addEventListener('pointerdown', onPointerDown)
      dialog.addEventListener('pointerup', onPointerUp)

      return () => {
        dialog.removeEventListener('close', handleClose)
        dialog.removeEventListener('pointerdown', onPointerDown)
        dialog.removeEventListener('pointerup', onPointerUp)
      }
    }

    return () => {
      dialog.removeEventListener('close', handleClose)
    }
  }, [])

  const openMessageDialog = () => {
    setSubmitFeedback(null)
    dialogRef.current?.showModal()
    messageInputRef.current?.focus()
  }

  const closeMessageDialog = () => {
    dialogRef.current?.close()
  }

  const validateMessage = (value: string): string => {
    const trimmed = value.trim()
    if (trimmed.length < 2) {
      return 'Lời nhắn cần ít nhất 2 ký tự.'
    }
    if (trimmed.length > 1000) {
      return 'Lời nhắn tối đa 1000 ký tự.'
    }
    return ''
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessageTouched(true)

    const mErr = validateMessage(message)
    setMessageError(mErr)

    if (mErr) {
      messageInputRef.current?.focus()
      return
    }

    setSubmitting(true)
    setSubmitFeedback(null)

    const result = await submitGuestMessage({
      invite_slug: inviteSlug,
      guest_name: mode === 'personal' ? undefined : senderName,
      message,
    })

    setSubmitting(false)

    if (result.error) {
      setSubmitFeedback({ type: 'error', text: result.error })
      return
    }

    setMessage('')
    setMessageTouched(false)
    setMessageError('')
    setSubmitFeedback({
      type: 'success',
      text: `Đã gửi lời nhắn tới ${settings.host_name}.`,
    })
  }

  const displayGuestName =
    mode === 'public' ? settings.public_greeting.trim() || guestName : guestName
  const displayGreeting =
    mode === 'public'
      ? (customGreeting ?? settings.public_custom_greeting).trim()
      : customGreeting?.trim() || ''

  const hasDateOrTime =
    !settings.is_tba &&
    Boolean(settings.event_date.trim() || settings.event_time.trim())
  const hasLocation =
    !settings.is_tba &&
    Boolean(settings.location_name.trim() || settings.location_address.trim())
  const safeMapUrl = getSafeExternalUrl(settings.map_url)
  const hasPhone = Boolean(settings.contact_phone.trim())
  const hasParking = settings.parking_notes.length > 0

  const themeClass =
    settings.theme === 'classic-gold'
      ? 'theme-classic-gold'
      : settings.theme === 'hcmut-sky'
        ? 'theme-hcmut-sky'
        : 'theme-hcmut-navy'

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.closest('a, button')) return
    setFlipped((prev) => !prev)
  }

  return (
    <main className={`invite-shell ${themeClass} ${isPreview ? 'is-preview' : ''}`}>
      {!isPreview && <DesktopMascots />}
      <div
        className={`flip-card ${flipped ? 'flipped' : ''}`}
        onClick={handleCardClick}
      >
        <div className="flip-card-inner">
          {/* MẶT TRƯỚC */}
          <section
            className="flip-card-front"
            aria-label="Mặt trước thiệp mời"
            aria-hidden={flipped}
            inert={flipped || undefined}
          >
            <header className="hcmut-banner">
              <div className="hcmut-banner-badge">
                <Image
                  src="/hcmut-logo.png"
                  alt=""
                  aria-hidden="true"
                  width={40}
                  height={40}
                />
              </div>
              <div className="hcmut-banner-text">
                <span className="hcmut-uni">ĐẠI HỌC QUỐC GIA TP. HỒ CHÍ MINH</span>
                <span className="hcmut-sub">TRƯỜNG ĐẠI HỌC BÁCH KHOA</span>
              </div>
            </header>

            <div className="front-body">
              <Image
                src="/hcmut-logo.png"
                alt="Logo Trường Đại học Bách Khoa"
                width={128}
                height={128}
                priority
                className="front-crest"
              />

              <div className="front-title-group">
                <p className="front-event-title">{settings.event_title}</p>
                {settings.quote.trim() && (
                  <p className="front-quote">{settings.quote}</p>
                )}
              </div>

              <div className="guest-box">
                <p className="front-salutation">Thân mời</p>
                {isPreview ? (
                  <h2
                    className={`front-guest-name ${mode === 'public' ? 'front-guest-name-public' : ''}`}
                  >
                    {displayGuestName}
                  </h2>
                ) : (
                  <h1
                    className={`front-guest-name ${mode === 'public' ? 'front-guest-name-public' : ''}`}
                  >
                    {displayGuestName}
                  </h1>
                )}
                <p className="front-invite-line">
                  {mode === 'public' ? (
                    'Đến chung vui cùng mình'
                  ) : (
                    <>
                      Đến chụp hình kỉ niệm cùng <strong>{settings.host_name}</strong>
                    </>
                  )}
                </p>
              </div>

              {displayGreeting && (
                <p className="front-custom-note">{displayGreeting}</p>
              )}

              <button
                type="button"
                className="card-flip-btn"
                onClick={() => setFlipped(true)}
              >
                Xem thời gian &amp; địa điểm
              </button>
            </div>
          </section>

          {/* MẶT SAU */}
          <section
            className="flip-card-back"
            aria-label="Chi tiết thời gian và địa điểm"
            aria-hidden={!flipped}
            inert={!flipped || undefined}
          >
            <header className="hcmut-banner hcmut-banner-back">
              <div className="hcmut-banner-left">
                <div className="hcmut-banner-badge">
                  <Image
                    src="/hcmut-logo.png"
                    alt=""
                    aria-hidden="true"
                    width={40}
                    height={40}
                  />
                </div>
                <div className="hcmut-banner-text">
                  <span className="hcmut-uni">Thời gian &amp; Địa điểm</span>
                  <span className="hcmut-sub">{settings.event_title}</span>
                </div>
              </div>
              <button
                type="button"
                className="banner-back-btn"
                onClick={() => setFlipped(false)}
              >
                Quay lại
              </button>
            </header>

            <div className="back-body">
              {settings.is_tba && (
                <div className="tba-banner" role="note">
                  Thời gian và địa điểm cụ thể sẽ được cập nhật tại đây.
                </div>
              )}

              <div className="info-blocks">
                <div className="info-blocks-2col">
                  <div className="info-box">
                    <div className="info-box-label">Thời gian</div>
                    {hasDateOrTime ? (
                      <>
                        {settings.event_time && (
                          <p className="info-box-value tabular-nums">
                            {settings.event_time}
                          </p>
                        )}
                        {settings.event_date && (
                          <p className="info-box-sub tabular-nums">
                            {settings.event_date}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="info-tba-pill">Đang cập nhật</p>
                    )}
                  </div>

                  <div className="info-box">
                    <div className="info-box-label">Liên hệ</div>
                    {hasPhone ? (
                      <p className="info-box-value tabular-nums">
                        {settings.contact_phone}
                      </p>
                    ) : (
                      <p className="info-box-sub">Đang cập nhật</p>
                    )}
                    <p className="info-box-sub">
                      {settings.host_name.trim() === 'Thịnh' ||
                      !settings.host_name.trim()
                        ? 'Tăng Phồn Thịnh'
                        : settings.host_name}
                    </p>
                  </div>
                </div>

                <div className="info-box">
                  <div className="info-box-label">Địa điểm</div>
                  {hasLocation ? (
                    <>
                      {settings.location_name && (
                        <p className="info-box-value">{settings.location_name}</p>
                      )}
                      {settings.location_address && (
                        <p className="info-box-sub">{settings.location_address}</p>
                      )}
                      {safeMapUrl && (
                        <a
                          href={safeMapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="map-link"
                        >
                          Xem bản đồ
                        </a>
                      )}
                    </>
                  ) : (
                    <p className="info-tba-pill">Đang cập nhật</p>
                  )}
                </div>

                <div className="info-box">
                  <div className="info-box-label">Gửi xe</div>
                  {hasParking ? (
                    <ul className="parking-list">
                      {settings.parking_notes.map((note, idx) => (
                        <li key={`${idx}-${note}`}>{note}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="info-box-sub">Đang cập nhật</p>
                  )}
                </div>
              </div>

              <div className="back-closing">
                {settings.closing_message.trim() && (
                  <p className="back-closing-text">{settings.closing_message}</p>
                )}
                <button
                  type="button"
                  className="back-cta-message"
                  onClick={openMessageDialog}
                >
                  Nếu không đến được thì bạn có thể để lại một lời nhắn nhé hehe
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Thanh điều khiển tối giản ở vùng bấm ngón cái */}
      <div
        className={`card-dock ${isPreview ? '' : 'sticky-mobile'}`}
        role="group"
        aria-label="Điều khiển thiệp mời"
      >
        <button
          type="button"
          className="dock-btn dock-btn-accent"
          onClick={openMessageDialog}
        >
          Gửi lời nhắn
        </button>
      </div>

      {/* Hộp thoại gửi lời nhắn */}
      <dialog
        ref={dialogRef}
        aria-labelledby={dialogTitleId}
        className="message-dialog"
        {...({ closedby: 'any' } as Record<string, string>)}
      >
        <div className="dialog-inner">
          <div className="dialog-header">
            <h2 id={dialogTitleId} className="dialog-title">
              Gửi lời nhắn
            </h2>
            <button
              type="button"
              className="dialog-close-btn"
              onClick={closeMessageDialog}
              aria-label="Đóng hộp thoại"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {mode === 'personal' ? (
              <p className="dialog-sender-note">
                Người gửi: <strong>{guestName}</strong>
              </p>
            ) : (
              <div className="dialog-form-field">
                <label htmlFor={nameInputId}>Tên của bạn (không bắt buộc)</label>
                <input
                  id={nameInputId}
                  name="guest_name"
                  type="text"
                  autoComplete="name"
                  maxLength={100}
                  placeholder="Để trống nếu không muốn ghi tên"
                  value={senderName}
                  onChange={(e) => setCustomSenderName(e.target.value)}
                />
              </div>
            )}

            <div className="dialog-form-field">
              <label htmlFor={msgInputId}>Lời nhắn</label>
              <textarea
                ref={messageInputRef}
                id={msgInputId}
                name="message"
                required
                minLength={2}
                maxLength={1000}
                placeholder="Lời chúc hoặc ghi chú của bạn..."
                value={message}
                aria-invalid={
                  messageTouched && Boolean(messageError) ? 'true' : undefined
                }
                aria-describedby={
                  messageError ? `${msgHintId} ${msgErrorId}` : msgHintId
                }
                onChange={(e) => {
                  const val = e.target.value
                  setMessage(val)
                  if (messageError) {
                    setMessageError(validateMessage(val))
                  }
                }}
                onBlur={() => {
                  setMessageTouched(true)
                  setMessageError(validateMessage(message))
                }}
              />
              <span id={msgHintId} className="field-hint tabular-nums">
                {message.length}/1000
              </span>
              {messageTouched && messageError && (
                <span id={msgErrorId} className="field-error">
                  {messageError}
                </span>
              )}
            </div>

            <div
              role="status"
              aria-live="polite"
              className={
                submitFeedback
                  ? submitFeedback.type === 'success'
                    ? 'form-status form-status-success'
                    : 'form-status form-status-error'
                  : 'form-status'
              }
            >
              {submitFeedback?.text}
            </div>

            <div className="dialog-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={closeMessageDialog}
              >
                Đóng
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Đang gửi...' : 'Gửi'}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </main>
  )
}
