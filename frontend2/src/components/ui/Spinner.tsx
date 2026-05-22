import React from 'react'

interface SpinnerProps {
  size?: number
  color?: string
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 14, color }) => (
  <svg className="spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color || 'var(--bd-2)'} strokeWidth="2.5" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color || 'var(--ac)'} strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)

export default Spinner
