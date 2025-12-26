# Creating Custom Themes for Specula

This guide will help you create your own custom themes for Specula. Themes allow you to customize the appearance of the entire application, including colors, backgrounds, and even HTTP method badge colors.

## Table of Contents

- [Quick Start](#quick-start)
- [Understanding CSS Variables](#understanding-css-variables)
- [Color Format](#color-format)
- [Required Variables](#required-variables)
- [HTTP Method Colors](#http-method-colors)
- [Dark Mode Support](#dark-mode-support)
- [Using Your Theme](#using-your-theme)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Quick Start

1. **Copy the example file:**
   ```bash
   cp theme-example.css my-theme.css
   ```

2. **Modify the CSS variables** in `my-theme.css` to match your desired color scheme

3. **Host your theme file** on a web server or CDN

4. **Add it to Specula:**
   - **Standalone version:** Use the `themes` option in `Specula.init()`
   - **Regular version:** Load it through the Settings dialog

## Understanding CSS Variables

Specula uses CSS custom properties (CSS variables) to define theme colors. All theme colors are defined using the `--variable-name: value;` syntax.

### Example:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 220 13% 13%;
  --primary: 262 83% 58%;
}
```

These variables are then used throughout the application via `hsl(var(--variable-name))`.

## Color Format

**All colors MUST be in HSL format without the `hsl()` wrapper.**

### Format:
```
H S% L%
```

Where:
- **H** = Hue (0-360) - the color itself
- **S** = Saturation (0-100%) - color intensity
- **L** = Lightness (0-100%) - brightness

### Examples:
```css
/* White */
--background: 0 0% 100%;

/* Black */
--foreground: 0 0% 0%;

/* Blue */
--primary: 217 91% 60%;

/* Red */
--destructive: 0 72% 51%;

/* Purple */
--accent: 262 83% 58%;
```

### Color Picker Tools

Use these tools to find HSL values:
- [HSL Color Picker](https://hslpicker.com/)
- [Coolors.co](https://coolors.co/) - generates color palettes
- Browser DevTools - inspect elements to see computed HSL values

## Required Variables

Your theme must define these variables for the application to work correctly:

### Base Colors
- `--background` - Main background color
- `--foreground` - Main text color
- `--card` - Card/panel background
- `--card-foreground` - Card text color
- `--popover` - Popover/dropdown background
- `--popover-foreground` - Popover text color

### Primary Colors
- `--primary` - Primary accent color (buttons, links, highlights)
- `--primary-foreground` - Text color on primary background
- `--accent` - Accent color (hover states, highlights)
- `--accent-foreground` - Text color on accent background

### Secondary Colors
- `--secondary` - Secondary background
- `--secondary-foreground` - Secondary text
- `--muted` - Muted background (subtle elements)
- `--muted-foreground` - Muted text (subtle text)

### UI Colors
- `--destructive` - Error/danger color (delete buttons, errors)
- `--destructive-foreground` - Text on destructive background
- `--border` - Border color
- `--input` - Input field border color
- `--ring` - Focus ring color

### Sidebar Colors
- `--sidebar-background` - Sidebar background
- `--sidebar-foreground` - Sidebar text
- `--sidebar-primary` - Sidebar primary color
- `--sidebar-primary-foreground` - Text on sidebar primary
- `--sidebar-accent` - Sidebar accent background
- `--sidebar-accent-foreground` - Sidebar accent text
- `--sidebar-border` - Sidebar border
- `--sidebar-ring` - Sidebar focus ring

### Code Blocks
- `--code-bg` - Code block background
- `--code-border` - Code block border

### Other
- `--radius` - Border radius (e.g., `0.5rem`)

## HTTP Method Colors

These variables control the colors of HTTP method badges (GET, POST, PUT, DELETE, PATCH, etc.):

```css
--method-get: 217 91% 60%;      /* Blue */
--method-post: 142 76% 36%;    /* Green */
--method-put: 25 95% 53%;      /* Orange */
--method-delete: 0 84% 60%;    /* Red */
--method-patch: 271 91% 65%;   /* Purple */
--method-options: 215 16% 47%; /* Gray */
--method-head: 199 89% 48%;    /* Cyan */
--method-trace: 330 81% 60%;   /* Pink */
```

**Tip:** For dark themes, use brighter/lighter values (higher lightness %) for better visibility.

## Dark Mode Support

To support dark mode, add a `.dark` class selector with dark theme variables:

```css
.dark {
  --background: 220 26% 14%;
  --foreground: 210 40% 98%;
  /* ... other dark theme variables ... */
}
```

When the user switches to dark mode, Specula will automatically apply the `.dark` class and use your dark theme variables.

**Note:** If you don't provide dark mode variables, Specula will use its default dark theme colors.

## Using Your Theme

### Standalone Version

When initializing Specula, use the `themes` option:

```javascript
Specula.init({
  container: "#specula-container",
  openapi: "https://api.example.com/openapi.json",
  themes: {
    "My Custom Theme": "https://example.com/my-theme.css",
    "Another Theme": "https://example.com/another-theme.css"
  }
});
```

Users can then select your theme from the Settings dialog.

### Regular Version

1. Host your theme CSS file on a web server
2. Open Specula Settings
3. The theme will be available if added via standalone, or you can manually load it

### Loading Themes Dynamically

You can also load themes programmatically:

```javascript
// After Specula is initialized
const themeStore = speculaInstance.getThemeStore();
themeStore.addCustomTheme({
  id: "my-theme",
  name: "My Custom Theme",
  cssUrl: "https://example.com/my-theme.css"
});
```

## Best Practices

### 1. Color Contrast

Ensure sufficient contrast between text and background colors for accessibility:
- **WCAG AA:** 4.5:1 for normal text, 3:1 for large text
- **WCAG AAA:** 7:1 for normal text, 4.5:1 for large text

Use tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) to verify.

### 2. Consistent Color Palette

Choose a cohesive color palette:
- Pick 2-3 main colors
- Use variations (lighter/darker) of these colors
- Keep saturation levels consistent

### 3. Test Both Light and Dark Modes

If supporting both modes:
- Test readability in both themes
- Ensure HTTP method badges are visible
- Check that interactive elements are clearly distinguishable

### 4. Use Semantic Colors

- **Primary:** Main actions, important elements
- **Destructive:** Delete actions, errors
- **Muted:** Secondary information, disabled states
- **Accent:** Highlights, hover states

### 5. HTTP Method Colors

Keep HTTP method colors distinct and recognizable:
- **GET:** Typically blue (safe, read-only)
- **POST:** Typically green (create)
- **PUT:** Typically orange (update)
- **DELETE:** Typically red (destructive)
- **PATCH:** Typically purple (partial update)

### 6. File Organization

- Use descriptive file names: `my-company-theme.css`
- Include comments explaining your color choices
- Version your theme files if making updates

## Examples

### Example 1: Minimal Light Theme

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 10%;
  --primary: 200 100% 50%;
  --muted: 0 0% 95%;
  /* ... other variables ... */
}
```

### Example 2: Warm Dark Theme

```css
:root {
  --background: 30 20% 12%;
  --foreground: 45 30% 96%;
  --primary: 35 90% 60%;
  --muted: 30 15% 22%;
  /* ... other variables ... */
}

.dark {
  /* Same or similar values for dark mode */
  --background: 30 20% 10%;
  --foreground: 45 30% 98%;
  /* ... */
}
```

### Example 3: High Contrast Theme

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 0%;
  --primary: 0 0% 0%;
  --border: 0 0% 0%;
  /* High contrast for accessibility */
}
```

## Troubleshooting

### Theme Not Loading

- Check that the CSS file is accessible (CORS enabled if cross-origin)
- Verify the URL is correct
- Check browser console for errors

### Colors Not Applying

- Ensure all required variables are defined
- Check that colors are in HSL format without `hsl()` wrapper
- Verify no syntax errors in CSS file

### Dark Mode Not Working

- Ensure `.dark` class selector is present
- Check that dark mode variables are defined
- Verify the theme is being loaded correctly

## Resources

- [theme-example.css](../theme-example.css) - Complete example theme file
- [HSL Color Picker](https://hslpicker.com/) - Find HSL color values
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) - Check color contrast
- [Coolors.co](https://coolors.co/) - Generate color palettes

## Contributing Themes

If you create a great theme, consider sharing it with the community! You can:
- Submit a pull request with your theme
- Share it in discussions
- Create a repository with multiple themes

---

Happy theming! 🎨

