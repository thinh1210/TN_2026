'use client'

import Image from 'next/image'
import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth'
import './admin.css'

export default function LoginForm() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const passwordId = useId()
  const errorId = useId()
  const warningId = useId()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu.')
      return
    }
    setLoading(true)
    setError('')
    const res = await login(password)
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      router.refresh()
    }
  }

  return (
    <main className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <Image
            src="/hcmut-logo.png"
            alt="Logo Trường Đại học Bách Khoa"
            width={52}
            height={52}
            priority
            className="login-logo"
          />
          <div>
            <h1>Quản trị Thiệp Mời</h1>
            <p className="login-subtitle">Trường Đại học Bách Khoa — ĐHQG-HCM</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor={passwordId}>Mật khẩu</label>
            <div className="password-row">
              <input
                id={passwordId}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={error ? errorId : undefined}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError('')
                }}
              />
              <button
                type="button"
                className="btn btn-outline"
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-describedby={warningId}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            <span id={warningId} className="visually-hidden">
              Thao tác này sẽ hiển thị mật khẩu trên màn hình.
            </span>
            <span className="field-hint">
              Mặc định local: <code>123456</code> (hoặc <code>ADMIN_PASSWORD</code>)
            </span>
            {error && (
              <span id={errorId} className="status-banner status-error" role="alert">
                {error}
              </span>
            )}
          </div>

          <div className="login-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang kiểm tra...' : 'Đăng nhập'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
