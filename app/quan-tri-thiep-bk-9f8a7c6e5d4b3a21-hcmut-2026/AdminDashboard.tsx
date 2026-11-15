'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import {
  createBulkInvites,
  createInvite,
  deleteGuestMessage,
  deleteInvite,
  updateEventSettings,
} from '@/lib/actions'
import { logout } from '@/lib/auth'
import type { EventSettings, GuestMessage, Invitation, ThemeId } from '@/lib/storage'
import { formatDateTimeVN } from '@/lib/utils'
import './admin.css'

interface AdminDashboardProps {
  initialInvites: Invitation[]
  initialSettings: EventSettings
  initialMessages: GuestMessage[]
}

type TabKey = 'invites' | 'settings' | 'messages'

type ConfirmTarget =
  | { kind: 'invite'; id: string; label: string }
  | { kind: 'message'; id: string; label: string }
  | null

const subscribeNoop = () => () => {}

export default function AdminDashboard({
  initialInvites,
  initialSettings,
  initialMessages,
}: AdminDashboardProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('invites')
  const origin = useSyncExternalStore(
    subscribeNoop,
    () => window.location.origin,
    () => ''
  )
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Thiệp chung (Đăng mạng xã hội)
  const [publicGreeting, setPublicGreeting] = useState(
    initialSettings.public_greeting
  )
  const [publicCustomGreeting, setPublicCustomGreeting] = useState(
    initialSettings.public_custom_greeting
  )
  const [savingPublic, setSavingPublic] = useState(false)

  // Cơ chế 1: Thiệp mời cá nhân theo tên
  const [guestName, setGuestName] = useState('')
  const [customGreeting, setCustomGreeting] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [creatingSingle, setCreatingSingle] = useState(false)
  const [creatingBulk, setCreatingBulk] = useState(false)

  // Cơ chế 2: Ngày & Địa điểm (Fill sau)
  const [hostName, setHostName] = useState(initialSettings.host_name)
  const [eventTitle, setEventTitle] = useState(initialSettings.event_title)
  const [quote, setQuote] = useState(initialSettings.quote)
  const [isTba, setIsTba] = useState(initialSettings.is_tba)
  const [eventDate, setEventDate] = useState(initialSettings.event_date)
  const [eventTime, setEventTime] = useState(initialSettings.event_time)
  const [locationName, setLocationName] = useState(initialSettings.location_name)
  const [locationAddress, setLocationAddress] = useState(
    initialSettings.location_address
  )
  const [mapUrl, setMapUrl] = useState(initialSettings.map_url)
  const [contactPhone, setContactPhone] = useState(initialSettings.contact_phone)
  const [parkingText, setParkingText] = useState(
    initialSettings.parking_notes.join('\n')
  )
  const [closingMessage, setClosingMessage] = useState(
    initialSettings.closing_message
  )
  const [theme, setTheme] = useState<ThemeId>(initialSettings.theme)
  const [savingSettings, setSavingSettings] = useState(false)

  // Delete confirm modal state
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null)
  const [deleting, setDeleting] = useState(false)
  const confirmDialogRef = useRef<HTMLDialogElement>(null)
  const cancelBtnRef = useRef<HTMLButtonElement>(null)
  const confirmTitleId = useId()

  useEffect(() => {
    const dialog = confirmDialogRef.current
    if (!dialog) return

    const onClose = () => {
      dialog.returnValue = ''
      setConfirmTarget(null)
    }
    dialog.addEventListener('close', onClose)

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
        if (pressedOutside && isOutside(e)) dialog.close()
        pressedOutside = false
      }
      dialog.addEventListener('pointerdown', onPointerDown)
      dialog.addEventListener('pointerup', onPointerUp)
      return () => {
        dialog.removeEventListener('close', onClose)
        dialog.removeEventListener('pointerdown', onPointerDown)
        dialog.removeEventListener('pointerup', onPointerUp)
      }
    }

    return () => {
      dialog.removeEventListener('close', onClose)
    }
  }, [])

  const openConfirmDelete = (target: ConfirmTarget) => {
    setConfirmTarget(target)
    confirmDialogRef.current?.showModal()
    cancelBtnRef.current?.focus()
  }

  const handleConfirmDelete = async () => {
    const target = confirmTarget
    if (!target) return
    setDeleting(true)
    const res =
      target.kind === 'invite'
        ? await deleteInvite(target.id)
        : await deleteGuestMessage(target.id)
    setDeleting(false)
    confirmDialogRef.current?.close()

    if (res.error) {
      setNotice({ type: 'error', text: res.error })
    } else {
      setNotice({
        type: 'success',
        text:
          target.kind === 'invite'
            ? `Đã xoá thiệp của ${target.label}.`
            : `Đã xoá lời nhắn từ ${target.label}.`,
      })
      router.refresh()
    }
  }

  const handleCopyText = async (key: string, url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(key)
      setNotice({
        type: 'success',
        text: `Đã copy link ${label}: ${url}`,
      })
      setTimeout(() => {
        setCopiedId((curr) => (curr === key ? null : curr))
      }, 2200)
    } catch {
      setNotice({
        type: 'error',
        text: `Không thể truy cập clipboard. Đường dẫn: ${url}`,
      })
    }
  }

  const handleSavePublicInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSavingPublic(true)
    setNotice(null)

    const res = await updateEventSettings({
      public_greeting: publicGreeting.trim() || 'Anh, chị, em',
      public_custom_greeting: publicCustomGreeting.trim(),
    })

    setSavingPublic(false)
    if (res.error) {
      setNotice({ type: 'error', text: res.error })
    } else {
      setNotice({
        type: 'success',
        text: 'Đã cập nhật nội dung thiệp mời chung.',
      })
      router.refresh()
    }
  }

  const handleCreateSingle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!guestName.trim()) {
      setNotice({ type: 'error', text: 'Vui lòng nhập tên khách mời.' })
      return
    }
    setCreatingSingle(true)
    setNotice(null)
    const res = await createInvite(guestName, customGreeting)
    setCreatingSingle(false)
    if (res.error) {
      setNotice({ type: 'error', text: res.error })
    } else {
      setGuestName('')
      setCustomGreeting('')
      setNotice({
        type: 'success',
        text: `Đã tạo thiệp & token cho ${res.data?.guest_name} (/invite/${res.data?.slug}).`,
      })
      router.refresh()
    }
  }

  const handleCreateBulk = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!bulkText.trim()) {
      setNotice({
        type: 'error',
        text: 'Vui lòng nhập ít nhất một tên khách mời.',
      })
      return
    }
    setCreatingBulk(true)
    setNotice(null)
    const res = await createBulkInvites(bulkText)
    setCreatingBulk(false)
    if (res.error) {
      setNotice({ type: 'error', text: res.error })
    } else {
      setBulkText('')
      setNotice({
        type: 'success',
        text: `Đã tạo ${res.count} đường dẫn thiệp mời.`,
      })
      router.refresh()
    }
  }

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSavingSettings(true)
    setNotice(null)

    const parkingNotes = parkingText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)

    const res = await updateEventSettings({
      host_name: hostName.trim() || 'Thịnh',
      event_title: eventTitle.trim() || 'Lễ Tốt Nghiệp',
      quote: quote.trim(),
      public_greeting: publicGreeting.trim() || 'Anh, chị, em',
      public_custom_greeting: publicCustomGreeting.trim(),
      is_tba: isTba,
      event_date: eventDate.trim(),
      event_time: eventTime.trim(),
      location_name: locationName.trim(),
      location_address: locationAddress.trim(),
      map_url: mapUrl.trim(),
      contact_phone: contactPhone.trim(),
      parking_notes: parkingNotes,
      closing_message: closingMessage.trim(),
      theme,
    })

    setSavingSettings(false)
    if (res.error) {
      setNotice({ type: 'error', text: res.error })
    } else {
      setNotice({
        type: 'success',
        text: isTba
          ? 'Đã lưu cài đặt (chế độ chờ fill sau).'
          : 'Đã cập nhật lịch trình và địa điểm cho tất cả thiệp.',
      })
      router.refresh()
    }
  }

  const publicInviteUrl = origin ? `${origin}/invite` : '/invite'

  return (
    <main className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <div className="admin-brand">
            <div className="admin-brand-badge">
              <Image
                src="/hcmut-logo.png"
                alt="Logo Trường Đại học Bách Khoa"
                width={40}
                height={40}
              />
            </div>
            <div>
              <h1>Quản trị Thiệp Mời</h1>
              <p>Trường Đại học Bách Khoa — ĐHQG-HCM</p>
            </div>
          </div>
          <div className="admin-header-actions">
            <Link href="/invite" className="btn btn-header" target="_blank">
              Thiệp chung
            </Link>
            <button
              type="button"
              className="btn btn-header"
              onClick={async () => {
                await logout()
                router.refresh()
              }}
            >
              Đăng xuất
            </button>
          </div>
        </header>

        <div
          role="status"
          aria-live="polite"
          className={
            notice
              ? notice.type === 'success'
                ? 'status-banner status-success'
                : 'status-banner status-error'
              : undefined
          }
        >
          {notice?.text}
        </div>

        <nav className="admin-tabs" role="tablist" aria-label="Phân khu quản trị">
          <button
            type="button"
            role="tab"
            id="tab-invites"
            aria-selected={activeTab === 'invites'}
            aria-controls="panel-invites"
            className="admin-tab"
            onClick={() => setActiveTab('invites')}
          >
            <span>1. Danh sách thiệp</span>
            <span className="tab-badge tabular-nums">
              {initialInvites.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-settings"
            aria-selected={activeTab === 'settings'}
            aria-controls="panel-settings"
            className="admin-tab"
            onClick={() => setActiveTab('settings')}
          >
            <span>2. Ngày &amp; Địa điểm</span>
            <span className="tab-badge">{isTba ? 'Chờ fill' : 'Đã chốt'}</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-messages"
            aria-selected={activeTab === 'messages'}
            aria-controls="panel-messages"
            className="admin-tab"
            onClick={() => setActiveTab('messages')}
          >
            <span>3. Lời nhắn</span>
            <span className="tab-badge tabular-nums">
              {initialMessages.length}
            </span>
          </button>
        </nav>

        {/* PANEL 1: HAI LOẠI THIỆP (CHUNG MXH + CÁ NHÂN THEO TÊN) */}
        <section
          id="panel-invites"
          role="tabpanel"
          aria-labelledby="tab-invites"
          hidden={activeTab !== 'invites'}
          className="panel-stack"
        >
          {/* LOẠI 1 — THIỆP MỜI CHUNG (ĐĂNG MẠNG XÃ HỘI) */}
          <div className="admin-card public-invite-card">
            <div className="public-card-head">
              <div>
                <h2>Loại 1 — Thiệp mời chung (Đăng mạng xã hội)</h2>
                <p className="admin-card-desc">
                  Link công khai để đăng Facebook, Zalo mời mọi người. Người xem
                  có thể gửi lời nhắn không cần nhập tên.
                </p>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  className="btn btn-soft"
                  onClick={() =>
                    handleCopyText(
                      'public-invite',
                      publicInviteUrl,
                      'thiệp chung'
                    )
                  }
                >
                  {copiedId === 'public-invite' ? 'Đã copy' : 'Copy link'}
                </button>
                <Link
                  href="/invite"
                  target="_blank"
                  className="btn btn-outline"
                  style={{ minHeight: '40px', padding: '6px 12px' }}
                >
                  Mở thiệp
                </Link>
              </div>
            </div>

            <div className="public-link-bar">
              <span>Đường dẫn:</span>
              <code>{publicInviteUrl}</code>
            </div>

            <form onSubmit={handleSavePublicInvite} className="public-form">
              <div className="grid-2">
                <div className="form-field">
                  <label htmlFor="public-greeting">Lời chào chung</label>
                  <input
                    id="public-greeting"
                    name="public_greeting"
                    type="text"
                    required
                    placeholder="Ví dụ: Anh, chị, em"
                    value={publicGreeting}
                    onChange={(e) => setPublicGreeting(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="public-custom-greeting">
                    Lời nhắn mặt trước (tuỳ chọn)
                  </label>
                  <input
                    id="public-custom-greeting"
                    name="public_custom_greeting"
                    type="text"
                    placeholder="Ví dụ: Nếu bạn có thời gian rảnh thì hãy đến và chụp hình kỉ niệm với mình nhé (không cần mang quà)."
                    value={publicCustomGreeting}
                    onChange={(e) => setPublicCustomGreeting(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingPublic}
              >
                {savingPublic ? 'Đang lưu...' : 'Lưu nội dung thiệp chung'}
              </button>
            </form>
          </div>

          {/* LOẠI 2 — THIỆP MỜI CÁ NHÂN (ĐIỀN TÊN TỪNG KHÁCH) */}
          <div className="grid-2">
            <div className="admin-card">
              <h2>Loại 2 — Thiệp mời cá nhân (Sinh Token)</h2>
              <p className="admin-card-desc">
                Nhập tên để sinh mã token ngẫu nhiên (/invite/&lt;token&gt;). Khi
                khách gửi lời nhắn, hệ thống tự động lưu tên khách mời của token
                đó.
              </p>
              <form onSubmit={handleCreateSingle}>
                <div className="form-field">
                  <label htmlFor="single-guest-name">Tên khách mời</label>
                  <input
                    id="single-guest-name"
                    name="guest_name"
                    type="text"
                    required
                    placeholder="Ví dụ: Minh Anh"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="single-custom-greeting">
                    Lời nhắn riêng (tuỳ chọn)
                  </label>
                  <input
                    id="single-custom-greeting"
                    name="custom_greeting"
                    type="text"
                    placeholder="Ví dụ: Hẹn gặp bạn hôm đó nhé"
                    value={customGreeting}
                    onChange={(e) => setCustomGreeting(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creatingSingle}
                >
                  {creatingSingle ? 'Đang tạo...' : 'Tạo link thiệp'}
                </button>
              </form>
            </div>

            <div className="admin-card">
              <h2>Tạo nhanh hàng loạt</h2>
              <p className="admin-card-desc">
                Mỗi dòng một tên khách mời để tạo nhiều đường dẫn cùng lúc.
              </p>
              <form onSubmit={handleCreateBulk}>
                <div className="form-field">
                  <label htmlFor="bulk-guest-names">Danh sách tên</label>
                  <textarea
                    id="bulk-guest-names"
                    name="bulk_names"
                    rows={4}
                    placeholder={'Minh Anh\nQuốc Bảo\nThảo Vy'}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creatingBulk}
                >
                  {creatingBulk ? 'Đang tạo...' : 'Tạo hàng loạt'}
                </button>
              </form>
            </div>
          </div>

          <div className="admin-card">
            <div
              tabIndex={0}
              role="region"
              aria-labelledby="invites-table-caption"
              className="table-wrapper"
            >
              <table className="responsive-table invites-table">
                <caption id="invites-table-caption" className="tabular-nums">
                  Danh sách thiệp cá nhân ({initialInvites.length})
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Khách mời</th>
                    <th scope="col">Mã Token / Đường dẫn</th>
                    <th scope="col">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {initialInvites.map((invite) => {
                    const url = origin
                      ? `${origin}/invite/${invite.slug}`
                      : `/invite/${invite.slug}`

                    return (
                      <tr key={invite.id}>
                        <th scope="row">{invite.guest_name}</th>
                        <td>
                          <Link
                            href={`/invite/${invite.slug}`}
                            target="_blank"
                            className="invite-link-anchor"
                          >
                            {url}
                          </Link>
                          {invite.custom_greeting && (
                            <p className="invite-sub-greeting">
                              {invite.custom_greeting}
                            </p>
                          )}
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="btn btn-soft"
                              onClick={() =>
                                handleCopyText(invite.id, url, invite.guest_name)
                              }
                            >
                              {copiedId === invite.id ? 'Đã copy' : 'Copy link'}
                            </button>
                            <Link
                              href={`/invite/${invite.slug}`}
                              target="_blank"
                              className="btn btn-outline"
                              style={{
                                minHeight: '40px',
                                padding: '6px 12px',
                                fontSize: '0.84rem',
                              }}
                            >
                              Mở thiệp
                            </Link>
                            <button
                              type="button"
                              className="btn btn-danger-soft"
                              onClick={() =>
                                openConfirmDelete({
                                  kind: 'invite',
                                  id: invite.id,
                                  label: invite.guest_name,
                                })
                              }
                            >
                              Xoá
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {initialInvites.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        style={{ textAlign: 'center', padding: '24px' }}
                      >
                        Chưa có thiệp cá nhân nào. Hãy tạo link đầu tiên ở biểu
                        mẫu phía trên.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* PANEL 2: MECHANISM 2 - FILL LATER EVENT SETTINGS */}
        <section
          id="panel-settings"
          role="tabpanel"
          aria-labelledby="tab-settings"
          hidden={activeTab !== 'settings'}
          className="admin-card"
        >
          <h2>Ngày tháng &amp; Địa điểm</h2>
          <p className="admin-card-desc">
            Thông tin tại đây tự động áp dụng cho cả thiệp mời chung và tất cả
            thiệp cá nhân.
          </p>

          <form onSubmit={handleSaveSettings}>
            <div className="tba-toggle-box">
              <input
                type="checkbox"
                id="settings-is-tba"
                name="is_tba"
                checked={isTba}
                onChange={(e) => setIsTba(e.target.checked)}
              />
              <label htmlFor="settings-is-tba">
                Chế độ &ldquo;Fill sau&rdquo; (Đang chờ chốt lịch)
                <span className="tba-toggle-sub">
                  Khi bật, thiệp hiển thị trạng thái &ldquo;Đang cập nhật&rdquo;.
                  Bỏ chọn và lưu lại sau khi đã chốt thời gian và địa điểm.
                </span>
              </label>
            </div>

            <div className="grid-2">
              <div className="form-field">
                <label htmlFor="settings-host-name">Tên chủ thiệp</label>
                <input
                  id="settings-host-name"
                  name="host_name"
                  type="text"
                  required
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="settings-event-title">Tên sự kiện</label>
                <input
                  id="settings-event-title"
                  name="event_title"
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="settings-quote">Dòng phụ mặt trước (tuỳ chọn)</label>
              <textarea
                id="settings-quote"
                name="quote"
                rows={2}
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
              />
            </div>

            <div className="grid-2">
              <div className="form-field">
                <label htmlFor="settings-event-date">Ngày diễn ra</label>
                <input
                  id="settings-event-date"
                  name="event_date"
                  type="text"
                  placeholder="Ví dụ: Thứ Bảy, 20/06/2026"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="settings-event-time">Khung giờ</label>
                <input
                  id="settings-event-time"
                  name="event_time"
                  type="text"
                  placeholder="Ví dụ: 08:30 - 11:00"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-field">
                <label htmlFor="settings-location-name">Địa điểm</label>
                <input
                  id="settings-location-name"
                  name="location_name"
                  type="text"
                  placeholder="Ví dụ: Hội trường A5 — ĐH Bách Khoa"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="settings-contact-phone">Số điện thoại</label>
                <input
                  id="settings-contact-phone"
                  name="contact_phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Ví dụ: 0912 345 678"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="settings-location-address">Địa chỉ chi tiết</label>
              <input
                id="settings-location-address"
                name="location_address"
                type="text"
                placeholder="Ví dụ: 268 Lý Thường Kiệt, Quận 10, TP.HCM"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="settings-map-url">Link bản đồ (tuỳ chọn)</label>
              <input
                id="settings-map-url"
                name="map_url"
                type="url"
                placeholder="https://maps.google.com/?q=..."
                value={mapUrl}
                onChange={(e) => setMapUrl(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="settings-parking">
                Gửi xe / Cổng vào (mỗi dòng 1 ý)
              </label>
              <textarea
                id="settings-parking"
                name="parking_notes"
                rows={3}
                placeholder={'Cổng 268 Lý Thường Kiệt\nCổng Tô Hiến Thành'}
                value={parkingText}
                onChange={(e) => setParkingText(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="settings-closing">Lời kết mặt sau</label>
              <input
                id="settings-closing"
                name="closing_message"
                type="text"
                placeholder="Nếu có thời gian rảnh thì ghé chụp hình kỉ niệm với mình nhé (không cần mang quà)."
                value={closingMessage}
                onChange={(e) => setClosingMessage(e.target.value)}
              />
            </div>

            <fieldset className="theme-fieldset">
              <legend>Màu chủ đạo</legend>
              <div className="theme-options">
                <div className="theme-option">
                  <input
                    type="radio"
                    id="theme-navy"
                    name="theme"
                    value="hcmut-navy"
                    checked={theme === 'hcmut-navy'}
                    onChange={() => setTheme('hcmut-navy')}
                  />
                  <label htmlFor="theme-navy">Bách Khoa Navy (#030391)</label>
                </div>
                <div className="theme-option">
                  <input
                    type="radio"
                    id="theme-sky"
                    name="theme"
                    value="hcmut-sky"
                    checked={theme === 'hcmut-sky'}
                    onChange={() => setTheme('hcmut-sky')}
                  />
                  <label htmlFor="theme-sky">Bách Khoa Cyan (#1488D8)</label>
                </div>
                <div className="theme-option">
                  <input
                    type="radio"
                    id="theme-gold"
                    name="theme"
                    value="classic-gold"
                    checked={theme === 'classic-gold'}
                    onChange={() => setTheme('classic-gold')}
                  />
                  <label htmlFor="theme-gold">Navy &amp; Vàng Kim</label>
                </div>
              </div>
            </fieldset>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingSettings}
            >
              {savingSettings ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </form>
        </section>

        {/* PANEL 3: GUEST MESSAGES + EXTRACTED HTTP HEADER INFO */}
        <section
          id="panel-messages"
          role="tabpanel"
          aria-labelledby="tab-messages"
          hidden={activeTab !== 'messages'}
          className="admin-card"
        >
          <h2>Lời nhắn &amp; Thông tin Header</h2>
          <p className="admin-card-desc">
            Thiệp cá nhân tự động lưu tên khách mời theo token; thiệp chung lưu
            tên tuỳ chọn kèm thiết bị, Header và thời gian gửi.
          </p>

          <div
            tabIndex={0}
            role="region"
            aria-labelledby="messages-table-caption"
            className="table-wrapper"
          >
            <table className="responsive-table messages-table">
              <caption id="messages-table-caption" className="tabular-nums">
                Danh sách lời nhắn ({initialMessages.length})
              </caption>
              <thead>
                <tr>
                  <th scope="col">Người gửi</th>
                  <th scope="col">Lời nhắn</th>
                  <th scope="col">Thiết bị &amp; Header</th>
                  <th scope="col">Thời gian gửi</th>
                  <th scope="col">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {initialMessages.map((msg) => {
                  const hdr = msg.header_info
                  const isPublicMsg =
                    msg.invite_slug === 'chung' || msg.invite_slug === 'public'

                  return (
                    <tr key={msg.id}>
                      <th scope="row">
                        {msg.guest_name}
                        <div className="invite-sub-greeting">
                          {isPublicMsg ? (
                            <span>Thiệp chung (/invite)</span>
                          ) : (
                            <code>/invite/{msg.invite_slug}</code>
                          )}
                        </div>
                      </th>
                      <td style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</td>
                      <td>
                        {hdr ? (
                          <div className="header-meta-list">
                            <span className="header-chip">{hdr.os_device}</span>
                            <span>
                              <strong>Trình duyệt:</strong> {hdr.browser_app}
                            </span>
                            <span>
                              <strong>IP:</strong>{' '}
                              <code className="tabular-nums">{hdr.ip}</code>
                            </span>
                            <span>
                              <strong>Ngôn ngữ:</strong> {hdr.language}
                            </span>
                            {(hdr.geo_location || hdr.timezone) && (
                              <span>
                                <strong>Khu vực:</strong>{' '}
                                {[hdr.geo_location, hdr.timezone]
                                  .filter(Boolean)
                                  .join(' — ')}
                              </span>
                            )}
                            <details className="header-ua-details">
                              <summary>Chi tiết UA &amp; Nguồn</summary>
                              <div className="header-ua-box">
                                <div>
                                  <strong>Referer:</strong> {hdr.referer}
                                </div>
                                <div>
                                  <strong>User-Agent:</strong>{' '}
                                  {hdr.raw_user_agent}
                                </div>
                              </div>
                            </details>
                          </div>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.82rem' }}>
                            Không có dữ liệu
                          </span>
                        )}
                      </td>
                      <td
                        className="tabular-nums"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {formatDateTimeVN(msg.created_at)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger-soft"
                          onClick={() =>
                            openConfirmDelete({
                              kind: 'message',
                              id: msg.id,
                              label: msg.guest_name,
                            })
                          }
                        >
                          Xoá
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {initialMessages.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ textAlign: 'center', padding: '24px' }}
                    >
                      Chưa có lời nhắn nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Confirmation dialog */}
      <dialog
        ref={confirmDialogRef}
        aria-labelledby={confirmTitleId}
        className="confirm-dialog"
        {...({ closedby: 'any' } as Record<string, string>)}
      >
        <h2 id={confirmTitleId}>Xác nhận xoá</h2>
        <p>
          Xoá{' '}
          {confirmTarget?.kind === 'invite'
            ? 'link thiệp mời của '
            : 'lời nhắn từ '}
          <strong>{confirmTarget?.label}</strong>? Thao tác này không thể hoàn
          tác.
        </p>
        <div className="confirm-actions">
          <button
            ref={cancelBtnRef}
            type="button"
            className="btn btn-outline"
            onClick={() => confirmDialogRef.current?.close()}
          >
            Huỷ
          </button>
          <button
            type="button"
            className="btn btn-danger-soft"
            disabled={deleting}
            onClick={handleConfirmDelete}
          >
            {deleting ? 'Đang xoá...' : 'Xoá'}
          </button>
        </div>
      </dialog>
    </main>
  )
}
