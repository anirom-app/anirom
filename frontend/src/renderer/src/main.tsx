import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCReact } from '@trpc/react-query'
import { ipcLink } from 'electron-trpc/renderer'
import type { AppRouter } from '../../main/routers/_app'

// Import the generated route tree (TanStack Router)
import { routeTree } from './routeTree.gen'
import './globals.css'

import { historySyncService } from './services/HistorySyncService'

historySyncService.init()

// Create a new router instance
const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export const trpc = createTRPCReact<AppRouter>()
import superjson from 'superjson'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24, // 24 horas de validade local do React
      refetchOnWindowFocus: false, // Fundamental: não fazer reload ao clicar na janela
    }
  }
})

const trpcClient = trpc.createClient({
  links: [ipcLink()],
})

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </trpc.Provider>
    </StrictMode>,
  )
}
