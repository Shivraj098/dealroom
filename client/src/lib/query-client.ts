import { ApiRequestError } from './api-client'

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Do not retry on 4xx client errors — retrying a 401/403/404 will never
      // succeed and only produces redundant requests and console noise.
      retry: (failureCount, error) => {
        if (error instanceof ApiRequestError && error.status >= 400 && error.status < 500) {
          return false
        }
        // Retry a network or server failure once; client errors are not recoverable by retrying.
        return failureCount < 1
      },
      refetchOnWindowFocus: false,
    },
  },
})
