import { createTRPCReact, createTRPCProxyClient } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import AsyncStorage from '@react-native-async-storage/async-storage';

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const rorkApiUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  
  if (rorkApiUrl && rorkApiUrl !== '') {
    return rorkApiUrl;
  }
  
  return '';
};

const getTRPCUrl = () => {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new Error('Backend URL not configured. Please set EXPO_PUBLIC_RORK_API_BASE_URL in your .env file.');
  }
  return `${baseUrl}/api/trpc`;
};

const createCustomFetch = () => {
  return async (url: RequestInfo | URL, options?: RequestInit) => {
    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      throw new Error('Backend URL not configured. Please set EXPO_PUBLIC_RORK_API_BASE_URL in your .env file.');
    }
    
    const token = await AsyncStorage.getItem('@checkmate_auth_token');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const headers = new Headers(options?.headers);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorBody = '';
        
        try {
          if (contentType?.includes('application/json')) {
            const json = await response.clone().json();
            errorBody = JSON.stringify(json, null, 2);
          } else {
            errorBody = await response.clone().text();
          }
        } catch (e) {
          errorBody = 'Failed to parse error response';
        }
        
        console.error('[tRPC] Error response:');
        console.error('[tRPC] Status:', response.status, response.statusText);
        console.error('[tRPC] Content-Type:', contentType);
        console.error('[tRPC] Body:', errorBody.substring(0, 1000));
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[tRPC] Fetch error:', error);
      throw error;
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
