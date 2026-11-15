import type { Metadata } from 'next'
import { getEventSettings, getInviteBySlug } from '@/lib/actions'
import InviteClientLoader from './InviteClientLoader'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

function isPublicSlug(slug: string): boolean {
  return slug === 'chung' || slug === 'public'
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const settings = await getEventSettings()

  let guestName = ''
  if (isPublicSlug(slug)) {
    guestName = settings.public_greeting.trim() || 'Anh, chị, em'
  } else {
    const invite = await getInviteBySlug(slug)
    guestName = invite?.guest_name || ''
  }

  if (!guestName) {
    return {
      title: 'Thiệp mời không hợp lệ',
    }
  }

  const title = `Thân mời ${guestName} — ${settings.event_title}`
  const description =
    !settings.is_tba && (settings.event_date || settings.location_name)
      ? `${settings.event_time ? `${settings.event_time} ` : ''}${settings.event_date}${settings.location_name ? ` — ${settings.location_name}` : ''}`.trim()
      : `${settings.event_title} cùng ${settings.host_name}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ['/hcmut-logo.png'],
    },
  }
}

export default async function InvitePage({ params }: PageProps) {
  const { slug } = await params
  return <InviteClientLoader token={slug} />
}
