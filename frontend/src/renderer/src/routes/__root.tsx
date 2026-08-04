import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/toaster'

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-background font-sans antialiased dark text-foreground">
      <Outlet />
      <Toaster />
    </div>
  ),
})
