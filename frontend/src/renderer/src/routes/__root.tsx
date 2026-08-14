import { createRootRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { Navbar } from '@/components/Navbar'
import { useAuthStore, isTokenExpired } from '@/hooks/useAuthStore'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const logout = useAuthStore((s) => s.logout)

  const isPublicRoute = ['/login', '/register'].includes(pathname)

  useEffect(() => {
    const expired = isTokenExpired(token)

    if (!isPublicRoute && expired) {
      logout()
      navigate({ to: '/login' })
    } else if (isPublicRoute && !expired) {
      navigate({ to: '/' })
    }
  }, [pathname, token])

  return (
    <div className="min-h-screen bg-background font-sans antialiased dark text-foreground">
      {!isPublicRoute && <Navbar />}
      <Outlet />
      <Toaster />
    </div>
  )
}
