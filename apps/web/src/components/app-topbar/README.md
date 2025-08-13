# App TopBar Component

A modern, responsive top bar component similar to Vercel's design, featuring organization and workspace switchers.

## Features

- **Organization Switcher**: Switch between different organizations with a dropdown menu
- **Workspace Switcher**: Switch between workspaces within the current organization (only shown in workspace context)
- **User Menu**: Access user account options and settings
- **Responsive Design**: Optimized for both mobile and desktop devices
- **Create Functionality**: Built-in dialogs for creating new organizations and workspaces

## Components

### AppTopBar
The main top bar component that automatically shows/hides based on the current route context.

### OrganizationAndAccountSwitcher
A dropdown component for switching between organizations and accessing account settings, with the ability to create new organizations.

### WorkspaceSwitcher
A dropdown component for switching between workspaces within the current organization.

### TopBarActions
Contains the user menu and other action buttons.

## Usage

### Basic Usage

```tsx
import { AppTopBar } from '@/components/app-topbar'

export default function Layout({ children }) {
  return (
    <div>
      <AppTopBar />
      {children}
    </div>
  )
}
```

### Integration with Layouts

The TopBar component is designed to work with the existing layout system:

```tsx
// In workspace layout
<SidebarInset>
  <HydrateClient>
    <AppTopBar />
  </HydrateClient>
  {/* Other content */}
</SidebarInset>

// In organization layout
<>
  <HydrateClient>
    <AppTopBar />
  </HydrateClient>
  {children}
</>
```

### Individual Components

You can also use the individual components separately:

```tsx
import { OrganizationAndAccountSwitcher, WorkspaceSwitcher, TopBarActions } from '@/components/app-topbar'

export default function CustomTopBar() {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <OrganizationAndAccountSwitcher />
        <WorkspaceSwitcher />
      </div>
      <TopBarActions />
    </header>
  )
}
```

## Styling

The component uses Tailwind CSS classes and follows the existing design system:

- **Background**: `bg-background/95` with backdrop blur
- **Border**: `border-b` for separation
- **Height**: `h-14` for consistent sizing
- **Responsive**: Automatically adjusts for mobile and desktop

## Dependencies

- `@cared/ui/components/*` - UI components from the shared package
- `@cared/ui/hooks/use-mobile` - Mobile detection hook
- `@cared/ui/lib/utils` - Utility functions including `cn`
- `lucide-react` - Icons
- `@tanstack/react-query` - Data fetching and mutations
- `@cared/api` - API types and TRPC integration

## Context Requirements

The TopBar component requires certain context to be available:

- **User Context**: For user information and authentication
- **Organization Context**: For organization data and switching
- **Workspace Context**: For workspace data and switching (when in workspace routes)

## Automatic Behavior

- **Route Detection**: Automatically detects if the user is in an organization or workspace context
- **Conditional Rendering**: Only shows workspace switcher when in workspace routes
- **Responsive Menus**: Automatically adjusts dropdown menu positioning for mobile devices

## Examples

See the demo page at `/topbar-demo` for a complete example of the TopBar component in action.
