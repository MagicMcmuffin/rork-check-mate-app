import { createTRPCReact, createTRPCProxyClient } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  
  if (!baseUrl || baseUrl === '') {
    console.error('❌ EXPO_PUBLIC_RORK_API_BASE_URL is not set!');
    console.error('Backend features (email notifications) will not work.');
    console.error('Please ensure the backend is properly deployed.');
    throw new Error('Backend URL not configured');
  }
  
  console.log('✅ tRPC Base URL configured:', baseUrl);
  return baseUrl;
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
            console.error('❌ tRPC React Client Error:', response.status, response.statusText);
            const text = await response.text();
            console.error('Response body:', text.substring(0, 500));
            
            if (response.status === 404) {
              throw new Error('Backend server not found (404). Please ensure the backend is deployed and EXPO_PUBLIC_RORK_API_BASE_URL is correct.');
            }
          }
          return response;
        } catch (error) {
          console.error('❌ tRPC React Client fetch error:', error);
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
            console.error('❌ tRPC Proxy Client Error:', response.status, response.statusText);
            const text = await response.text();
            console.error('Response body:', text.substring(0, 500));
            
            if (response.status === 404) {
              throw new Error('Backend server not found (404). Please ensure the backend is deployed and EXPO_PUBLIC_RORK_API_BASE_URL is correct.');
            }
          }
          return response;
        } catch (error) {
          console.error('❌ tRPC Proxy Client fetch error:', error);
          throw error;
        }
      },
    }),
  ],
});
