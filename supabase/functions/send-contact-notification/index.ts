import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactNotificationRequest {
  type: 'contact' | 'partnership';
  name: string;
  email: string;
  phone?: string;
  message: string;
  organizationName?: string;
  organizationType?: string;
  partnershipDetails?: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      type, 
      name, 
      email, 
      phone, 
      message, 
      organizationName, 
      organizationType,
      partnershipDetails 
    }: ContactNotificationRequest = await req.json();

    console.log(`Processing ${type} notification for:`, { name, email, organizationName });

    let subject: string;
    let htmlContent: string;

    if (type === 'partnership') {
      subject = `New Partnership Application - ${organizationName}`;
      htmlContent = `
        <h2>New Partnership Application Received</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Organization Details</h3>
          <p><strong>Organization:</strong> ${organizationName}</p>
          <p><strong>Contact Person:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
          ${organizationType ? `<p><strong>Organization Type:</strong> ${organizationType}</p>` : ''}
        </div>

        ${partnershipDetails ? `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Partnership Details</h3>
          ${partnershipDetails.denomination ? `<p><strong>Denomination:</strong> ${partnershipDetails.denomination}</p>` : ''}
          ${partnershipDetails.location ? `<p><strong>Location:</strong> ${partnershipDetails.location}</p>` : ''}
          ${partnershipDetails.website ? `<p><strong>Website:</strong> <a href="${partnershipDetails.website}">${partnershipDetails.website}</a></p>` : ''}
          ${partnershipDetails.estimatedEvents ? `<p><strong>Estimated Annual Events:</strong> ${partnershipDetails.estimatedEvents}</p>` : ''}
          ${partnershipDetails.partnershipInterest ? `<p><strong>Partnership Interests:</strong> ${partnershipDetails.partnershipInterest.join(', ')}</p>` : ''}
          ${partnershipDetails.experience ? `<p><strong>Experience:</strong><br>${partnershipDetails.experience.replace(/\n/g, '<br>')}</p>` : ''}
        </div>
        ` : ''}

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Message</h3>
          <p style="white-space: pre-line;">${message}</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 14px;">
            This partnership application was submitted through the MyEcclesia website.<br>
            Please respond within 2 business days as promised to the applicant.
          </p>
        </div>
      `;
    } else {
      subject = `New Contact Message - ${name}`;
      htmlContent = `
        <h2>New Contact Message Received</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Contact Details</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Message</h3>
          <p style="white-space: pre-line;">${message}</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 14px;">
            This message was submitted through the MyEcclesia contact form.
          </p>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "MyEcclesia Notifications <notifications@myecclesia.org.uk>",
      to: ["david@myecclesia.org.uk"],
      subject: subject,
      html: htmlContent,
      replyTo: email, // This allows easy reply to the submitter
    });

    console.log("Email sent successfully:", emailResponse);

    // Also send a confirmation email to the submitter
    const confirmationSubject = type === 'partnership' 
      ? "Partnership Application Received - MyEcclesia"
      : "Message Received - MyEcclesia";

    const confirmationHtml = type === 'partnership' ? `
      <h2>Thank you for your partnership application!</h2>
      <p>Dear ${name},</p>
      <p>We have received your partnership application for <strong>${organizationName}</strong> and appreciate your interest in working with MyEcclesia.</p>
      
      <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>What happens next?</h3>
        <ul>
          <li>Our partnership team will review your application within 2 business days</li>
          <li>We'll contact you at <strong>${email}</strong> to discuss next steps</li>
          <li>If suitable, we'll schedule a consultation call to explore how we can work together</li>
        </ul>
      </div>
      
      <p>In the meantime, feel free to explore our platform and see how other organizations are using MyEcclesia to grow their communities.</p>
      
      <p>If you have any immediate questions, please don't hesitate to contact us.</p>
      
      <p>Blessings,<br>
      The MyEcclesia Partnership Team</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
        <p style="color: #6c757d; font-size: 14px;">
          MyEcclesia - Connecting the UK Christian Community<br>
          <a href="https://myecclesia.org.uk">myecclesia.org.uk</a>
        </p>
      </div>
    ` : `
      <h2>Thank you for contacting us!</h2>
      <p>Dear ${name},</p>
      <p>We have received your message and will get back to you as soon as possible.</p>
      
      <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Your message:</strong></p>
        <p style="white-space: pre-line; font-style: italic;">${message}</p>
      </div>
      
      <p>Our team typically responds within 24 hours during business days.</p>
      
      <p>Thank you for being part of the MyEcclesia community!</p>
      
      <p>Blessings,<br>
      The MyEcclesia Team</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
        <p style="color: #6c757d; font-size: 14px;">
          MyEcclesia - Connecting the UK Christian Community<br>
          <a href="https://myecclesia.org.uk">myecclesia.org.uk</a>
        </p>
      </div>
    `;

    const confirmationResponse = await resend.emails.send({
      from: "MyEcclesia <welcome@myecclesia.org.uk>",
      to: [email],
      subject: confirmationSubject,
      html: confirmationHtml,
    });

    console.log("Confirmation email sent successfully:", confirmationResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationSent: !!emailResponse.data,
        confirmationSent: !!confirmationResponse.data
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-notification function:", error);
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
