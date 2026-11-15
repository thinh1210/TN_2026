export const ADMIN_SECRET_PATH = '/quan-tri-thiep-bk-9f8a7c6e5d4b3a21-hcmut-2026'

export interface SenderHeaderInfo {
  ip: string
  device_type: 'mobile' | 'tablet' | 'desktop'
  os_device: string
  browser_app: string
  language: string
  referer: string
  geo_location?: string
  timezone?: string
  raw_user_agent: string
}

export function generateSlug(name: string): string {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  return normalized || 'khach-moi'
}

export function formatDateTimeVN(isoString: string): string {
  try {
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return isoString
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date)
  } catch {
    return isoString
  }
}

export function extractSenderHeaderInfo(h: Headers): SenderHeaderInfo {
  const rawUa = (h.get('user-agent') || '').trim()
  const uaLower = rawUa.toLowerCase()

  // 1. IP Address
  const cfIp = h.get('cf-connecting-ip')?.trim()
  const forwardedFor = h.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = h.get('x-real-ip')?.trim()
  const ip = cfIp || forwardedFor || realIp || 'Local / Không qua Proxy'

  // 2. Device type & OS / Model
  const chMobile = h.get('sec-ch-ua-mobile')
  const chPlatform = (h.get('sec-ch-ua-platform') || '').replace(/"/g, '').trim()

  let deviceType: SenderHeaderInfo['device_type'] = 'desktop'
  let osDevice = chPlatform || 'Không rõ thiết bị'

  if (/iphone/i.test(rawUa)) {
    deviceType = 'mobile'
    const iosMatch = rawUa.match(/OS (\d+[_\d]*)/i)
    const iosVer = iosMatch ? `iOS ${iosMatch[1].replace(/_/g, '.')}` : 'iOS'
    osDevice = `iPhone (${iosVer})`
  } else if (/ipad/i.test(rawUa)) {
    deviceType = 'tablet'
    const iosMatch = rawUa.match(/OS (\d+[_\d]*)/i)
    const iosVer = iosMatch ? `iPadOS ${iosMatch[1].replace(/_/g, '.')}` : 'iPadOS'
    osDevice = `iPad (${iosVer})`
  } else if (/android/i.test(rawUa)) {
    deviceType = /mobile/i.test(rawUa) || chMobile === '?1' ? 'mobile' : 'tablet'
    const verMatch = rawUa.match(/Android\s+([0-9.]+)/i)
    const modelMatch = rawUa.match(/Android[^;)]*;\s*([^;)]+?)(?:\s+Build\/|\))/i)
    const ver = verMatch ? `Android ${verMatch[1]}` : 'Android'
    const model =
      modelMatch && modelMatch[1] && !/^wv$|^k$/i.test(modelMatch[1].trim())
        ? ` — ${modelMatch[1].trim()}`
        : ''
    osDevice = `${ver}${model}`
  } else if (/windows nt/i.test(rawUa)) {
    deviceType = 'desktop'
    osDevice = /Windows NT 10\.0/i.test(rawUa) ? 'Windows 10/11' : 'Windows'
  } else if (/macintosh|mac os x/i.test(rawUa)) {
    deviceType = 'desktop'
    osDevice = 'macOS'
  } else if (/linux/i.test(rawUa)) {
    deviceType = chMobile === '?1' ? 'mobile' : 'desktop'
    osDevice = 'Linux'
  } else if (chMobile === '?1') {
    deviceType = 'mobile'
  }

  // 3. Browser / In-App Webview detection
  let browserApp = 'Trình duyệt Web'
  if (uaLower.includes('zalo')) {
    browserApp = 'Zalo (In-App Browser)'
  } else if (/fban|fbav|messenger/i.test(rawUa)) {
    browserApp = 'Facebook / Messenger'
  } else if (uaLower.includes('instagram')) {
    browserApp = 'Instagram'
  } else if (uaLower.includes('telegram')) {
    browserApp = 'Telegram'
  } else if (uaLower.includes('tiktok') || uaLower.includes('bytedance')) {
    browserApp = 'TikTok'
  } else if (/edg\/|edga\/|edgios\//i.test(rawUa)) {
    browserApp = 'Microsoft Edge'
  } else if (/opr\/|opera/i.test(rawUa)) {
    browserApp = 'Opera'
  } else if (/samsungbrowser/i.test(rawUa)) {
    browserApp = 'Samsung Internet'
  } else if (/firefox\/|fxios\//i.test(rawUa)) {
    browserApp = 'Firefox'
  } else if (/crios\//i.test(rawUa)) {
    browserApp = 'Chrome (iOS)'
  } else if (/chrome\//i.test(rawUa)) {
    browserApp = 'Google Chrome'
  } else if (/safari\//i.test(rawUa)) {
    browserApp = 'Safari'
  }

  // 4. Language & Referer
  const acceptLang = h.get('accept-language') || ''
  const language = acceptLang.split(',')[0]?.split(';')[0]?.trim() || 'Không rõ'
  const referer = h.get('referer')?.trim() || 'Mở link trực tiếp'

  // 5. Geo & Timezone (from edge/CDN headers when deployed)
  const rawCity = h.get('x-vercel-ip-city') || ''
  let city = rawCity
  try {
    city = rawCity ? decodeURIComponent(rawCity) : ''
  } catch {
    city = rawCity
  }
  const country =
    h.get('x-vercel-ip-country') || h.get('cf-ipcountry') || ''
  const geoLocation = [city, country].filter(Boolean).join(', ') || undefined
  const timezone = h.get('x-vercel-ip-timezone')?.trim() || undefined

  return {
    ip,
    device_type: deviceType,
    os_device: osDevice,
    browser_app: browserApp,
    language,
    referer,
    ...(geoLocation ? { geo_location: geoLocation } : {}),
    ...(timezone ? { timezone } : {}),
    raw_user_agent: rawUa.slice(0, 300) || 'Không có User-Agent',
  }
}
