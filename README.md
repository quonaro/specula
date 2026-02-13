# 📦 Specula Standalone Bundle

🚀 **Easy integration of Specula OpenAPI viewer into any HTML page!**

This branch contains the standalone bundle files that allow you to embed Specula into any website with just a few lines of code. No build process required!

## ✨ Features

- 🎨 **Beautiful UI** - Modern, responsive design with dark/light theme support
- 📱 **Fully Responsive** - Works perfectly on desktop, tablet, and mobile devices
- 🔍 **Powerful Search** - Quickly find endpoints across all specifications
- 📚 **Multiple Specs** - Load and view multiple OpenAPI specifications simultaneously
- 🎯 **Self-Contained** - All assets (including logo and favicon) are embedded as Base64
- ⚡ **Zero Dependencies** - Single JavaScript file, no external dependencies needed

## 🚀 Quick Start

### Option 1: Using Official CDN (Recommended) ⭐

The easiest way to get started is using our official CDN:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My API Documentation</title>
    <!-- Load Specula CSS from Official CDN -->
    <link rel="stylesheet" href="https://ghly.d3vb0x.ru/quonaro/Specula/specula.css?ref=standalone">
    <style>
        #specula-container {
            width: 100%;
            height: 100vh;
        }
    </style>
</head>
<body>
    <!-- Container where Specula will be rendered -->
    <div id="specula-container"></div>
    
    <!-- Load Specula JavaScript from Official CDN -->
    <script src="https://ghly.d3vb0x.ru/quonaro/Specula/specula.js?ref=standalone"></script>
    <script>
        // Initialize Specula
        Specula.init({
            container: '#specula-container',
            openapi: 'https://petstore3.swagger.io/api/v3/openapi.json'
        }).then(function(specula) {
            console.log('✅ Specula initialized successfully!');
        }).catch(function(error) {
            console.error('❌ Failed to initialize Specula:', error);
        });
    </script>
</body>
</html>
```

### Option 2: Using jsDelivr CDN

Alternative option using jsDelivr CDN:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My API Documentation</title>
    <!-- Load Specula CSS from jsDelivr -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/quonaro/Specula@standalone/specula.css">
    <style>
        #specula-container {
            width: 100%;
            height: 100vh;
        }
    </style>
</head>
<body>
    <div id="specula-container"></div>
    <script src="https://cdn.jsdelivr.net/gh/quonaro/Specula@standalone/specula.js"></script>
    <script>
        Specula.init({
            container: '#specula-container',
            openapi: 'https://petstore3.swagger.io/api/v3/openapi.json'
        });
    </script>
</body>
</html>
```

> 💡 **Note:** Replace `quonaro/Specula` with your repository path if you fork the project.

### Option 3: Download and Host Locally

1. Download the files from this branch:
   - `specula.js` - Main JavaScript bundle
   - `specula.css` - CSS stylesheet
   - `index.html` - Example file

2. Include them in your HTML:

```html
<link rel="stylesheet" href="./specula.css">
<script src="./specula.js"></script>
```

## 📖 Usage Guide

### Basic Initialization

The `Specula.init()` function is the main entry point. It requires two parameters:

```javascript
Specula.init({
    container: '#specula-container',  // Required: CSS selector or HTMLElement
    openapi: 'https://api.example.com/openapi.json'  // Required: OpenAPI spec URL(s)
});
```

### Loading Multiple Specifications

You can load multiple OpenAPI specifications at once by passing an array:

```javascript
Specula.init({
    container: '#specula-container',
    openapi: [
        'https://api.example.com/v1/openapi.json',
        'https://api.example.com/v2/openapi.json',
        'https://api.example.com/v3/openapi.json'
    ]
});
```

### Dynamic Loading

You can load additional specifications after initialization:

```javascript
Specula.init({
    container: '#specula-container',
    openapi: 'https://api.example.com/openapi.json'
}).then(function(specula) {
    // Load additional spec later
    specula.loadSpec('https://another-api.example.com/openapi.json');
    
    // Or load multiple at once
    specula.loadSpec([
        'https://api2.example.com/openapi.json',
        'https://api3.example.com/openapi.json'
    ]);
});
```

### Cleanup

To remove Specula from the page:

```javascript
const speculaInstance = await Specula.init({
    container: '#specula-container',
    openapi: 'https://api.example.com/openapi.json'
});

// Later, when you want to remove it
speculaInstance.destroy();
```

## 📋 Configuration Options

### `container` (required)
- **Type:** `string | HTMLElement`
- **Description:** The container where Specula will be rendered
- **Examples:**
  - CSS selector: `'#specula-container'`
  - HTMLElement: `document.getElementById('specula-container')`

### `openapi` (required)
- **Type:** `string | string[]`
- **Description:** OpenAPI specification URL(s) to load
- **Examples:**
  - Single spec: `'https://api.example.com/openapi.json'`
  - Multiple specs: `['https://api1.com/openapi.json', 'https://api2.com/openapi.json']`

## 📁 Files in This Branch

- 📄 `specula.js` - Main JavaScript bundle (~550 KB, ~260 KB gzipped)
- 🎨 `specula.css` - CSS stylesheet (~44 KB, ~8 KB gzipped)
- 📝 `index.html` - Complete working example

## 🔧 API Reference

### `Specula.init(config: SpeculaConfig): Promise<SpeculaInstance>`

Initializes Specula in the specified container.

**Parameters:**
- `config.container` - Container selector or element (required)
- `config.openapi` - OpenAPI spec URL(s) (required)

**Returns:** Promise that resolves to a `SpeculaInstance` object.

### `SpeculaInstance.loadSpec(url: string | string[]): Promise<void>`

Loads one or more additional OpenAPI specifications.

**Parameters:**
- `url` - OpenAPI spec URL or array of URLs

### `SpeculaInstance.destroy(): void`

Destroys the Specula instance and removes it from the DOM.

## 💡 Tips & Best Practices

- ✅ **Use Official CDN** for best performance and reliability
- ✅ **Handle errors** with `.catch()` when initializing
- ✅ **Set container dimensions** using CSS (e.g., `height: 100vh`)
- ✅ **Enable CORS** on your OpenAPI spec server if loading from different domain
- ✅ **Use HTTPS** for production deployments

## 🔗 Additional Resources

- 📚 [Main Repository](https://github.com/quonaro/Specula) - Full documentation and source code
- 📖 [Standalone Integration Guide](../docs/STANDALONE.md) - Detailed integration guide
- 🐛 [Report Issues](https://github.com/quonaro/Specula/issues) - Found a bug? Let us know!

## 📝 License

See the main repository for license information.

---

Made with ❤️ by the Specula team
