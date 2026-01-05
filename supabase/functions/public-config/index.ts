import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Allowed origins for CORS - restrict to your domains
const ALLOWED_ORIGINS = [
  "https://daimjfuxgcjdwmwqwtgg.lovableproject.com",
  "https://lovable.dev",
  "http://localhost:8080",
  "http://localhost:5173",
];

const isAllowedOrigin = (origin: string | null) => {
  if (!origin) return false;
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "lovable.dev" ||
      hostname.endsWith(".lovable.dev") ||
      hostname === "lovableproject.com" ||
      hostname.endsWith(".lovableproject.com") ||
      hostname === "localhost"
    );
  } catch {
    return false;
  }
};

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin!,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
};

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Public config: OK to expose (reCAPTCHA site key is not a secret)
  const recaptchaSiteKey = Deno.env.get("VITE_RECAPTCHA_SITE_KEY") ?? "";

  return new Response(
    JSON.stringify({
      recaptchaSiteKey,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
        ...corsHeaders,
      },
    },
  );
};

serve(handler);
