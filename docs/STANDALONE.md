# Specula Standalone Integration

Specula can be easily integrated into any HTML page using a standalone bundle. This allows you to add Specula to your documentation site, API portal, or any web page with just a few lines of code.

## Getting Started

### Option 1: Use from jsDelivr CDN (Recommended)

The easiest way to use Specula is to load it from jsDelivr CDN, which supports CORS:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My API Documentation</title>
    <!-- Load Specula CSS from jsDelivr -->
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/quonaro/Specula@standalone/specula.css"
    />
    <style>
      #specula-container {
        width: 100%;
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <!-- Container for Specula -->
    <div id="specula-container"></div>

    <!-- Load Specula JavaScript from jsDelivr -->
    <script src="https://cdn.jsdelivr.net/gh/quonaro/Specula@standalone/specula.js"></script>
    <script>
      // Initialize Specula
      Specula.init({
        container: "#specula-container",
        openapi: "https://petstore3.swagger.io/api/v3/openapi.json",
      })
        .then(function (specula) {
          console.log("Specula initialized!");
        })
        .catch(function (error) {
          console.error("Failed to initialize Specula:", error);
        });
    </script>
  </body>
</html>
```

> **Note:** Replace `quonaro/Specula` with your repository path if you fork the project.

### Option 2: Build Locally

Build the standalone version yourself:

```bash
npm run build:standalone
```

This will create two files in the `dist/` directory:

- `specula.js` - The main JavaScript bundle
- `specula.css` - The CSS styles

Then include them in your HTML:

## Basic Usage

Add Specula to your HTML page:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My API Documentation</title>
    <!-- Load Specula CSS -->
    <link rel="stylesheet" href="path/to/specula.css" />
    <style>
      #specula-container {
        width: 100%;
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <!-- Container for Specula -->
    <div id="specula-container"></div>

    <!-- Load Specula JavaScript -->
    <script src="path/to/specula.js"></script>
    <script>
      // Initialize Specula
      Specula.init({
        container: "#specula-container",
        openapi: "https://api.example.com/openapi.json",
      })
        .then(function (specula) {
          console.log("Specula initialized!");
        })
        .catch(function (error) {
          console.error("Failed to initialize Specula:", error);
        });
    </script>
  </body>
</html>
```

## Configuration Options

### `container` (required)

The container where Specula will be rendered. Can be:

- A CSS selector string: `'#specula-container'`
- An HTMLElement: `document.getElementById('specula-container')`

### `openapi` (required)

The OpenAPI specification to load. Can be:

- A single URL string: `'https://api.example.com/openapi.json'`
- An array of URLs for multiple specs: `['https://api1.example.com/openapi.json', 'https://api2.example.com/openapi.json']`

### `base` (optional)

Base path for routing. Useful when integrating Specula into a subdirectory or alongside other routes (e.g., FastAPI integration at `/docs`).

**Examples:**

- `base: '/docs'` - Specula routes will be prefixed with `/docs` (e.g., `/docs/GET/users`)
- `base: '/api-docs'` - Routes will be at `/api-docs/GET/users`
- If not specified, defaults to `/` (root path)

**Note:** The base path should:

- Start with `/` (will be added automatically if omitted)
- Not end with `/` (will be removed automatically)

## Advanced Usage

### Loading Multiple Specifications

```javascript
Specula.init({
  container: "#specula-container",
  openapi: [
    "https://api.example.com/v1/openapi.json",
    "https://api.example.com/v2/openapi.json",
  ],
});
```

### Using a Base Path

If you need to host Specula in a subdirectory (e.g., for FastAPI integration at `/docs`):

```javascript
Specula.init({
  container: "#specula-container",
  openapi: "https://api.example.com/openapi.json",
  base: "/docs", // All routes will be prefixed with /docs
});
```

In this case, the routes will be accessible at:

- `/docs/GET/users` (instead of `/GET/users`)
- `/docs/POST/users` (instead of `/POST/users`)

### Dynamically Loading Additional Specifications

```javascript
Specula.init({
  container: "#specula-container",
  openapi: "https://api.example.com/openapi.json",
}).then(function (specula) {
  // Load additional spec later
  specula.loadSpec("https://another-api.example.com/openapi.json");
});
```

### Destroying the Instance

```javascript
const speculaInstance = await Specula.init({
  container: "#specula-container",
  openapi: "https://api.example.com/openapi.json",
});

// Later, remove Specula from the page
speculaInstance.destroy();
```

## API Reference

### `Specula.init(config: SpeculaConfig): Promise<SpeculaInstance>`

Initializes Specula in the specified container.

**Returns:** A promise that resolves to a `SpeculaInstance` object.

### `SpeculaInstance.loadSpec(url: string | string[]): Promise<void>`

Loads one or more OpenAPI specifications.

### `SpeculaInstance.destroy(): void`

Destroys the Specula instance and removes it from the DOM.

## Examples

See the `examples/standalone-example.html` file for a complete working example.

## CDN Usage

The standalone bundle is automatically built and available via jsDelivr CDN:

### Latest Version (Recommended)

- **CSS**: `https://cdn.jsdelivr.net/gh/quonaro/Specula@standalone/specula.css`
- **JS**: `https://cdn.jsdelivr.net/gh/quonaro/Specula@standalone/specula.js`

The bundle is automatically updated whenever changes are pushed to the `main` branch.

### Using a Specific Version

To pin to a specific commit or tag, replace `@standalone` in the URL:

```html
<!-- Using a specific commit -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/quonaro/Specula@abc123def456/specula.css"
/>
<script src="https://cdn.jsdelivr.net/gh/quonaro/Specula@abc123def456/specula.js"></script>

<!-- Using a tag (e.g., v1.0.0) -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/quonaro/Specula@v1.0.0/specula.css"
/>
<script src="https://cdn.jsdelivr.net/gh/quonaro/Specula@v1.0.0/specula.js"></script>
```

**Note:**

- jsDelivr supports CORS, so it can be used directly in `<script>` tags
- When using commits or tags, make sure the standalone bundle was built for that commit/tag
- The `standalone` branch always contains the latest build
- Alternative: You can also use `raw.githubusercontent.com` if you host files in a different branch, but jsDelivr is recommended for better CORS support

## Notes

- The standalone version uses hash-based routing to avoid server configuration requirements
- All specifications are loaded via `fetch`, so they must be accessible from the browser (CORS must be enabled if loading from a different domain)
- The bundle includes all dependencies and is self-contained
- Files are served from GitHub's CDN, so they may be cached. Use commit hashes or tags for production deployments
