import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { SenderHeaderInfo } from '@/lib/utils'

export type ThemeId = 'hcmut-navy' | 'hcmut-sky' | 'classic-gold'
export type AttendanceStatus = 'attending' | 'maybe' | 'declined'

export interface Invitation {
  id: string
  guest_name: string
  slug: string
  custom_greeting?: string
  created_at: string
}

export interface EventSettings {
  host_name: string
  event_title: string
  quote: string
  public_greeting: string
  public_custom_greeting: string
  is_tba: boolean
  event_date: string
  event_time: string
  location_name: string
  location_address: string
  map_url: string
  contact_phone: string
  parking_notes: string[]
  closing_message: string
  theme: ThemeId
  updated_at: string
}

export interface GuestMessage {
  id: string
  invite_slug: string
  guest_name: string
  attendance?: AttendanceStatus
  message: string
  header_info?: SenderHeaderInfo
  created_at: string
}

interface DatabaseSchema {
  invitations: Invitation[]
  event_settings: EventSettings
  guest_messages: GuestMessage[]
}

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DATA_DIR, 'db.json')

const DEFAULT_SETTINGS: EventSettings = {
  host_name: 'Thịnh',
  event_title: 'Lễ Tốt Nghiệp',
  quote: 'Trường Đại học Bách Khoa — ĐHQG-HCM',
  public_greeting: 'Anh, chị, em',
  public_custom_greeting:
    'Nếu bạn có thời gian rảnh thì hãy đến và chụp hình kỉ niệm với mình nhé (không cần mang quà).',
  is_tba: false,
  event_date: 'Thứ 7 28/11/2026',
  event_time: '10h-14h',
  location_name:
    'Đh Bách Khoa thành phố Hồ Chí Minh. Tòa nhà A3 (Tòa nhà khoa máy tính)/Thư viện trường',
  location_address: '268 Lý Thường Kiệt, Quận 10, TP HCM (BK cs1)',
  map_url: 'https://maps.app.goo.gl/G5yWSnQSaWhiwbSF6',
  contact_phone: '0372904909',
  parking_notes: [
    'Cổng 1, Cổng 3 BK',
    'Rạp xiếc Phú Thọ :)))',
    'Mn đi có thể tham khảo chỗ gửi xe trước vì có thể khá đông',
  ],
  closing_message:
    'Nếu có thời gian rảnh thì ghé chụp hình kỉ niệm với mình nhé. Liên hệ mình trước nhe (không cần mang quà).',
  theme: 'hcmut-sky',
  updated_at: new Date().toISOString(),
}

function normalizeTheme(theme?: string): ThemeId {
  if (theme === 'hcmut-sky' || theme === 'pastel-rose') return 'hcmut-sky'
  if (theme === 'classic-gold') return 'classic-gold'
  return 'hcmut-navy'
}

const SEED_DEMO_TOKEN = 'tk-9f4a2c8e1b7d6035a2e4c9f8'

export function generateInviteToken(): string {
  return crypto.randomBytes(12).toString('hex')
}

function createDefaultDb(): DatabaseSchema {
  const now = new Date().toISOString()
  return {
    invitations: [
      {
        id: 'seed-demo-1',
        guest_name: 'Khách Mời Mẫu',
        slug: SEED_DEMO_TOKEN,
        custom_greeting:
          'Nếu bạn có thời gian rảnh thì hãy đến và chụp hình kỉ niệm với mình nhé (không cần mang quà).',
        created_at: now,
      },
    ],
    event_settings: {
      ...DEFAULT_SETTINGS,
      updated_at: now,
    },
    guest_messages: [],
  }
}

let writeQueue: Promise<unknown> = Promise.resolve()

async function ensureLocalDb(): Promise<DatabaseSchema> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    const raw = await fs.readFile(DB_PATH, 'utf8')
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>
    const rawInvites = Array.isArray(parsed.invitations) ? parsed.invitations : []
    const invitations = rawInvites.map((inv) =>
      inv.id === 'seed-demo-1' && inv.slug === 'khach-moi-mau'
        ? { ...inv, slug: SEED_DEMO_TOKEN }
        : inv
    )
    return {
      invitations,
      event_settings: {
        ...DEFAULT_SETTINGS,
        ...(parsed.event_settings || {}),
        theme: normalizeTheme(parsed.event_settings?.theme),
        parking_notes: Array.isArray(parsed.event_settings?.parking_notes)
          ? parsed.event_settings.parking_notes
          : [],
      },
      guest_messages: Array.isArray(parsed.guest_messages)
        ? parsed.guest_messages
        : [],
    }
  } catch {
    const seed = createDefaultDb()
    await fs.writeFile(DB_PATH, JSON.stringify(seed, null, 2), 'utf8')
    return seed
  }
}

async function mutateLocalDb<T>(
  mutator: (db: DatabaseSchema) => Promise<T> | T
): Promise<T> {
  const task = writeQueue.then(async () => {
    const db = await ensureLocalDb()
    const result = await mutator(db)
    const tmpPath = `${DB_PATH}.tmp-${crypto.randomUUID()}`
    await fs.writeFile(tmpPath, JSON.stringify(db, null, 2), 'utf8')
    await fs.rename(tmpPath, DB_PATH)
    return result
  })
  writeQueue = task.catch(() => undefined)
  return task
}

export async function readInvites(): Promise<Invitation[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && Array.isArray(data)) {
        return data as Invitation[]
      }
    } catch {
      // Fallback to local JSON store
    }
  }
  const db = await ensureLocalDb()
  return [...db.invitations].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export async function findInviteBySlug(slug: string): Promise<Invitation | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()
      if (!error) {
        return (data as Invitation | null) ?? null
      }
    } catch {
      // Fallback to local JSON store
    }
  }
  const db = await ensureLocalDb()
  return db.invitations.find((inv) => inv.slug === slug) ?? null
}

function resolveUniqueToken(existingTokens: Set<string>): string {
  let token = generateInviteToken()
  while (existingTokens.has(token)) {
    token = generateInviteToken()
  }
  existingTokens.add(token)
  return token
}

export async function insertInvite(
  guestName: string,
  customGreeting?: string
): Promise<Invitation> {
  const cleanName = guestName.trim()
  const cleanGreeting = customGreeting?.trim() || undefined

  if (isSupabaseConfigured && supabase) {
    try {
      let token = generateInviteToken()
      while (true) {
        const { data: existing, error: lookupError } = await supabase
          .from('invitations')
          .select('id')
          .eq('slug', token)
          .maybeSingle()
        if (lookupError) throw lookupError
        if (!existing) break
        token = generateInviteToken()
      }

      const payload: Record<string, string> = {
        guest_name: cleanName,
        slug: token,
      }
      if (cleanGreeting) payload.custom_greeting = cleanGreeting

      const { data, error } = await supabase
        .from('invitations')
        .insert([payload])
        .select()
        .single()

      if (!error && data) {
        return data as Invitation
      }
    } catch {
      // Fallback to local JSON store
    }
  }

  return mutateLocalDb((db) => {
    const tokens = new Set(db.invitations.map((i) => i.slug))
    const finalToken = resolveUniqueToken(tokens)
    const invite: Invitation = {
      id: crypto.randomUUID(),
      guest_name: cleanName,
      slug: finalToken,
      ...(cleanGreeting ? { custom_greeting: cleanGreeting } : {}),
      created_at: new Date().toISOString(),
    }
    db.invitations.unshift(invite)
    return invite
  })
}

export async function insertBulkInvites(names: string[]): Promise<Invitation[]> {
  const cleanNames = names.map((n) => n.trim()).filter(Boolean)
  if (cleanNames.length === 0) return []

  if (isSupabaseConfigured && supabase) {
    try {
      const existing = await readInvites()
      const tokenSet = new Set(existing.map((i) => i.slug))
      const rows = cleanNames.map((guest_name) => ({
        guest_name,
        slug: resolveUniqueToken(tokenSet),
      }))
      const { data, error } = await supabase
        .from('invitations')
        .insert(rows)
        .select()
      if (!error && Array.isArray(data)) {
        return data as Invitation[]
      }
    } catch {
      // Fallback to local JSON store
    }
  }

  return mutateLocalDb((db) => {
    const tokenSet = new Set(db.invitations.map((i) => i.slug))
    const created: Invitation[] = []
    for (const guest_name of cleanNames) {
      const invite: Invitation = {
        id: crypto.randomUUID(),
        guest_name,
        slug: resolveUniqueToken(tokenSet),
        created_at: new Date().toISOString(),
      }
      db.invitations.unshift(invite)
      created.push(invite)
    }
    return created
  })
}

export async function removeInvite(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('invitations').delete().eq('id', id)
      if (!error) return
    } catch {
      // Fallback to local JSON store
    }
  }

  await mutateLocalDb((db) => {
    db.invitations = db.invitations.filter((inv) => inv.id !== id)
  })
}

export async function readEventSettings(): Promise<EventSettings> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('event_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle()
      if (!error && data) {
        return {
          ...DEFAULT_SETTINGS,
          ...data,
          theme: normalizeTheme(data.theme),
          parking_notes: Array.isArray(data.parking_notes) ? data.parking_notes : [],
        } as EventSettings
      }
    } catch {
      // Fallback to local JSON store
    }
  }
  const db = await ensureLocalDb()
  return db.event_settings
}

export async function saveEventSettings(
  updates: Partial<EventSettings>
): Promise<EventSettings> {
  const current = await readEventSettings()
  const next: EventSettings = {
    ...current,
    ...updates,
    theme: normalizeTheme(updates.theme ?? current.theme),
    parking_notes: Array.isArray(updates.parking_notes)
      ? updates.parking_notes
      : current.parking_notes,
    updated_at: new Date().toISOString(),
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('event_settings')
        .upsert({ id: 'default', ...next }, { onConflict: 'id' })
        .select()
        .single()
      if (!error && data) {
        return data as EventSettings
      }
    } catch {
      // Fallback to local JSON store
    }
  }

  return mutateLocalDb((db) => {
    db.event_settings = next
    return db.event_settings
  })
}

export async function insertGuestMessage(payload: {
  invite_slug: string
  guest_name?: string
  attendance?: AttendanceStatus
  message: string
  header_info?: SenderHeaderInfo
}): Promise<GuestMessage> {
  const entry: GuestMessage = {
    id: crypto.randomUUID(),
    invite_slug: payload.invite_slug.trim() || 'chung',
    guest_name: payload.guest_name?.trim() || 'Ẩn danh',
    ...(payload.attendance ? { attendance: payload.attendance } : {}),
    message: payload.message.trim(),
    ...(payload.header_info ? { header_info: payload.header_info } : {}),
    created_at: new Date().toISOString(),
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('guest_messages')
        .insert([
          {
            invite_slug: entry.invite_slug,
            guest_name: entry.guest_name,
            attendance: entry.attendance ?? 'attending',
            message: entry.message,
            header_info: entry.header_info ?? null,
          },
        ])
        .select()
        .single()
      if (!error && data) {
        return data as GuestMessage
      }
    } catch {
      // Fallback to local JSON store
    }
  }

  return mutateLocalDb((db) => {
    db.guest_messages.unshift(entry)
    return entry
  })
}

export async function readGuestMessages(): Promise<GuestMessage[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('guest_messages')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && Array.isArray(data)) {
        return data as GuestMessage[]
      }
    } catch {
      // Fallback to local JSON store
    }
  }
  const db = await ensureLocalDb()
  return [...db.guest_messages].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export async function removeGuestMessage(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('guest_messages').delete().eq('id', id)
      if (!error) return
    } catch {
      // Fallback to local JSON store
    }
  }

  await mutateLocalDb((db) => {
    db.guest_messages = db.guest_messages.filter((msg) => msg.id !== id)
  })
}
