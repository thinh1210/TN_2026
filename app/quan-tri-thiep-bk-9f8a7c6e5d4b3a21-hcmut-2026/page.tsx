import { getEventSettings, getGuestMessages, getInvites } from '@/lib/actions'
import { isAuthenticated } from '@/lib/auth'
import AdminDashboard from './AdminDashboard'
import LoginForm from './LoginForm'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const isAuth = await isAuthenticated()

  if (!isAuth) {
    return <LoginForm />
  }

  const [invites, settings, messages] = await Promise.all([
    getInvites(),
    getEventSettings(),
    getGuestMessages(),
  ])

  return (
    <AdminDashboard
      initialInvites={invites}
      initialSettings={settings}
      initialMessages={messages}
    />
  )
}
