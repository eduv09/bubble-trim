# Style Organization

The CSS has been organized into modular files for better maintainability.

## File Structure

```
style/
├── main.css           # Entry point - imports all other CSS files
├── base.css           # Global resets and base styles
├── controls.css       # Game controls (level buttons, zoom, pan)
├── progress.css       # Progress indicator
├── result-panel.css   # Victory/Loss screen
├── login.css          # Login screen
└── player-card.css    # Player card component
```

## Usage

Only `main.css` needs to be imported in your HTML:

```html
<link rel="stylesheet" href="style/main.css" />
```

All other CSS files are automatically imported via `@import` statements in `main.css`.

## Adding New Styles

When adding new components or features:

1. Create a new `.css` file in the `style/` directory
2. Add an `@import` statement in `main.css`
3. Use descriptive comments for the import

Example:
```css
/* My new feature */
@import url('my-feature.css');
```

## Component Breakdown

### base.css
- HTML/body resets
- Global styles that affect the entire page

### controls.css
- `#map-controls` - Level selection buttons
- `#zoom-controls` - Zoom in/out/reset buttons
- `#pan-controls` - Pan settings (checkbox, slider)

### progress.css
- `#progress-container` - Progress percentage display

### result-panel.css
- `#result-panel` - Victory/Loss modal
- Restart and level selection buttons

### login.css
- `#login-panel` - Full-screen login overlay
- Login form, input fields, buttons
- Guest login option

### player-card.css
- `#player-card` - Expandable player information card
- Player avatar, name, stats display
