import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes cache
        gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
        refetchOnWindowFocus: false,
        retry: (failureCount, error: unknown) => {
          const status = (error as { status?: number })?.status;
          if (status === 404 || status === 401) return false;
          return failureCount < 2;
        },
      },
    },
  });
}
