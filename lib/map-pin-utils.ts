/**
 * Custom childcare-themed map pin: brand drop pin + tiny school/house glyph.
 * Used by SearchMapPanel and ProviderLocationMap.
 */
export function createProviderPinDataUri(): string {
  const svg = `
    <svg width="56" height="72" viewBox="0 0 56 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="4" y="8" width="48" height="60" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#0b1220" flood-opacity="0.28"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <path d="M28 60C28 60 46 42.8 46 30C46 19.5066 37.4934 11 27 11C16.5066 11 8 19.5066 8 30C8 42.8 28 60 28 60Z" fill="#00718d"/>
        <path d="M28 60C28 60 46 42.8 46 30C46 19.5066 37.4934 11 27 11C16.5066 11 8 19.5066 8 30C8 42.8 28 60 28 60Z" stroke="#005466" stroke-width="2"/>
      </g>
      <circle cx="27" cy="30" r="11.5" fill="white"/>
      <path d="M20 31.5V27.8L27 23L34 27.8V31.5C34 32.6 33.1 33.5 32 33.5H22C20.9 33.5 20 32.6 20 31.5Z" fill="#ce1053"/>
      <path d="M23.8 33.5V29.5H27.2V33.5H23.8Z" fill="#00718d"/>
      <rect x="28.6" y="28.7" width="2.2" height="2.2" rx="0.5" fill="#00d4ff"/>
      <path d="M19.2 27.9L27 22.4L34.8 27.9" stroke="#00718d" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `.trim()

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}
