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
          const response = await fetch(url, options);
          if (!response.ok) {
            const text = await response.text();
            
            if (response.status === 404 && text.includes('Site Not Found')) {
              console.warn('⚠️ Backend not yet deployed - feature unavailable');
              throw new Error('Backend service is currently unavailable. Please try again later.');
            }
            
            console.error('❌ tRPC React Client Error:', response.status, response.statusText);
            console.error('Response body:', text.substring(0, 200));
          }
          return response;
        } catch (error) {
          if (error instanceof Error && error.message.includes('Backend service is currently unavailable')) {
            throw error;
          }
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
          const response = await fetch(url, options);
          if (!response.ok) {
            const text = await response.text();
            
            if (response.status === 404 && text.includes('Site Not Found')) {
              console.warn('⚠️ Backend not yet deployed - feature unavailable');
              throw new Error('Backend service is currently unavailable. Please try again later.');
            }
            
            console.error('❌ tRPC Proxy Client Error:', response.status, response.statusText);
            console.error('Response body:', text.substring(0, 200));
          }
          return response;
        } catch (error) {
          if (error instanceof Error && error.message.includes('Backend service is currently unavailable')) {
            throw error;
          }
          console.error('❌ tRPC Proxy Client fetch error:', error);
          throw error;
        }
      },
    }),
  ],
});
