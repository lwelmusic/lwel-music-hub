'use client'
import { useState } from 'react'

export default function PasswordInput({ label, value, onChange, minLength, autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <label>
      {label}
      <span className="pw">
        <input type={show ? 'text' : 'password'} required minLength={minLength} value={value} onChange={onChange} autoComplete={autoComplete} />
        <button type="button" className="eye" onClick={() => setShow(!show)} aria-pressed={show} aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? 'Hide' : 'Show'}
        </button>
      </span>
    </label>
  )
}
