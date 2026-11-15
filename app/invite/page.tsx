import type { Metadata } from 'next'
import { getEventSettings } from '@/lib/actions'
import InviteClientLoader from './[slug]/InviteClientLoader'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getEventSettings()
  const greeting = settings.public_greeting.trim() || 'Anh, chị, em'
  const title = `Thân mời ${greeting} — ${settings.event_title}`
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

export default function PublicInvitePage() {
  return <InviteClientLoader token="chung" />
}
