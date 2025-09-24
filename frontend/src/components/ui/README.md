# zakapp UI/UX Enhancement

This directory contains the enhanced UI components for the zakapp project.

## Components

### Header (`Header.tsx`)

- Responsive navigation header with mobile hamburger menu
- Brand logo with calculator icon
- Dark mode toggle (prepared for future implementation)
- Mobile-first responsive design
- Accessibility features with proper ARIA labels

### Dashboard (`Dashboard.tsx`)

- Modern dashboard layout with welcome section
- Statistical cards showing key Zakat metrics
- Action cards for primary user tasks
- Asset categories overview with progress bars
- Fully responsive grid layouts

## Design System

### Color Palette

- **Primary**: Islamic-inspired teal/green (`primary-*`)
- **Accent**: Warm gold for highlights (`accent-*`)
- **Neutral**: Modern gray scale for text and backgrounds (`neutral-*`)
- **Status Colors**: Success, warning, and error states

### Typography

- **Font**: Inter with multiple weights (300-800)
- **Hierarchy**: Proper heading levels with responsive sizes
- **Line Height**: Optimized for readability

### Components

- **Buttons**: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-accent`
- **Cards**: `.card` with `.card-header`, `.card-body`, `.card-footer`
- **Forms**: `.input`, `.label` with consistent styling
- **Utilities**: Animation classes, gradient backgrounds, glass effects

## Responsive Design

- **Mobile First**: Designed primarily for mobile, enhanced for desktop
- **Breakpoints**: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- **Touch Targets**: Minimum 44px touch targets for mobile
- **Navigation**: Collapsible hamburger menu for mobile

## Accessibility

- **ARIA Labels**: Proper labeling for interactive elements
- **Keyboard Navigation**: Full keyboard support
- **Color Contrast**: Meets WCAG 2.1 AA standards
- **Focus States**: Visible focus indicators
- **Screen Reader**: Semantic HTML structure

## Animations

- **Fade In**: `.animate-fade-in` for page transitions
- **Slide Up**: `.animate-slide-up` for content reveal
- **Scale In**: `.animate-scale-in` for card animations
- **Transitions**: Smooth hover and focus transitions
