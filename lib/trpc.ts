import { createTRPCReact, createTRPCProxyClient } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || process.env.EXPO_PUBLIC_TOOLKIT_URL;
  
  if (!baseUrl || baseUrl === '') {
    console.error('❌ Backend URL is not configured!');
    console.error('Backend features (email notifications, PDF generation) will not work.');
    console.error('This typically means the backend is not deployed yet.');
    console.error('Please wait for deployment or contact support if this persists.');
    return '';
  }
  
  console.log('✅ tRPC Base URL configured:', baseUrl);
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
          console.warn('⚠️ Backend not configured - skipping request');
          throw new Error('Backend not available. Email notifications and PDF generation are disabled.');
        }
        
        try {
          console.log('tRPC React Client Request:', url);
          const response = await fetch(url, options);
          if (!response.ok) {
            console.error('❌ tRPC React Client Error:', response.status, response.statusText);
            const text = await response.text();
            console.error('Response body:', text.substring(0, 500));
            
            if (response.status === 404) {
              throw new Error('Backend server not found. The backend may still be deploying.');
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
      url: getTRPCUrl(),
      transformer: superjson,
      fetch: async (url, options) => {
        const baseUrl = getBaseUrl();
        if (!baseUrl) {
          console.warn('⚠️ Backend not configured - skipping request');
          throw new Error('Backend not available. Email notifications and PDF generation are disabled.');
        }
        
        try {
          console.log('tRPC Proxy Client Request:', url);
          const response = await fetch(url, options);
          if (!response.ok) {
            console.error('❌ tRPC Proxy Client Error:', response.status, response.statusText);
            const text = await response.text();
            console.error('Response body:', text.substring(0, 500));
            
            if (response.status === 404) {
              throw new Error('Backend server not found. The backend may still be deploying.');
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
