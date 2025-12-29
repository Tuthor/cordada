import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EnrollmentRequest {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  linkedIn: string;
  expertise: string;
  yearsExperience: string;
  motivation: string;
  maturityLevel: string;
  overallScore: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: EnrollmentRequest = await req.json();
    console.log("Received enrollment data:", data);

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Save to database
    const { data: insertedData, error: dbError } = await supabase
      .from("enrollments")
      .insert({
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        company: data.company,
        linkedin: data.linkedIn,
        expertise: data.expertise,
        years_experience: data.yearsExperience,
        motivation: data.motivation,
        maturity_level: data.maturityLevel,
        overall_score: data.overallScore,
        status: "pending",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Failed to save enrollment: ${dbError.message}`);
    }

    console.log("Enrollment saved to database:", insertedData);

    // Send notification email
    const emailResponse = await resend.emails.send({
      from: "Consultant Enrollment <onboarding@resend.dev>",
      to: ["pablo@corte.cl"],
      subject: `Nueva Inscripción de Consultor: ${data.fullName} - ${data.maturityLevel}`,
      html: `
        <h1>Nueva Solicitud de Inscripción de Consultor</h1>
        
        <h2>Información Personal</h2>
        <ul>
          <li><strong>Nombre Completo:</strong> ${data.fullName}</li>
          <li><strong>Email:</strong> ${data.email}</li>
          <li><strong>Teléfono:</strong> ${data.phone}</li>
          <li><strong>Empresa:</strong> ${data.company}</li>
          <li><strong>LinkedIn:</strong> ${data.linkedIn || 'No proporcionado'}</li>
        </ul>
        
        <h2>Experiencia Profesional</h2>
        <ul>
          <li><strong>Especialidad Principal:</strong> ${data.expertise}</li>
          <li><strong>Años de Experiencia:</strong> ${data.yearsExperience}</li>
        </ul>
        
        <h2>Resultados de la Evaluación</h2>
        <ul>
          <li><strong>Nivel de Madurez:</strong> ${data.maturityLevel}</li>
          <li><strong>Puntuación General:</strong> ${data.overallScore}%</li>
        </ul>
        
        <h2>Motivación</h2>
        <p>${data.motivation}</p>
        
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
