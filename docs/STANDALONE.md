# Specula Standalone Integration

Specula can be easily integrated into any HTML page using a standalone bundle. This allows you to add Specula to your documentation site, API portal, or any web page with just a few lines of code.

## Getting Started

### Option 1: Use from Official CDN (Recommended)

The easiest way to use Specula is to load it from the official CDN:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My API Documentation</title>
    <!-- Load Specula CSS from official CDN -->
    <link rel="stylesheet" href="https://cdn.d3vb0x.ru/Specula/specula.css" />
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

    <!-- Load Specula JavaScript from official CDN -->
    <script src="https://cdn.d3vb0x.ru/Specula/specula.js"></script>
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

### `themes` (optional)

Custom themes to make available in the Settings dialog. Provide an object where keys are theme names and values are CSS file URLs.

**Example:**

```javascript
Specula.init({
  container: "#specula-container",
  openapi: "https://api.example.com/openapi.json",
  themes: {
    "My Custom Theme": "https://example.com/my-theme.css",
    "Dark Theme #2": "https://example.com/dark2.css",
  },
});
```

Users can then select these themes from the Settings dialog. See [Custom Themes Guide](../docs/THEMES.md) for information on creating custom themes.

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

Initializes Specula in the specified container and returns a promise that resolves to a `SpeculaInstance` object.

#### Parameters

The `config` parameter is an object with the following properties:

##### `container` (required)

**Type:** `string | HTMLElement`

The container element where Specula will be rendered. This can be:

- **CSS selector string:** A valid CSS selector (e.g., `'#specula-container'`, `'.my-container'`, `'[data-specula]'`)
- **HTMLElement:** A direct reference to a DOM element (e.g., `document.getElementById('specula-container')`)

**Important:**

- The container must exist in the DOM when `init()` is called
- The container will be given a unique ID automatically
- Specula will take full width and height of the container
- If the container is not found, an error will be thrown

**Examples:**

```javascript
// Using CSS selector
Specula.init({
  container: "#specula-container",
  // ...
});

// Using HTMLElement
const container = document.getElementById("specula-container");
Specula.init({
  container: container,
  // ...
});

// Using querySelector
Specula.init({
  container: document.querySelector(".api-docs"),
  // ...
});
```

##### `openapi` (required)

**Type:** `string | string[]`

The OpenAPI specification(s) to load. Can be a single URL or an array of URLs for multiple specifications.

**Single specification:**

```javascript
Specula.init({
  container: "#specula-container",
  openapi: "https://api.example.com/openapi.json",
});
```

**Multiple specifications:**

```javascript
Specula.init({
  container: "#specula-container",
  openapi: [
    "https://api.example.com/v1/openapi.json",
    "https://api.example.com/v2/openapi.json",
    "https://api.example.com/admin/openapi.json",
  ],
});
```

**Important:**

- URLs can be absolute (`https://...`) or relative (`/openapi.json`)
- Relative URLs are resolved relative to the current page URL
- All specifications must be accessible from the browser (CORS must be enabled for cross-origin requests)
- Specifications are loaded asynchronously - the promise resolves when initialization is complete, not when specs are loaded
- If a specification fails to load, it will be shown in the UI with an error message
- The specification URL(s) are added to the page URL as query parameters (`?spec=...`) for bookmarking and sharing

**URL Format:**

- Must be a valid URL or path
- Can point to JSON or YAML files
- Can use query parameters (e.g., `https://api.example.com/openapi.json?version=3.0`)

##### `base` (optional)

**Type:** `string`

Base path for routing. Useful when integrating Specula into a subdirectory or alongside other routes (e.g., FastAPI integration at `/docs`).

**Default:** `'/'` (root path)

**Behavior:**

- All Specula routes will be prefixed with this base path
- The base path is automatically normalized:
  - Leading `/` is added if missing
  - Trailing `/` is removed (except for root `/`)
- Routes follow the pattern: `{base}/{method}/{path}`

**Examples:**

```javascript
// Base path: /docs
// Routes: /docs/GET/users, /docs/POST/users, etc.
Specula.init({
  container: "#specula-container",
  openapi: "https://api.example.com/openapi.json",
  base: "/docs",
});

// Base path: /api-docs
// Routes: /api-docs/GET/users, /api-docs/POST/users, etc.
Specula.init({
  container: "#specula-container",
  openapi: "https://api.example.com/openapi.json",
  base: "/api-docs",
});

// Base path: / (default)
// Routes: /GET/users, /POST/users, etc.
Specula.init({
  container: "#specula-container",
  openapi: "https://api.example.com/openapi.json",
  // base defaults to '/'
});
```

**Use Cases:**

- **FastAPI integration:** Use `base: "/docs"` to match FastAPI's `/docs` route
- **Subdirectory hosting:** Use `base: "/api-documentation"` if hosting in a subdirectory
- **Multiple instances:** Use different base paths to run multiple Specula instances on the same page

**Important:**

- The base path affects browser history and navigation
- Make sure your server/router is configured to handle routes under this base path
- The base path should match your actual URL structure

##### `themes` (optional)

**Type:** `Record<string, string>`

Custom themes to make available in the Settings dialog. Provide an object where keys are theme names and values are CSS file URLs.

**Format:**

```typescript
{
  "Theme Name": "https://example.com/theme.css",
  "Another Theme": "https://example.com/another-theme.css"
}
```

**Example:**

```javascript
Specula.init({
  container: "#specula-container",
  openapi: "https://api.example.com/openapi.json",
  themes: {
    "Company Theme": "https://cdn.example.com/themes/company.css",
    "Dark Professional": "https://cdn.example.com/themes/dark-pro.css",
    "High Contrast": "/themes/high-contrast.css",
  },
});
```

**Important:**

- Theme names are displayed in the Settings dialog
- CSS files must be accessible (CORS enabled for cross-origin)
- Themes are loaded dynamically when selected by the user
- Theme IDs are automatically generated from names (spaces replaced with hyphens, lowercased)
- See [Custom Themes Guide](THEMES.md) for information on creating themes

**Theme Loading:**

- Themes are registered but not loaded until the user selects them
- Each theme is loaded as a `<link>` element in the document head
- If a theme fails to load, an error is shown and the previous theme is restored

#### Return Value

**Type:** `Promise<SpeculaInstance>`

Returns a promise that resolves to a `SpeculaInstance` object when initialization is complete.

**The promise resolves when:**

- The Vue app is mounted
- The router is initialized
- Themes are registered
- The container is ready

**The promise does NOT wait for:**

- OpenAPI specifications to finish loading (they load asynchronously)
- All resources to be fetched

**Example:**

```javascript
const instance = await Specula.init({
  container: "#specula-container",
  openapi: "https://api.example.com/openapi.json",
});

// Instance is ready, but specs may still be loading
console.log("Specula initialized!");
```

#### Errors

The function may throw or reject with the following errors:

- **`Container not found`** - The specified container element does not exist in the DOM
- **Network errors** - If the OpenAPI specification fails to load (handled gracefully in UI)
- **Invalid configuration** - If required parameters are missing or invalid

**Error Handling:**

```javascript
Specula.init({
  container: "#specula-container",
  openapi: "https://api.example.com/openapi.json",
})
  .then((instance) => {
    console.log("Success!", instance);
  })
  .catch((error) => {
    console.error("Failed to initialize:", error);
    // Handle error (show message, fallback UI, etc.)
  });
```

---

### `SpeculaInstance`

The object returned by `Specula.init()`. Provides methods to control the Specula instance.

#### Properties

The instance object has the following methods:

#### `loadSpec(url: string | string[]): Promise<void>`

Loads one or more additional OpenAPI specifications after initialization.

**Parameters:**

- `url` - A single URL string or an array of URL strings

**Returns:** A promise that resolves when the URL query parameters are updated (specs load asynchronously)

**Behavior:**

- Updates the page URL with `?spec=...` query parameters
- The app's internal watchers detect the URL change and load the specifications
- New specifications are added to the existing list
- If a specification with the same URL already exists, it may be reloaded

**Examples:**

```javascript
const instance = await Specula.init({
  container: "#specula-container",
  openapi: "https://api.example.com/v1/openapi.json",
});

// Load additional specification
await instance.loadSpec("https://api.example.com/v2/openapi.json");

// Load multiple specifications
await instance.loadSpec([
  "https://api.example.com/v2/openapi.json",
  "https://api.example.com/admin/openapi.json",
]);
```

**Use Cases:**

- Dynamically loading additional API versions
- Adding admin or internal APIs
- Loading specifications based on user selection
- Progressive loading of large API sets

**Important:**

- This method updates the URL, which may trigger browser history changes
- Specifications load asynchronously - the promise resolves when the URL is updated, not when specs finish loading
- Failed specifications are shown with error messages in the UI

#### `destroy(): void`

Destroys the Specula instance and removes it from the DOM.

**Parameters:** None

**Returns:** `void`

**Behavior:**

- Unmounts the Vue application
- Removes the Specula container from the DOM
- Cleans up event listeners and watchers
- Does NOT remove the original container element (only the Specula app container)

**Example:**

```javascript
const instance = await Specula.init({
  container: "#specula-container",
  openapi: "https://api.example.com/openapi.json",
});

// Later, when you want to remove Specula
instance.destroy();

// The container is now empty and can be reused or removed
document.getElementById("specula-container").innerHTML =
  "<p>Specula removed</p>";
```

**Use Cases:**

- Removing Specula when navigating away
- Switching between different documentation viewers
- Cleaning up when a modal or dialog is closed
- Dynamic page updates

**Important:**

- After calling `destroy()`, the instance object should not be used
- The original container element remains in the DOM
- You can create a new instance in the same container after destroying the previous one

---

## Initialization Process

When `Specula.init()` is called, the following happens:

1. **Validation:** Checks that the container exists and configuration is valid
2. **Base Path Normalization:** Normalizes the base path (adds leading `/`, removes trailing `/`)
3. **URL Setup:** Adds OpenAPI specification URLs to the page URL as query parameters
4. **Favicon Setup:** Sets the page favicon from the embedded Specula logo
5. **Container Setup:** Creates a new div inside your container with a unique ID
6. **Vue App Creation:** Creates a new Vue 3 application instance
7. **Router Setup:** Configures Vue Router with the specified base path
8. **Store Initialization:** Initializes Pinia stores (specs, themes, settings, etc.)
9. **Theme Registration:** Registers custom themes from the `themes` option
10. **App Mounting:** Mounts the Vue app to the container
11. **Spec Loading:** The app's internal watchers detect URL parameters and start loading specifications

**Timeline:**

```
init() called
  ↓
Container validated
  ↓
Base path normalized
  ↓
URL updated with ?spec=...
  ↓
Vue app created and mounted
  ↓
Promise resolves (instance returned)
  ↓
[Async] Specifications load in background
  ↓
[Async] UI updates as specs load
```

## Multiple Instances

You can create multiple Specula instances on the same page, but each must have:

- A unique container element
- A unique base path (if using base paths)

**Example:**

```javascript
// Instance 1: Main API docs
const mainDocs = await Specula.init({
  container: "#main-api-docs",
  openapi: "https://api.example.com/openapi.json",
  base: "/docs",
});

// Instance 2: Admin API docs (different container, different base)
const adminDocs = await Specula.init({
  container: "#admin-api-docs",
  openapi: "https://api.example.com/admin/openapi.json",
  base: "/admin-docs",
});
```

**Important:**

- Each instance is independent
- They share the same global `Specula` namespace
- Use different base paths to avoid route conflicts
- Each instance maintains its own state (specs, themes, settings)

## Practical Examples

### Example 1: Basic Integration

The simplest way to use Specula:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>API Documentation</title>
    <link rel="stylesheet" href="specula.css" />
    <style>
      #specula-container {
        width: 100%;
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <div id="specula-container"></div>
    <script src="specula.js"></script>
    <script>
      Specula.init({
        container: "#specula-container",
        openapi: "https://api.example.com/openapi.json",
      });
    </script>
  </body>
</html>
```

### Example 2: With Custom Themes

Add custom themes during initialization:

```javascript
Specula.init({
  container: "#specula-container",
  openapi: "https://api.example.com/openapi.json",
  themes: {
    "Company Brand": "https://cdn.example.com/themes/brand.css",
    "Dark Mode Pro": "https://cdn.example.com/themes/dark-pro.css",
  },
});
```

### Example 3: Multiple Specifications

Load multiple API specifications:

```javascript
Specula.init({
  container: "#specula-container",
  openapi: [
    "https://api.example.com/v1/openapi.json",
    "https://api.example.com/v2/openapi.json",
    "https://api.example.com/admin/openapi.json",
  ],
});
```

### Example 4: Dynamic Loading

Load specifications based on user selection:

```javascript
const instance = await Specula.init({
  container: "#specula-container",
  openapi: "https://api.example.com/v1/openapi.json",
});

// User selects "Version 2" from a dropdown
document
  .getElementById("version-select")
  .addEventListener("change", async (e) => {
    const version = e.target.value;
    await instance.loadSpec(`https://api.example.com/${version}/openapi.json`);
  });
```

### Example 5: With Base Path for Subdirectory

Host Specula in a subdirectory:

```javascript
Specula.init({
  container: "#specula-container",
  openapi: "/openapi.json",
  base: "/api-docs", // All routes will be under /api-docs
});
```

### Example 6: Error Handling and Fallback

Handle errors gracefully:

```javascript
Specula.init({
  container: "#specula-container",
  openapi: "https://api.example.com/openapi.json",
})
  .then((instance) => {
    console.log("✅ Specula initialized");

    // Optional: Set up error handling for spec loading
    // (Errors are shown in UI, but you can also listen for them)
  })
  .catch((error) => {
    console.error("❌ Failed to initialize Specula:", error);

    // Show fallback UI
    document.getElementById("specula-container").innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <h2>Failed to Load Documentation</h2>
        <p>${error.message}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  });
```

### Example 7: Conditional Initialization

Initialize only if container exists:

```javascript
const container = document.getElementById("specula-container");
if (container) {
  Specula.init({
    container: container,
    openapi: "https://api.example.com/openapi.json",
  });
} else {
  console.warn("Specula container not found");
}
```

### Example 8: Cleanup on Navigation

Destroy instance when navigating away:

```javascript
let speculaInstance = null;

function showDocumentation() {
  speculaInstance = await Specula.init({
    container: "#specula-container",
    openapi: "https://api.example.com/openapi.json"
  });
}

function hideDocumentation() {
  if (speculaInstance) {
    speculaInstance.destroy();
    speculaInstance = null;
  }
}
```

## Best Practices

### 1. Container Sizing

Always set explicit dimensions for your container:

```css
#specula-container {
  width: 100%;
  height: 100vh; /* or a fixed height like 800px */
}
```

**Why:** Specula needs explicit dimensions to render properly. Without them, the container may collapse to 0 height.

### 2. Error Handling

Always handle initialization errors:

```javascript
Specula.init({
  /* ... */
}).catch((error) => {
  console.error("Specula error:", error);
  // Show user-friendly error message
});
```

### 3. CORS Configuration

If loading specifications from a different domain, ensure CORS is enabled:

```javascript
// Server must send these headers:
// Access-Control-Allow-Origin: *
// Access-Control-Allow-Methods: GET
```

### 4. Base Path Matching

Ensure your base path matches your actual URL structure:

```javascript
// If your page is at: https://example.com/docs/index.html
// Use base: "/docs"
Specula.init({
  container: "#specula-container",
  openapi: "/openapi.json",
  base: "/docs", // Matches the /docs path
});
```

### 5. Theme Hosting

Host custom themes on a reliable CDN:

```javascript
Specula.init({
  container: "#specula-container",
  openapi: "https://api.example.com/openapi.json",
  themes: {
    "Company Theme": "https://cdn.example.com/themes/company.css", // Use CDN
  },
});
```

### 6. Version Pinning

For production, pin to a specific version:

```html
<!-- Official CDN with version parameter -->
<link
  rel="stylesheet"
  href="https://cdn.d3vb0x.ru/Specula/specula.css?v=1.0.0"
/>
<script src="https://cdn.d3vb0x.ru/Specula/specula.js?v=1.0.0"></script>

<!-- Or use jsDelivr with specific commit/tag -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/quonaro/Specula@v1.0.0/specula.css"
/>
<script src="https://cdn.jsdelivr.net/gh/quonaro/Specula@v1.0.0/specula.js"></script>
```

### 7. Async Loading

Load Specula asynchronously to avoid blocking page render:

```html
<script>
  // Load Specula after page is ready
  window.addEventListener("DOMContentLoaded", () => {
    Specula.init({
      container: "#specula-container",
      openapi: "https://api.example.com/openapi.json",
    });
  });
</script>
```

## Common Issues and Solutions

### Issue: Container not found

**Error:** `Container not found: #specula-container`

**Solution:** Ensure the container exists in the DOM before calling `init()`:

```javascript
// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  Specula.init({
    container: "#specula-container",
    openapi: "https://api.example.com/openapi.json",
  });
});
```

### Issue: Specifications not loading

**Symptom:** Specifications show loading state but never finish

**Solutions:**

- Check browser console for CORS errors
- Verify the OpenAPI URL is accessible
- Ensure the server sends proper CORS headers
- Check network tab for failed requests

### Issue: Routes not working

**Symptom:** Clicking endpoints doesn't navigate

**Solution:** Ensure base path matches your URL structure:

```javascript
// If page is at /docs/index.html, use:
Specula.init({
  container: "#specula-container",
  openapi: "https://api.example.com/openapi.json",
  base: "/docs", // Must match the path
});
```

### Issue: Theme not loading

**Symptom:** Custom theme doesn't apply

**Solutions:**

- Check that theme CSS file is accessible (CORS enabled)
- Verify the URL is correct
- Check browser console for loading errors
- Ensure theme CSS uses correct variable names (see [Themes Guide](THEMES.md))

### Issue: Multiple instances conflict

**Symptom:** Routes from different instances interfere

**Solution:** Use different base paths for each instance:

```javascript
// Instance 1
Specula.init({
  container: "#docs-1",
  openapi: "https://api1.example.com/openapi.json",
  base: "/docs-1",
});

// Instance 2
Specula.init({
  container: "#docs-2",
  openapi: "https://api2.example.com/openapi.json",
  base: "/docs-2",
});
```

## Examples

### Complete Example with Error Handling

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>API Documentation</title>
    <link rel="stylesheet" href="https://cdn.d3vb0x.ru/Specula/specula.css" />
    <style>
      #specula-container {
        width: 100%;
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <div id="specula-container"></div>
    <script src="https://cdn.d3vb0x.ru/Specula/specula.js"></script>
    <script>
      Specula.init({
        container: "#specula-container",
        openapi: "/openapi.json", // Relative URL - loads from same domain
        base: "/docs", // Optional: base path for routing
      })
        .then(function (specula) {
          console.log("✅ Specula initialized successfully!");

          // Example: Load additional spec dynamically
          // specula.loadSpec("https://api.example.com/v2/openapi.json");
        })
        .catch(function (error) {
          console.error("❌ Failed to initialize Specula:", error);
          document.getElementById("specula-container").innerHTML =
            "<div style='padding: 20px; text-align: center;'>" +
            "<h2>Failed to load Specula</h2>" +
            "<p>" +
            error.message +
            "</p>" +
            "</div>";
        });
    </script>
  </body>
</html>
```

### Integration with FastAPI

If you're using FastAPI, you can serve the standalone bundle and integrate it:

```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI()

# Serve static files (specula.js and specula.css)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/docs")
async def docs():
    return FileResponse("docs.html")  # HTML file with Specula integration

@app.get("/openapi.json")
async def openapi():
    return app.openapi()  # Return OpenAPI schema
```

Then in your `docs.html`:

```html
<script>
  Specula.init({
    container: "#specula-container",
    openapi: "/openapi.json",
    base: "/docs", // Match your FastAPI route
  });
</script>
```

## CDN Usage

The standalone bundle is available via multiple CDN options:

### Option 1: Official CDN (Recommended)

- **CSS**: `https://cdn.d3vb0x.ru/Specula/specula.css`
- **JS**: `https://cdn.d3vb0x.ru/Specula/specula.js`

The official CDN is the recommended option for production use. It provides reliable hosting with CORS support and automatic updates.

### Option 2: jsDelivr CDN

Alternatively, you can use jsDelivr CDN:

- **CSS**: `https://cdn.jsdelivr.net/gh/quonaro/Specula@standalone/specula.css`
- **JS**: `https://cdn.jsdelivr.net/gh/quonaro/Specula@standalone/specula.js`

> **Note:** Replace `quonaro/Specula` with your repository path if you fork the project. The bundle is automatically updated whenever changes are pushed to the `main` branch.

### Using a Specific Version

For production deployments, consider pinning to a specific version to ensure stability:

**Official CDN:**

```html
<!-- Using a specific version (if supported by the CDN) -->
<link
  rel="stylesheet"
  href="https://cdn.d3vb0x.ru/Specula/specula.css?v=1.0.0"
/>
<script src="https://cdn.d3vb0x.ru/Specula/specula.js?v=1.0.0"></script>
```

**jsDelivr CDN:**

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

**Important Notes:**

- Both CDNs support CORS, so they can be used directly in `<script>` tags without CORS issues
- When using commits or tags with jsDelivr, make sure the standalone bundle was built for that commit/tag
- The `standalone` branch always contains the latest build from the `main` branch
- For production deployments, consider pinning to a specific version to ensure stability

## Performance

Specula standalone bundle is optimized for performance:

- **Fast Reference Resolution** - Intelligent caching system ensures that OpenAPI references (`$ref`) are resolved efficiently
- **Lazy Loading** - Objects are only resolved when they contain references, avoiding unnecessary deep traversal
- **Smart Caching** - Multiple levels of caching prevent redundant computations when navigating between endpoints
- **Optimized Bundle** - The standalone bundle is minified and optimized for production use

These optimizations ensure that even large OpenAPI specifications with hundreds of endpoints load and display quickly.

## Custom Themes

You can provide custom themes when initializing Specula using the `themes` option:

```javascript
Specula.init({
  container: "#specula-container",
  openapi: "https://api.example.com/openapi.json",
  themes: {
    "My Custom Theme": "https://example.com/my-theme.css",
    "Company Theme": "https://example.com/company-theme.css",
  },
});
```

Users can then select these themes from the Settings dialog. For complete information on creating custom themes, see the [Custom Themes Guide](THEMES.md).

## Notes

- The standalone version uses history-based routing (HTML5 History API) for clean URLs
- All specifications are loaded via `fetch`, so they must be accessible from the browser (CORS must be enabled if loading from a different domain)
- The bundle includes all dependencies and is self-contained - no external dependencies required
- Files served from CDN may be cached. Use commit hashes or tags for production deployments to ensure version consistency
- The standalone bundle automatically sets the favicon from the embedded logo
- Custom themes must be hosted on a web server with CORS enabled if loading from a different domain
