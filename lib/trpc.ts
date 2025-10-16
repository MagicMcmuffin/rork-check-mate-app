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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const createCustomFetch = () => {
  return async (url: RequestInfo | URL, options?: RequestInit) => {
    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      console.warn('⚠️ Backend URL not configured. Email features will not work.');
      throw new Error('Backend service is not configured. Email notifications are unavailable in this environment.');
    }
    
    const maxRetries = 5;
    const retryDelays = [2000, 3000, 4000, 5000, 6000];
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const attemptLog = attempt > 0 ? ` (Attempt ${attempt + 1}/${maxRetries + 1})` : '';
        console.log(`🔄 Backend request${attemptLog}:`, url);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          
          if (contentType?.includes('text/html')) {
            await response.text();
            console.log('⚠️ Received HTML response (backend still starting up)');
            
            if (attempt < maxRetries) {
              const delay = retryDelays[attempt];
              console.log(`⏳ Backend is warming up. Waiting ${delay}ms before retry...`);
              await sleep(delay);
              continue;
            }
            
            console.warn('⚠️ Backend did not start in time. Email will not be sent.');
            return new Response(JSON.stringify({ 
              success: false, 
              message: 'Backend is warming up. Email will not be sent.' 
            }), { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          const errorText = await response.text();
          console.error('❌ Backend error:', errorText);
          
          if (response.status >= 500 && attempt < maxRetries) {
            const delay = retryDelays[attempt];
            console.log(`⏳ Server error, retrying in ${delay}ms...`);
            await sleep(delay);
            continue;
          }
          
          throw new Error(`Backend error: ${response.status}`);
        }
        
        console.log('✅ Request successful');
        return response;
      } catch (error) {
        
        if (error instanceof Error && error.name === 'AbortError') {
          console.error('❌ Request timeout');
          if (attempt < maxRetries) {
            const delay = retryDelays[attempt];
            console.log(`⏳ Request timed out, retrying in ${delay}ms...`);
            await sleep(delay);
            continue;
          }
          console.warn('⚠️ Backend timeout. Email will not be sent.');
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Backend timeout. Email will not be sent.' 
          }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        if (attempt < maxRetries && error instanceof Error && 
            (error.message.includes('starting') || 
             error.message.includes('fetch') ||
             error.message.includes('network') ||
             error.message.includes('timeout'))) {
          const delay = retryDelays[attempt];
          console.log(`⏳ Retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }
        
        console.error('❌ Request failed:', error);
        
        if (error instanceof Error) {
          if (error.message.includes('Backend') || error.message.includes('starting') || error.message.includes('saved')) {
            throw error;
          }
          throw new Error(`Connection failed: ${error.message}`);
        }
        
        throw new Error('Failed to connect to backend.');
      }
    }
    
    throw new Error('Backend is unavailable after multiple retries. The inspection was saved locally.');
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
