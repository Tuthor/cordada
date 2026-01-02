import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Allowed origins for CORS - restrict to your domains
const ALLOWED_ORIGINS = [
  'https://daimjfuxgcjdwmwqwtgg.lovableproject.com',
  'https://lovable.dev',
  'http://localhost:8080',
  'http://localhost:5173',
];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin || '') ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin!,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
};

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 3; // Max 3 enrollments per hour per IP/email

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  record.count++;
  return false;
}

// HTML escape function to prevent XSS in email content
function escapeHtml(text: string | undefined | null): string {
  if (!text) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  return String(text).replace(/[&<>"'\/]/g, (char) => map[char]);
}

// Zod schema for comprehensive input validation
const enrollmentSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(200, "Name too long").trim(),
  email: z.string().email("Invalid email format").max(255, "Email too long").trim().toLowerCase(),
  phone: z.string().max(50, "Phone too long").optional().nullable(),
  company: z.string().max(200, "Company name too long").optional().nullable(),
  linkedIn: z.string().max(500, "LinkedIn URL too long")
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      // Only allow valid LinkedIn URLs or empty string
      try {
        const url = new URL(val);
        return url.protocol === 'https:' && url.hostname.includes('linkedin.com');
      } catch {
        return false;
      }
    }, "Invalid LinkedIn URL - must be a valid linkedin.com URL")
    .optional()
    .nullable(),
  expertise: z.string().max(200, "Expertise too long").optional().nullable(),
  yearsExperience: z.string().max(20, "Years experience too long").optional().nullable(),
  motivation: z.string().max(2000, "Motivation text too long").optional().nullable(),
  maturityLevel: z.string().max(100, "Maturity level too long").optional().nullable(),
  overallScore: z.number().min(0, "Score cannot be negative").max(100, "Score cannot exceed 100")
});

type EnrollmentRequest = z.infer<typeof enrollmentSchema>;

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();
    console.log("Received enrollment request for email:", rawData.email);

    // Comprehensive input validation with zod
    const validationResult = enrollmentSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      console.warn("Validation failed:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input data",
          details: validationResult.error.errors.map(e => e.message)
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const data: EnrollmentRequest = validationResult.data;

    // Rate limiting by email
    if (isRateLimited(data.email)) {
      console.warn("Rate limit exceeded for email:", data.email);
      return new Response(
        JSON.stringify({ error: "Too many enrollment attempts. Please try again later." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Save to database (data is already validated and sanitized)
    const { data: insertedData, error: dbError } = await supabase
      .from("enrollments")
      .insert({
        full_name: data.fullName,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        linkedin: data.linkedIn || null,
        expertise: data.expertise || null,
        years_experience: data.yearsExperience || null,
        motivation: data.motivation || null,
        maturity_level: data.maturityLevel || null,
        overall_score: data.overallScore,
        status: "pending",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to save enrollment. Please try again." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Enrollment saved to database:", insertedData.id);

    // Send notification email with HTML-escaped user content
    const emailResponse = await resend.emails.send({
      from: "Consultant Enrollment <onboarding@resend.dev>",
      to: ["pablo@corte.cl"],
      subject: `Nueva Inscripción de Consultor: ${escapeHtml(data.fullName)} - ${escapeHtml(data.maturityLevel)}`,
      html: `
        <h1>Nueva Solicitud de Inscripción de Consultor</h1>
        
        <h2>Información Personal</h2>
        <ul>
          <li><strong>Nombre Completo:</strong> ${escapeHtml(data.fullName)}</li>
          <li><strong>Email:</strong> ${escapeHtml(data.email)}</li>
          <li><strong>Teléfono:</strong> ${escapeHtml(data.phone)}</li>
          <li><strong>Empresa:</strong> ${escapeHtml(data.company)}</li>
          <li><strong>LinkedIn:</strong> ${escapeHtml(data.linkedIn) || 'No proporcionado'}</li>
        </ul>
        
        <h2>Experiencia Profesional</h2>
        <ul>
          <li><strong>Especialidad Principal:</strong> ${escapeHtml(data.expertise)}</li>
          <li><strong>Años de Experiencia:</strong> ${escapeHtml(data.yearsExperience)}</li>
        </ul>
        
        <h2>Resultados de la Evaluación</h2>
        <ul>
          <li><strong>Nivel de Madurez:</strong> ${escapeHtml(data.maturityLevel)}</li>
          <li><strong>Puntuación General:</strong> ${data.overallScore}%</li>
        </ul>
        
        <h2>Motivación</h2>
        <p>${escapeHtml(data.motivation)}</p>
        
        <hr>
        <p><em>Enviado el ${new Date().toLocaleString('es-CL')}</em></p>
      `,
    });

    if (emailResponse.error) {
      console.error("Email error:", emailResponse.error);
      // Don't throw - data is saved, just log the email error
    } else {
      console.log("Email sent successfully:", emailResponse);
    }

    return new Response(JSON.stringify({ success: true, id: insertedData.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-enrollment function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req.headers.get("origin")) },
      }
    );
  }
};

serve(handler);