import { createTRPCReact, createTRPCProxyClient } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || process.env.EXPO_PUBLIC_TOOLKIT_URL;
  
  if (!baseUrl || baseUrl === '') {
    console.warn('⚠️ Backend not deployed - email features disabled');
    return '';
  }
  
  return baseUrl;
};

const getTRPCUrl = () => {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    return 'http://localhost:3000/api/trpc';
  }
  return `${baseUrl}/api/trpc`;
};

export const trpcReactClient = trpc.createClient({
  links: [
    httpLink({
      url: getTRPCUrl(),
      transformer: superjson,
      fetch: async (url, options) => {
        const baseUrl = getBaseUrl();
        if (!baseUrl) {
          throw new Error('Email notifications are not available. Backend service is not deployed.');
        }
        
        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            const text = await response.text();
            
            if (response.status === 404 && text.includes('Site Not Found')) {
              throw new Error('Email service is not available. Backend deployment is pending.');
            }
          }
          return response;
        } catch (error) {
          if (error instanceof Error && error.message.includes('Email')) {
            throw error;
          }
          throw new Error('Failed to connect to backend service.');
        }
      },
    }),
  ],
});

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpLink({
      url: getTRPCUrl(),
      transformer: superjson,
      fetch: async (url, options) => {
        const baseUrl = getBaseUrl();
        if (!baseUrl) {
          throw new Error('Email notifications are not available. Backend service is not deployed.');
        }
        
        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            const text = await response.text();
            
            if (response.status === 404 && text.includes('Site Not Found')) {
              throw new Error('Email service is not available. Backend deployment is pending.');
            }
          }
          return response;
        } catch (error) {
          if (error instanceof Error && error.message.includes('Email')) {
            throw error;
          }
          throw new Error('Failed to connect to backend service.');
        }
      },
    }),
  ],
});
