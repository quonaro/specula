import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Plugin } from 'vite';

/**
 * Vite plugin to replace logo.png import with Base64 string in standalone build
 */
export function logoBase64Plugin(): Plugin {
  let logoBase64: string | null = null;

  const getLogoBase64 = () => {
    if (logoBase64) {
      return logoBase64;
    }
    // Read logo file and convert to Base64
    const logoPath = resolve(__dirname, 'public/logo.png');
    try {
      const logoBuffer = readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      return logoBase64;
    } catch (error) {
      console.error('Failed to read logo.png:', error);
      return '';
    }
  };

  return {
    name: 'logo-base64',
    enforce: 'pre', // Run before other plugins
    resolveId(id) {
      // Intercept import of /logo.png in standalone build
      if (id === '/logo.png' || id.endsWith('/logo.png')) {
        return '\0logo-base64';
      }
      return null;
    },
    load(id) {
      // Return Base64 string as ES module
      if (id === '\0logo-base64') {
        const base64 = getLogoBase64();
        return `export default '${base64}';`;
      }
      return null;
    }
  };
}

