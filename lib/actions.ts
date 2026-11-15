'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import {
  AttendanceStatus,
  EventSettings,
  findInviteBySlug,
  insertBulkInvites,
  insertGuestMessage,
  insertInvite,
  readEventSettings,
  readGuestMessages,
  readInvites,
  removeGuestMessage,
  removeInvite,
  saveEventSettings,
} from '@/lib/storage'
import { ADMIN_SECRET_PATH, extractSenderHeaderInfo } from '@/lib/utils'

export async function getInvites() {
  return readInvites()
}

export async function getInviteBySlug(slug: string) {
  return findInviteBySlug(slug)
}

export async function createInvite(name: string, customGreeting?: string) {
  if (!name || name.trim() === '') {
    return { error: 'Tên khách mời không được để trống' }
  }

  try {
    const data = await insertInvite(name, customGreeting)
    revalidatePath(ADMIN_SECRET_PATH)
    revalidatePath(`/invite/${data.slug}`)
    return { success: true, data }
  } catch (error) {
    console.error('Error creating invite:', error)
    return { error: 'Không thể tạo thư mời' }
  }
}

export async function createBulkInvites(namesText: string) {
  const names = namesText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (names.length === 0) {
    return { error: 'Vui lòng nhập ít nhất một tên khách mời (mỗi dòng 1 tên)' }
  }

  try {
    const created = await insertBulkInvites(names)
    revalidatePath(ADMIN_SECRET_PATH)
    return { success: true, count: created.length, data: created }
  } catch (error) {
    console.error('Error creating bulk invites:', error)
    return { error: 'Không thể tạo danh sách thư mời hàng loạt' }
  }
}

export async function deleteInvite(id: string) {
  try {
    await removeInvite(id)
    revalidatePath(ADMIN_SECRET_PATH)
    return { success: true }
  } catch (error) {
    console.error('Error deleting invite:', error)
    return { error: 'Không thể xoá thư mời' }
  }
}

export async function getEventSettings() {
  return readEventSettings()
}

export async function updateEventSettings(settings: Partial<EventSettings>) {
  try {
    const data = await saveEventSettings(settings)
    revalidatePath('/')
    revalidatePath('/invite')
    revalidatePath('/invite/[slug]', 'page')
    revalidatePath(ADMIN_SECRET_PATH)
    return { success: true, data }
  } catch (error) {
    console.error('Error updating event settings:', error)
    return { error: 'Không thể lưu thông tin sự kiện' }
  }
}

export async function submitGuestMessage(payload: {
  invite_slug: string
  guest_name?: string
  attendance?: AttendanceStatus
  message: string
}) {
  const message = payload.message?.trim() || ''

  if (message.length < 2) {
    return { error: 'Nội dung lời nhắn cần có ít nhất 2 ký tự' }
  }
  if (message.length > 1000) {
    return { error: 'Nội dung lời nhắn tối đa 1000 ký tự' }
  }

  const token = payload.invite_slug?.trim() || 'chung'
  const isPublic = token === 'chung' || token === 'public'

  let guestName = 'Ẩn danh'
  if (isPublic) {
    guestName = payload.guest_name?.trim() || 'Ẩn danh'
  } else {
    const invite = await findInviteBySlug(token)
    if (!invite) {
      return { error: 'Token thiệp mời không hợp lệ' }
    }
    guestName = invite.guest_name
  }

  const allowedAttendance: AttendanceStatus[] = ['attending', 'maybe', 'declined']
  const attendance: AttendanceStatus | undefined =
    payload.attendance && allowedAttendance.includes(payload.attendance)
      ? payload.attendance
      : undefined

  try {
    const reqHeaders = await headers()
    const headerInfo = extractSenderHeaderInfo(reqHeaders)

    const data = await insertGuestMessage({
      invite_slug: isPublic ? 'chung' : token,
      guest_name: guestName,
      ...(attendance ? { attendance } : {}),
      message,
      header_info: headerInfo,
    })
    revalidatePath(ADMIN_SECRET_PATH)
    return { success: true, data }
  } catch (error) {
    console.error('Error submitting guest message:', error)
    return { error: 'Không thể gửi lời nhắn lúc này, vui lòng thử lại!' }
  }
}

export async function getGuestMessages() {
  return readGuestMessages()
}

export async function deleteGuestMessage(id: string) {
  try {
    await removeGuestMessage(id)
    revalidatePath(ADMIN_SECRET_PATH)
    return { success: true }
  } catch (error) {
    console.error('Error deleting guest message:', error)
    return { error: 'Không thể xoá lời nhắn' }
  }
}
