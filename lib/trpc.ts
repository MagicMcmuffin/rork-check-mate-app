import { createTRPCReact, createTRPCProxyClient } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      throw new Error('Backend URL not configured');
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
        const text = await response.text();
        console.error('[tRPC] Error response:', {
          status: response.status,
          statusText: response.statusText,
          body: text.substring(0, 500),
        });
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
