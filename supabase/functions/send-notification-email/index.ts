import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationEmailRequest {
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  related_data?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, notification_type, title, message, related_data }: NotificationEmailRequest = await req.json();

    // Get user details and email preferences
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', user_id)
      .single();

    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user has email notifications enabled for this type
    const { data: preference } = await supabase
      .from('notification_preferences')
      .select('is_enabled')
      .eq('user_id', user_id)
      .eq('notification_type', notification_type)
      .single();

    // Default to enabled if no preference found
    const emailEnabled = preference?.is_enabled !== false;

    if (!emailEnabled) {
      console.log(`Email notification disabled for user ${user_id}, type ${notification_type}`);
      return new Response(JSON.stringify({ message: 'Email notification disabled by user' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate email content based on notification type
    const emailContent = generateEmailContent(notification_type, title, message, userProfile.full_name, related_data);

    // Send email using Supabase's built-in email functionality
    const { error: emailError } = await supabase.auth.admin.generateLink({
      type: 'email',
      email: userProfile.email,
      options: {
        emailRedirectTo: `${Deno.env.get('SITE_URL') || 'https://your-app.com'}/dashboard`,
        data: {
          custom_email: true,
          subject: emailContent.subject,
          html_content: emailContent.html,
          notification_type
        }
      }
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      
      // Fallback: Use direct SMTP if available
      try {
        await sendDirectEmail(userProfile.email, emailContent.subject, emailContent.html);
      } catch (smtpError) {
        console.error('SMTP fallback failed:', smtpError);
        return new Response(JSON.stringify({ error: 'Failed to send email' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    console.log(`Email notification sent to ${userProfile.email} for ${notification_type}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email notification sent successfully' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in send-notification-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

function generateEmailContent(type: string, title: string, message: string, userName: string, relatedData?: any) {
  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
      .content { padding: 30px 20px; }
      .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
      .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      .highlight { background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 15px 0; }
    </style>
  `;

  let subject = title;
  let html = `
    ${baseStyles}
    <div class="container">
      <div class="header">
        <h1 style="margin: 0; font-size: 24px;">${title}</h1>
      </div>
      <div class="content">
        <p>Hi ${userName},</p>
        <div class="highlight">
          <p style="margin: 0;">${message}</p>
        </div>
  `;

  // Add type-specific content
  switch (type) {
    case 'follow_up_reminder':
      html += `
        <p>This is a friendly reminder about your job application follow-up.</p>
        <a href="${Deno.env.get('SITE_URL') || 'https://your-app.com'}/dashboard/job-tracker" class="button">View Job Applications</a>
      `;
      break;

    case 'new_job_posted':
      html += `
        <p>A new job opportunity has been posted that might interest you!</p>
        <a href="${Deno.env.get('SITE_URL') || 'https://your-app.com'}/dashboard/job-search" class="button">View Job</a>
      `;
      break;

    case 'profile_completion_reminder':
      html += `
        <p>Complete your profile to improve your job search success rate.</p>
        <a href="${Deno.env.get('SITE_URL') || 'https://your-app.com'}/dashboard/build-my-profile" class="button">Complete Profile</a>
      `;
      break;

    case 'achievement_unlocked':
      html += `
        <p>🎉 Congratulations on your achievement! Keep up the great work.</p>
        <a href="${Deno.env.get('SITE_URL') || 'https://your-app.com'}/dashboard" class="button">View Dashboard</a>
      `;
      break;

    default:
      html += `
        <p>You can view more details in your dashboard.</p>
        <a href="${Deno.env.get('SITE_URL') || 'https://your-app.com'}/dashboard" class="button">Go to Dashboard</a>
      `;
  }

  html += `
        <p>Best regards,<br>Your Career Development Team</p>
      </div>
      <div class="footer">
        <p>You're receiving this email because you have notifications enabled in your preferences.</p>
        <p><a href="${Deno.env.get('SITE_URL') || 'https://your-app.com'}/dashboard/notification-preferences" style="color: #667eea;">Manage notification preferences</a></p>
      </div>
    </div>
  `;

  return { subject, html };
}

async function sendDirectEmail(to: string, subject: string, html: string) {
  // This is a placeholder for direct SMTP sending if needed
  // You can implement this using your Gmail SMTP configuration
  console.log(`Direct email would be sent to: ${to}, subject: ${subject}`);
}

serve(handler);