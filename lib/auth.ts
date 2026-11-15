'use server'

import { cookies } from 'next/headers'

const AUTH_COOKIE = 'admin_auth'

export async function login(password: string) {
  const adminPassword = process.env.ADMIN_PASSWORD || '123456'
  if (password === adminPassword) {
    const cookieStore = await cookies()
    cookieStore.set(AUTH_COOKIE, 'true', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    })
    return { success: true }
  }
  return { error: 'Sai mật khẩu quản trị' }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE)
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get(AUTH_COOKIE)
  return authCookie?.value === 'true'
}
