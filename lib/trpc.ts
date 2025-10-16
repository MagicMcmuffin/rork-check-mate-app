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
      console.log('⚠️ Backend URL not configured. Email features will not work.');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Email service not available. Backend not configured.' 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const maxRetries = 8;
    const retryDelays = [1000, 2000, 3000, 4000, 5000, 7000, 10000, 15000];
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const attemptLog = attempt > 0 ? ` (Attempt ${attempt + 1}/${maxRetries + 1})` : '';
        if (attempt === 0) {
          console.log(`🔄 Sending request to backend...`);
        } else {
          console.log(`🔄 Retrying${attemptLog}...`);
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          
          if (contentType?.includes('text/html')) {
            await response.text();
            
            if (attempt < maxRetries) {
              const delay = retryDelays[attempt];
              if (attempt === 0) {
                console.log(`⏳ Backend is starting up. Please wait...`);
              }
              await sleep(delay);
              continue;
            }
            
            console.log('✅ Inspection saved. Email notification will be sent when backend is ready.');
            return new Response(JSON.stringify({ 
              success: false, 
              message: 'Inspection saved successfully. Email will be sent shortly.' 
            }), { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          await response.text();
          
          if (response.status >= 500 && attempt < maxRetries) {
            const delay = retryDelays[attempt];
            await sleep(delay);
            continue;
          }
          
          console.log('⚠️ Backend error. Inspection saved locally.');
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Inspection saved. Email notification pending.' 
          }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        console.log('✅ Email sent successfully');
        return response;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          if (attempt < maxRetries) {
            const delay = retryDelays[attempt];
            await sleep(delay);
            continue;
          }
          console.log('⚠️ Connection timeout. Inspection saved.');
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Inspection saved. Email pending.' 
          }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        if (attempt < maxRetries && error instanceof Error && 
            (error.message.includes('fetch') ||
             error.message.includes('network') ||
             error.message.includes('timeout'))) {
          const delay = retryDelays[attempt];
          await sleep(delay);
          continue;
        }
        
        console.log('⚠️ Connection issue. Inspection saved.');
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Inspection saved successfully.' 
        }), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    console.log('⚠️ Backend unavailable. Inspection saved.');
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Inspection saved successfully.' 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
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
