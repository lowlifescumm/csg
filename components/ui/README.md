# UI Primitives Library

A shared library of accessible, keyboard-friendly UI components for consistent UX across the application.

## Components

### Modal

Accessible modal component with keyboard support and focus management.

```jsx
import { Modal, useModal } from "@/components/ui";

function MyComponent() {
  const { isOpen, open, close } = useModal();

  return (
    <>
      <button onClick={open}>Open Modal</button>
      <Modal
        isOpen={isOpen}
        onClose={close}
        title="Modal Title"
        size="md" // sm | md | lg | xl | full
      >
        <p>Modal content goes here</p>
      </Modal>
    </>
  );
}
```

**Props:**
- `isOpen`: Boolean to control visibility
- `onClose`: Callback when modal should close
- `title`: Optional modal title
- `size`: "sm" | "md" | "lg" | "xl" | "full" (default: "md")
- `closeOnOverlayClick`: Close when clicking overlay (default: true)
- `closeOnEscape`: Close on Escape key (default: true)
- `showCloseButton`: Show close button (default: true)

### Toast

Toast notification component for user feedback.

```jsx
import { ToastContainer, useToast } from "@/components/ui";

// In your layout.jsx or root component:
import { ToastContainer } from "@/components/ui";
export default function Layout({ children }) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}

// In any component:
function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success("Operation completed!");
  };

  const handleError = () => {
    toast.error("Something went wrong", {
      duration: 7000, // Custom duration
      action: {
        label: "Retry",
        onClick: () => handleRetry(),
      },
    });
  };

  return <button onClick={handleSuccess}>Show Toast</button>;
}
```

**Toast Types:**
- `toast.success(message, options)`
- `toast.error(message, options)`
- `toast.warning(message, options)`
- `toast.info(message, options)`

**Options:**
- `duration`: Auto-dismiss duration in ms (default: 5000, 0 = no auto-dismiss)
- `action`: Optional action button `{ label, onClick }`

### ConfirmDialog

Confirmation dialog for destructive or important actions.

```jsx
import { ConfirmDialog, useModal } from "@/components/ui";

function DeleteButton() {
  const { isOpen, open, close } = useModal();

  const handleConfirm = async () => {
    await deleteItem();
    close();
    toast.success("Item deleted");
  };

  return (
    <>
      <button onClick={open}>Delete</button>
      <ConfirmDialog
        isOpen={isOpen}
        onClose={close}
        onConfirm={handleConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger" // danger | warning | info
        isLoading={isDeleting}
      />
    </>
  );
}
```

**Props:**
- `isOpen`: Boolean to control visibility
- `onClose`: Callback when cancelled
- `onConfirm`: Callback when confirmed
- `title`: Dialog title (default: "Confirm Action")
- `message`: Confirmation message
- `confirmText`: Confirm button text (default: "Confirm")
- `cancelText`: Cancel button text (default: "Cancel")
- `variant`: "danger" | "warning" | "info" (default: "info")
- `isLoading`: Whether action is in progress

### Badge

Small status badge component.

```jsx
import { Badge } from "@/components/ui";

<Badge variant="success" size="md">Active</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="premium">Premium</Badge>
```

**Props:**
- `variant`: "default" | "success" | "error" | "warning" | "info" | "premium"
- `size`: "sm" | "md" | "lg" (default: "md")
- `className`: Additional CSS classes

## Hooks

### useModal

Hook for managing modal state.

```jsx
import { useModal } from "@/components/ui";

const { isOpen, open, close, toggle } = useModal();
```

### useToast

Hook for showing toast notifications.

```jsx
import { useToast } from "@/components/ui";

const toast = useToast();
toast.success("Success!");
```

## Accessibility Features

- **Keyboard Navigation**: All components support keyboard navigation
- **Focus Management**: Modals trap focus and restore previous focus on close
- **ARIA Labels**: Proper ARIA attributes for screen readers
- **Escape Key**: Modals and dialogs close on Escape key
- **Live Regions**: Toast notifications use aria-live for announcements

## Styling

All components use the cosmic brand styling:
- Glassmorphic effects
- Gradient backgrounds
- Smooth transitions
- Apple-inspired shadows
- Responsive design

## Setup

1. Add `ToastContainer` to your root layout:

```jsx
// app/layout.jsx
import { ToastContainer } from "@/components/ui";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
```

2. Import and use components anywhere:

```jsx
import { Modal, useModal, useToast, Badge } from "@/components/ui";
```

