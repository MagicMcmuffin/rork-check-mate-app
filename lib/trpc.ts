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

const createCustomFetch = () => {
  return async (url: RequestInfo | URL, options?: RequestInit) => {
    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      console.warn('⚠️ Backend URL not configured. Email features will not work.');
      throw new Error('Backend service is not configured. Email notifications are unavailable in this environment.');
    }
    
    try {
      console.log('🔄 Attempting backend request to:', url);
      const response = await fetch(url, options);
      
      console.log('📡 Backend response status:', response.status);
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        console.log('Response content-type:', contentType);
        
        if (contentType?.includes('text/html')) {
          const htmlText = await response.text();
          console.error('❌ Received HTML response instead of JSON. Backend endpoint may not be available.');
          console.log('HTML response preview:', htmlText.substring(0, 200));
          throw new Error('Backend service is starting up. Please wait a moment and try again.');
        }
        
        const errorText = await response.text();
        console.error('❌ Backend error response:', errorText);
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }
      
      console.log('✅ Backend request successful');
      return response;
    } catch (error) {
      console.error('❌ Backend request failed:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Backend') || error.message.includes('Email')) {
          throw error;
        }
        throw new Error(`Connection failed: ${error.message}`);
      }
      
      throw new Error('Failed to connect to backend service.');
    }
  };
};

export const trpcReactClient = trpc.createClient({
  links: [
    httpLink({
      url: getTRPCUrl(),
      transformer: superjson,
      fetch: createCustomFetch(),
    }),
  ],
});

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpLink({
      url: getTRPCUrl(),
      transformer: superjson,
      fetch: createCustomFetch(),
    }),
  ],
});
