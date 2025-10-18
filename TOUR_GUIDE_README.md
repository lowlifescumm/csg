# 🎭 Website Tour Guide Sprites

A collection of 2D sprites designed for website onboarding tours, featuring a friendly cosmic-themed character that guides users through your application.

## 📁 Files Created

### Sprites
- `public/tour-guide-sprite.svg` - Default idle state
- `public/tour-guide-pointing.svg` - Pointing/directing state  
- `public/tour-guide-celebrating.svg` - Success/celebration state

### Components
- `components/TourGuide.jsx` - Individual tour guide component
- `components/WebsiteTour.jsx` - Complete tour system
- `app/tour-demo/page.js` - Demo page showcasing the sprites

## 🎨 Design Features

### Character Design
- **Theme**: Cosmic/astrological guide
- **Colors**: Purple (#8B5CF6), Pink (#F3E8FF), Gold (#FCD34D)
- **Style**: Friendly, approachable 2D sprite
- **Size**: 120x140px (optimized for web)

### Animation States
1. **Idle** - Welcoming pose with gentle smile
2. **Pointing** - Extended arm pointing to guide users
3. **Celebrating** - Raised arms with thumbs up

### Visual Elements
- Cosmic star accessories
- Animated sparkles
- Speech bubbles
- Smooth transitions
- Drop shadows for depth

## 🚀 Usage

### Basic Tour Guide
```jsx
import TourGuide from '@/components/TourGuide';

<TourGuide
  isVisible={true}
  position={{ x: 50, y: 50 }}
  state="pointing"
  message="Click here to get started!"
  onClose={() => setShowGuide(false)}
/>
```

### Complete Tour System
```jsx
import WebsiteTour from '@/components/WebsiteTour';

<WebsiteTour onComplete={() => console.log('Tour finished!')} />
```

## 🎯 Implementation Guide

### 1. Add to Your Layout
```jsx
// In your main layout or dashboard
import WebsiteTour from '@/components/WebsiteTour';

export default function Layout({ children }) {
  return (
    <div>
      {children}
      <WebsiteTour />
    </div>
  );
}
```

### 2. Customize Tour Steps
Edit `components/WebsiteTour.jsx` to modify the tour steps:

```javascript
const tourSteps = [
  {
    id: 'welcome',
    position: { x: 50, y: 30 },
    state: 'idle',
    message: "Welcome to your cosmic journey!",
    target: null
  },
  // Add more steps...
];
```

### 3. Target Specific Elements
To highlight specific page elements, add IDs to your HTML:

```html
<nav id="nav-menu">...</nav>
<div id="dashboard-stats">...</div>
<button id="tarot-button">...</button>
```

## 🎨 Customization

### Colors
Modify the SVG files to change colors:
- Body: `#8B5CF6` (purple)
- Skin: `#F3E8FF` (light purple)
- Hair: `#4C1D95` (dark purple)
- Accents: `#FCD34D` (gold)

### Size
Adjust the `viewBox` and dimensions in the SVG files:
```svg
<svg width="120" height="140" viewBox="0 0 120 140">
```

### Animations
Modify the CSS classes in `TourGuide.jsx`:
```jsx
const getAnimationClass = () => {
  if (state === 'celebrating') return 'animate-bounce';
  if (state === 'pointing') return 'animate-pulse';
  return 'animate-pulse';
};
```

## 📱 Responsive Design

The sprites are optimized for:
- **Mobile**: Touch-friendly sizing
- **Tablet**: Medium scaling
- **Desktop**: Full-size display

## 🎭 Demo Page

Visit `/tour-demo` to see the sprites in action with:
- Interactive state cycling
- Live animation preview
- Full tour system demo
- Customization examples

## 🔧 Technical Details

### File Formats
- **SVG**: Vector-based for crisp scaling
- **Optimized**: Small file sizes for fast loading
- **Accessible**: Screen reader friendly

### Browser Support
- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support
- Mobile browsers: Full support

## 🎨 Design System Integration

The sprites integrate seamlessly with your cosmic theme:
- Matches purple/pink gradient backgrounds
- Complements glassmorphic design elements
- Consistent with existing UI components

## 🚀 Next Steps

1. **Test the demo**: Visit `/tour-demo` to see the sprites
2. **Customize colors**: Modify SVG files to match your brand
3. **Add to your app**: Import components where needed
4. **Create tour flows**: Define your specific tour steps
5. **Test on devices**: Ensure mobile responsiveness

## 📞 Support

The tour guide sprites are designed to be:
- **Easy to implement**: Drop-in components
- **Highly customizable**: Modify colors, animations, messages
- **Mobile-friendly**: Responsive design
- **Accessible**: Screen reader compatible

Perfect for onboarding new users to your cosmic journey platform! ✨
