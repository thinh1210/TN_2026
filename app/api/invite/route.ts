import { NextRequest, NextResponse } from 'next/server'
import { findInviteBySlug, readEventSettings } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim() || ''

  if (!token) {
    return NextResponse.json(
      { valid: false, error: 'Thiếu mã token thiệp mời.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  if (token === 'chung' || token === 'public') {
    const settings = await readEventSettings()
    return NextResponse.json(
      {
        valid: true,
        mode: 'public' as const,
        inviteSlug: 'chung',
        guestName: settings.public_greeting.trim() || 'Anh, chị, em',
        customGreeting: settings.public_custom_greeting,
        settings,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const invite = await findInviteBySlug(token)
  if (!invite) {
    return NextResponse.json(
      { valid: false, error: 'Token thiệp mời không hợp lệ hoặc không tồn tại.' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const settings = await readEventSettings()
  return NextResponse.json(
    {
      valid: true,
      mode: 'personal' as const,
      inviteSlug: invite.slug,
      guestName: invite.guest_name,
      customGreeting: invite.custom_greeting,
      settings,
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  )
}
