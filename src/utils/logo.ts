// Logo utility for standalone and regular modes
export function getLogoUrl(): string {
  // In standalone mode, check if logo URL is available in window
  if (typeof window !== 'undefined' && (window as any).__SPECULA_STANDALONE__) {
    const standaloneLogo = (window as any).__SPECULA_LOGO_URL__
    if (standaloneLogo) {
      return standaloneLogo
    }
  }
  // Default path for regular mode
  return '/logo.png'
}

