# Specula

Specula is a modern web interface for viewing and testing OpenAPI specifications. The application provides a convenient way to navigate API documentation, view endpoints, and test requests.

## Preview

![Preview](docs/videos/preview.gif)

## Features

- 📄 **Specification Loading** - support for loading OpenAPI specifications from files, URLs, or clipboard
- 🔄 **Multiple Specifications** - work with multiple OpenAPI specifications simultaneously, each organized as a separate top-level group
- 🌳 **Hierarchical Tag Grouping** - support for hierarchical tag navigation using the `|` separator in OpenAPI 3+ (e.g., `"Auth | Authentication"` creates nested groups)
- 🔍 **API Navigation** - hierarchical structure of tags and endpoints with fast search functionality
- 🧪 **Try It Out** - interactive testing of API endpoints directly from the browser with support for all HTTP methods, file uploads, and authentication
- 💾 **Caching** - automatic saving of loaded specifications with intelligent caching for improved performance
- ⭐ **Favorites** - ability to save frequently used specifications
- 📱 **Responsive Design** - works on all devices
- 🎨 **Custom Themes** - create and use custom themes with support for light/dark modes and theme variants
- 🌈 **Multiple Built-in Themes** - 4 light themes and 5 dark themes including a pure black theme
- 🔌 **Standalone Integration** - easily embed Specula in any HTML page with a simple script tag
- ⚡ **High Performance** - optimized reference resolution with intelligent caching for fast loading of large OpenAPI specifications
- 🔐 **Security Support** - comprehensive support for OpenAPI security schemes (API keys, OAuth2, HTTP authentication, etc.)
- 📊 **Schema Visualization** - beautiful schema rendering with support for allOf, oneOf, anyOf, and nested references
- 📝 **Request History** - track and replay API requests
- 🌍 **Environment Variables** - manage different environments (dev, staging, prod) with variable substitution
- ✅ **Response Validation** - validate API responses against OpenAPI schemas

## Live Demo

Try the example version: **[https://quonaro.github.io/Specula/](https://quonaro.github.io/Specula/)**

## Screenshots

### Main Page

![Main Page](docs/screenshots/main-page.png)

Screenshot of the main application page with empty state or loaded specification. Shows the interface for selecting and loading specifications.

### Upload Specification

![Upload Specification](docs/screenshots/upload-spec.png)

Screenshot of the OpenAPI specification upload process. Shows various loading methods: file upload, paste from clipboard, load from URL.

### Endpoints View

![Endpoints View](docs/screenshots/endpoints-view.png)

Screenshot of the API endpoints list interface. Shows the structure of endpoints, request methods (GET, POST, PUT, DELETE, etc.) and their descriptions.

### Endpoint Details

![Endpoint Details](docs/screenshots/endpoint-details.png)

Screenshot of the endpoint detail page. Shows complete information about the endpoint: request parameters, response schema, usage examples.

### Endpoint Grouping

![Endpoint Grouping](docs/screenshots/endpoint-grouping.png)

Screenshot showing endpoint grouping functionality. Displays how endpoints are organized into hierarchical groups based on tags, allowing easy navigation through large API specifications with nested tag structures.

## Installation and Setup

### Requirements

- Node.js 20 or higher
- npm or another package manager

### Install Dependencies

```bash
npm install
```

### Run in Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Run Test Instance

Run a test instance with Petstore API pre-loaded:

```bash
npm run test
```

The test instance will be available at `http://localhost:8081`

### Build for Production

```bash
npm run build
```

Built files will be in the `dist/` folder

### Build Standalone Bundle

Build a standalone bundle that can be embedded in any HTML page:

```bash
npm run build:standalone
```

This creates `dist/specula.js` and `dist/specula.css` files that can be included in any HTML page. See [Standalone Integration Guide](docs/STANDALONE.md) for usage instructions.

### Preview Production Build

```bash
npm run preview
```

## Two Versions: Regular and Standalone

Specula is available in two versions to suit different use cases:

### Regular Version (SPA)

The regular version is a full Single Page Application (SPA) that runs independently:

- **Use case:** Standalone API documentation viewer, development tool
- **Deployment:** Host on any web server or static hosting (GitHub Pages, Netlify, Vercel, etc.)
- **Features:** Full UI with specification loading, favorites, settings, etc.
- **Build:** `npm run build` → outputs to `dist/` folder
- **Access:** Navigate to the deployed URL

**Example deployment:**
```bash
npm run build
# Deploy dist/ folder to your hosting provider
```

### Standalone Version (Embeddable)

The standalone version is designed to be embedded into existing HTML pages:

- **Use case:** Embed into documentation sites, API portals, or any web page
- **Deployment:** Include as a script tag in your HTML
- **Features:** Same functionality as regular version, but embedded in a container
- **Build:** `npm run build:standalone` → outputs `dist/specula.js` and `dist/specula.css`
- **Access:** Initialize via JavaScript API

**Example usage:**
```html
<link rel="stylesheet" href="specula.css">
<script src="specula.js"></script>
<script>
  Specula.init({
    container: "#specula-container",
    openapi: "https://api.example.com/openapi.json"
  });
</script>
```

**Key Differences:**

| Feature | Regular Version | Standalone Version |
|---------|---------------|-------------------|
| **Deployment** | Full SPA | Embedded widget |
| **Routing** | Uses Vue Router | Uses Vue Router with configurable base path |
| **Container** | Full page | Custom container element |
| **Initialization** | Automatic | Via `Specula.init()` |
| **Custom Themes** | Settings dialog | Via `themes` option in `init()` |
| **Base Path** | Fixed | Configurable via `base` option |

For detailed standalone integration instructions, see [Standalone Integration Guide](docs/STANDALONE.md).

## Environment Variables

The following environment variables can be used when building for production:

- `VITE_BASE_PATH` - base path of the application (default `/` for development, `/Specula/` for GitHub Pages)
- `VITE_EXAMPLE` - show example load button (default `false`, set to `true` to enable)

Create a `.env` file in the project root to set these variables:

```env
VITE_BASE_PATH=/docs
VITE_EXAMPLE=true
```

## Custom Themes

Specula supports custom themes, allowing you to completely customize the appearance of the application.

### Built-in Themes

Specula comes with 9 built-in themes:

**Light Themes:**
- **Light** - Neutral gray (default)
- **Warm** - Cream and beige tones
- **Rose** - Soft pink tones
- **Sky** - Cool blue tones

**Dark Themes:**
- **Dark** - Neutral gray (default)
- **Amber** - Warm brown tones
- **Ocean** - Blue ocean tones
- **Violet** - Purple tones
- **Deep Dark** - Pure black background

### Creating Custom Themes

You can create your own custom themes using CSS variables. See the [Custom Themes Guide](docs/THEMES.md) for complete instructions.

**Quick Start:**
1. Copy `theme-example.css` as a starting point
2. Modify the CSS variables to match your color scheme
3. Host your theme file on a web server
4. Add it to Specula (see [Themes Guide](docs/THEMES.md) for details)

**Example:**
```css
:root {
  --background: 0 0% 100%;
  --foreground: 220 13% 13%;
  --primary: 262 83% 58%;
  /* ... more variables ... */
}
```

For complete documentation, see [docs/THEMES.md](docs/THEMES.md).

## Technologies

- **Vue 3** - progressive JavaScript framework
- **Vite** - fast build tool
- **Vue Router** - routing for SPA
- **Pinia** - state management
- **TypeScript** - typed JavaScript
- **Tailwind CSS** - utility-first CSS framework
- **Vue Toastification** - toast notifications
- **Lucide Icons** - modern icon library

## Performance

Specula is optimized for performance, especially when working with large OpenAPI specifications:

- **Intelligent Reference Resolution** - References (`$ref`) are resolved only when needed and cached for instant subsequent access
- **Lazy Object Resolution** - Objects without references are returned as-is, avoiding unnecessary deep traversal
- **Smart Caching** - Multiple levels of caching (reference cache, object cache) prevent redundant computations
- **Optimized Rendering** - Components use computed properties and caching to minimize re-renders

These optimizations ensure that even complex specifications with hundreds of endpoints load and display quickly.

## Documentation

- **[Standalone Integration Guide](docs/STANDALONE.md)** - How to embed Specula in your HTML pages
- **[Custom Themes Guide](docs/THEMES.md)** - How to create and use custom themes
- **[Theme Example](theme-example.css)** - Example theme file to get started

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details.
