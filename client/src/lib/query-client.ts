import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Do not retry on 4xx client errors — retrying a 401/403/404 will never
      // succeed and only produces redundant requests and console noise.
      retry: (failureCount, error) => {
        if (error instanceof Error) {
          // The API client throws Error with the server's message; 4xx errors
          // should not be retried. We use a simple heuristic: if the message
          // matches known client-error phrases we skip retries entirely.
          const msg = error.message.toLowerCase()
          if (
            msg.includes('authentication required') ||
            msg.includes('unauthorized') ||
            msg.includes('forbidden') ||
            msg.includes('not found') ||
            msg.includes('session expired') ||
            msg.includes('account not found')
          ) {
            return false
          }
        }
        // Allow one retry for genuine network/5xx failures.
        return failureCount < 1
      },
      refetchOnWindowFocus: false,
    },
  },
})
