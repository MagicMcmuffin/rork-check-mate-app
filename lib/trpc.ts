import { createTRPCReact, createTRPCProxyClient } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  
  if (baseUrl) {
    console.log('tRPC Base URL:', baseUrl);
    return baseUrl;
  }

  console.warn('EXPO_PUBLIC_RORK_API_BASE_URL not set, backend features may not work');
  return '';
};

export const trpcReactClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        try {
          console.log('tRPC React Client Request:', url);
          const response = await fetch(url, options);
          if (!response.ok) {
            console.error('tRPC React Client Error:', response.status, response.statusText);
            const text = await response.text();
            console.error('Response body:', text.substring(0, 200));
          }
          return response;
        } catch (error) {
          console.error('tRPC React Client fetch error:', error);
          throw error;
        }
      },
    }),
  ],
});

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        try {
          console.log('tRPC Proxy Client Request:', url);
          const response = await fetch(url, options);
          if (!response.ok) {
            console.error('tRPC Proxy Client Error:', response.status, response.statusText);
            const text = await response.text();
            console.error('Response body:', text.substring(0, 200));
          }
          return response;
        } catch (error) {
          console.error('tRPC Proxy Client fetch error:', error);
          throw error;
        }
      },
    }),
  ],
});
