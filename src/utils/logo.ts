// Import logo as asset - Vite will handle it automatically
// In standalone build, vite-plugin-logo-base64 will replace it with Base64 string
// In regular build, Vite will provide correct URL with base path
import logoUrl from '/logo.png'

// Logo utility for standalone and regular modes
export function getLogoUrl(): string {
    // In standalone mode, check if logo URL is available in window
    if (typeof window !== 'undefined' && (window as any).__SPECULA_STANDALONE__) {
        const standaloneLogo = (window as any).__SPECULA_LOGO_URL__
        if (standaloneLogo) {
            return standaloneLogo
        }
    }
    // For regular mode, use imported logo - Vite will provide correct path with base URL
    return logoUrl
}

