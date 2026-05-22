import React from 'react'

export const COVER_COLORS: Record<string, [string, string]> = {
  iphone:  ['#6366f1', '#818cf8'],
  saas:    ['#059669', '#34d399'],
  fintech: ['#d97706', '#fbbf24'],
  edu:     ['#db2777', '#f472b6'],
}

interface ProjectCoverProps {
  kind: string
  size?: number
}

export const ProjectCover: React.FC<ProjectCoverProps> = ({ kind, size = 80 }) => {
  const themes: Record<string, { a: string; b: string; glyph: string }> = {
    iphone:  { a: 'oklch(0.45 0.18 280)', b: 'oklch(0.65 0.16 200)', glyph: '' },
    saas:    { a: 'oklch(0.55 0.14 150)', b: 'oklch(0.70 0.14 110)', glyph: '' },
    fintech: { a: 'oklch(0.50 0.16 40)',  b: 'oklch(0.65 0.16 60)',  glyph: '¥' },
    edu:     { a: 'oklch(0.55 0.18 320)', b: 'oklch(0.65 0.16 350)', glyph: '' },
  }
  const t = themes[kind] || themes.iphone
  return (
    <div style={{
      width: size, height: size, borderRadius: 12,
      background: `linear-gradient(135deg, ${t.a}, ${t.b})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--display)', fontWeight: 700, fontSize: size * 0.42,
      color: 'rgba(255,255,255,0.95)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 50%)',
      }} />
      <span style={{ position: 'relative', zIndex: 1 }}>{t.glyph}</span>
    </div>
  )
}

interface ProjectCoverV2Props {
  kind: string
  size?: number
}

export const ProjectCoverV2: React.FC<ProjectCoverV2Props> = ({ kind, size = 56 }) => {
  const [a, b] = COVER_COLORS[kind] || COVER_COLORS.iphone
  const glyphs: Record<string, string> = { iphone: '', saas: '', fintech: '¥', edu: '' }
  return (
    <div style={{
      width: size, height: size, borderRadius: 14, flexShrink: 0,
      background: `linear-gradient(140deg, ${a}, ${b})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-20%', left: '-20%',
        width: '60%', height: '60%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.3), transparent)',
      }} />
      <span style={{ position: 'relative', zIndex: 1, color: 'white' }}>{glyphs[kind]}</span>
    </div>
  )
}

export default ProjectCover
