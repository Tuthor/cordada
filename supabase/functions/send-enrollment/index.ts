import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

    const emailResponse = await resend.emails.send({
      from: "Consultant Enrollment <onboarding@resend.dev>",
      to: ["pablo@corte.cl"],
      subject: `New Consultant Enrollment: ${data.fullName} - ${data.maturityLevel}`,
      html: `
        <h1>New Consultant Enrollment Request</h1>
        
        <h2>Personal Information</h2>
        <ul>
          <li><strong>Full Name:</strong> ${data.fullName}</li>
          <li><strong>Email:</strong> ${data.email}</li>
          <li><strong>Phone:</strong> ${data.phone}</li>
          <li><strong>Company:</strong> ${data.company}</li>
          <li><strong>LinkedIn:</strong> ${data.linkedIn || 'Not provided'}</li>
        </ul>
        
        <h2>Professional Background</h2>
        <ul>
          <li><strong>Primary Expertise:</strong> ${data.expertise}</li>
          <li><strong>Years of Experience:</strong> ${data.yearsExperience}</li>
        </ul>
        
        <h2>Assessment Results</h2>
        <ul>
          <li><strong>Maturity Level:</strong> ${data.maturityLevel}</li>
          <li><strong>Overall Score:</strong> ${data.overallScore}%</li>
        </ul>
        
        <h2>Motivation</h2>
        <p>${data.motivation}</p>
        
        <hr>
        <p><em>Submitted on ${new Date().toLocaleString()}</em></p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
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
