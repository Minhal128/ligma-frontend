# LIGMA Frontend Design System

## Overview
The LIGMA frontend has been completely redesigned with modern UI/UX principles, featuring shadcn/ui components, Framer Motion animations, and a sophisticated gradient-based color scheme.

## Tech Stack
- **React 18** - UI framework
- **shadcn/ui** - Component library built on Radix UI
- **Framer Motion** - Animation library
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

## Design Principles

### 1. Glass Morphism
Components use a glass-panel effect with backdrop blur for a modern, layered appearance:
```jsx
<div className="glass-panel">
  {/* Content */}
</div>
```

### 2. Gradient Accents
Text and backgrounds feature smooth gradients:
```jsx
<h1 className="gradient-text">LIGMA</h1>
```

### 3. Smooth Animations
All interactions are animated using Framer Motion:
- Page transitions
- Component mounting/unmounting
- Hover effects
- Loading states

### 4. Mesh Background
Dynamic gradient mesh backgrounds create visual depth:
```jsx
<div className="mesh-bg">
  {/* Content */}
</div>
```

## Color Palette

### Primary Colors
- **Background**: `hsl(222 47% 4%)` - Deep dark blue
- **Card**: `hsl(222 47% 8%)` - Slightly lighter
- **Primary**: `hsl(263 70% 50%)` - Vibrant purple
- **Accent**: Purple to pink gradient

### Semantic Colors
- **Destructive**: Red for errors and warnings
- **Muted**: Subtle grays for secondary content
- **Border**: Translucent borders for depth

## Typography
- **Sans-serif**: Inter - Clean, modern font for UI
- **Monospace**: JetBrains Mono - Code and technical content

## Component Patterns

### Cards
```jsx
<Card className="glass-panel">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Buttons
```jsx
<Button variant="default">Primary</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>
```

### Animated Containers
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
>
  {/* Content */}
</motion.div>
```

## Key Features

### 1. Authentication Screen
- Tabbed interface for login/register
- Animated background orbs
- Smooth form transitions
- Glass morphism card design

### 2. Room Selection
- Grid layout with hover effects
- Animated room cards
- Real-time role badges
- Gradient text headers

### 3. Workspace
- Three-panel layout (Event Log | Canvas | Task Board)
- Animated sidebar transitions
- Floating action buttons with glow effects
- Real-time collaboration indicators

### 4. Task Board
- Filterable task list
- Color-coded task types
- Animated task cards
- Smooth scroll area

### 5. Event Log
- Collapsible panel
- Live connection indicator
- Animated event entries
- Glass panel design

### 6. Session DNA Report
- Modal overlay with backdrop blur
- Animated statistics cards
- Circular progress indicators
- Export to Markdown

## Animation Patterns

### Page Transitions
```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
```

### Stagger Children
```jsx
{items.map((item, i) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.05 }}
  >
))}
```

### Hover Effects
```jsx
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
```

## Utility Classes

### Glass Panel
```css
.glass-panel {
  @apply bg-card/40 backdrop-blur-xl border border-white/10;
}
```

### Gradient Text
```css
.gradient-text {
  @apply bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400;
}
```

### Glow Effects
```css
.glow-purple {
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.3),
              0 0 40px rgba(139, 92, 246, 0.2);
}
```

## Responsive Design
All components are fully responsive with:
- Mobile-first approach
- Flexible grid layouts
- Adaptive typography
- Touch-friendly interactions

## Accessibility
- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Focus indicators
- Color contrast compliance

## Performance
- Lazy loading for heavy components
- Optimized animations (GPU-accelerated)
- Efficient re-renders with React.memo
- Debounced/throttled event handlers

## Future Enhancements
- Dark/light mode toggle
- Custom theme builder
- More animation presets
- Advanced accessibility features
- Performance monitoring dashboard
