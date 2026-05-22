import React from 'react'

interface IconProps {
  name: string
  size?: number
  stroke?: number
  style?: React.CSSProperties
  className?: string
}

export const Icon: React.FC<IconProps> = ({ name, size = 16, stroke = 1.5, style, className }) => {
  const common: any = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor',
    strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round',
    style, className,
  }
  switch (name) {
    case 'logo': return (
      <svg {...common} viewBox="0 0 24 24"><path d="M4 6h10a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H4z"/><path d="M4 6v10"/><circle cx="14" cy="11" r="1.6" fill="currentColor" stroke="none"/></svg>
    )
    case 'search': return (<svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>)
    case 'plus': return (<svg {...common}><path d="M12 5v14M5 12h14"/></svg>)
    case 'arrow-right': return (<svg {...common}><path d="M5 12h14M13 6l6 6-6 6"/></svg>)
    case 'chevron-right': return (<svg {...common}><path d="m9 6 6 6-6 6"/></svg>)
    case 'chevron-down': return (<svg {...common}><path d="m6 9 6 6 6-6"/></svg>)
    case 'chevron-left': return (<svg {...common}><path d="m15 18-6-6 6-6"/></svg>)
    case 'check': return (<svg {...common}><path d="m5 12 5 5L20 7"/></svg>)
    case 'sparkles': return (<svg {...common}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3"/></svg>)
    case 'more': return (<svg {...common}><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>)
    case 'menu': return (<svg {...common}><path d="M4 6h16M4 12h16M4 18h16"/></svg>)
    case 'sidebar': return (<svg {...common}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg>)
    case 'folder': return (<svg {...common}><path d="M4 6a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/></svg>)
    case 'doc': return (<svg {...common}><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/></svg>)
    case 'history': return (<svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>)
    case 'users': return (<svg {...common}><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3 3-5 7-5s7 2 7 5"/><circle cx="17" cy="9" r="2.5"/><path d="M22 19c0-2-1.5-3.5-4-3.5"/></svg>)
    case 'settings': return (<svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>)
    case 'bell': return (<svg {...common}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>)
    case 'send': return (<svg {...common}><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>)
    case 'attach': return (<svg {...common}><path d="M21 12.5 12.5 21a5 5 0 0 1-7-7L14 5.5a3.5 3.5 0 0 1 5 5L10.5 19a2 2 0 0 1-3-3l8-8"/></svg>)
    case 'regenerate': return (<svg {...common}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>)
    case 'copy': return (<svg {...common}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>)
    case 'play': return (<svg {...common}><path d="M6 4l14 8-14 8z" fill="currentColor"/></svg>)
    case 'pause': return (<svg {...common}><rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/></svg>)
    case 'lock': return (<svg {...common}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>)
    case 'share': return (<svg {...common}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.4 6.8 4.2M15.4 6.4 8.6 10.6"/></svg>)
    case 'git-branch': return (<svg {...common}><circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="9" r="2"/><path d="M6 8v8"/><path d="M18 11c0 4-6 3-6 7"/></svg>)
    case 'compare': return (<svg {...common}><path d="M3 4h7v16H3z"/><path d="M14 8h7v8h-7z"/></svg>)
    case 'filter': return (<svg {...common}><path d="M3 5h18l-7 9v6l-4-2v-4z"/></svg>)
    case 'list': return (<svg {...common}><path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/></svg>)
    case 'grid': return (<svg {...common}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>)
    case 'x': return (<svg {...common}><path d="M6 6l12 12M18 6 6 18"/></svg>)
    case 'phone': return (<svg {...common}><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/></svg>)
    case 'code': return (<svg {...common}><path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/></svg>)
    case 'download': return (<svg {...common}><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 20h16"/></svg>)
    case 'external': return (<svg {...common}><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"/></svg>)
    case 'dot': return (<svg {...common}><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>)
    case 'circle': return (<svg {...common}><circle cx="12" cy="12" r="9"/></svg>)
    case 'warn': return (<svg {...common}><path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18v.5"/></svg>)
    case 'info': return (<svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 8v.5M12 12v5"/></svg>)
    case 'wand': return (<svg {...common}><path d="m4 20 12-12"/><path d="M14 6 18 2l4 4-4 4z"/><path d="M5 14v2M3 15h2"/></svg>)
    case 'diamond': return (<svg {...common}><path d="m12 2 10 10-10 10L2 12z"/></svg>)
    case 'target': return (<svg {...common}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>)
    case 'paperclip': return (<svg {...common}><path d="M21 12.5 12.5 21a5 5 0 0 1-7-7L14 5.5a3.5 3.5 0 0 1 5 5L10.5 19a2 2 0 0 1-3-3l8-8"/></svg>)
    default: return null
  }
}

export default Icon
