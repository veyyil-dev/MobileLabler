# Photo App Component Structure

This is a component-based rewrite of the original monolithic Photo App. The code has been refactored into smaller, reusable components for better maintainability and organization.

## Component Structure

- `PhotoApp.tsx` - Main container component that orchestrates the entire app
- `Header.tsx` - App header with title and drawer menu button
- `PhotoCapture.tsx` - Buttons for taking photos and picking from gallery
- `PhotoEditor.tsx` - Photo preview and labeling functionality
- `DrawerMenu.tsx` - Side drawer menu for Android
- `GalleryModal.tsx` - Modal for displaying and selecting photos from gallery
- `LoadingOverlay.tsx` - Loading indicator overlay

## Custom Hooks

- `usePhotoCapture.ts` - Manages photo capturing functionality
- `useMediaLibrary.ts` - Handles media library access and gallery management
- `useFileSystem.ts` - Handles file system operations and folder selection

## Usage

The app is modular, and can be imported and used by simply importing the main component:

```tsx
import PhotoApp from '../components/photo-app';

export default function MyApp() {
  return <PhotoApp />;
}
```

## Benefits of Component-Based Structure

1. **Maintainability**: Smaller components are easier to understand and modify
2. **Reusability**: Components can be reused in different parts of the app
3. **Testability**: Individual components are easier to test in isolation
4. **Separation of concerns**: Each component has a specific responsibility
5. **Code organization**: Code is organized by feature and responsibility 