import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationEmailRequest {
  notification_id: string;
  user_id: string;
  template_key: string;
  template_vars: Record<string, any>;
}

interface NotificationTemplate {
  id: string;
  template_key: string;
  title_template: string;
  message_template: string;
  email_subject_template: string;
  email_body_template: string;
  category: string;
  is_active: boolean;
}

interface UserProfile {
  user_id: string;
  full_name: string;
  username: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestBody: NotificationEmailRequest = await req.json();
    const { notification_id, user_id, template_key, template_vars } = requestBody;

    console.log(`Processing email notification for template: ${template_key}, user: ${user_id}`);

    // Get the notification template
    const { data: template, error: templateError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('template_key', template_key)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('Template not found:', templateError);
      return new Response(JSON.stringify({ 
        error: 'Template not found',
        template_key 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, email')
      .eq('user_id', user_id)
      .single();

    if (profileError || !profile) {
      console.error('User profile not found:', profileError);
      return new Response(JSON.stringify({ 
        error: 'User profile not found',
        user_id 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user has email notifications enabled for this type
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('email_enabled, is_enabled')
      .eq('user_id', user_id)
      .eq('notification_type', template_key)
      .single();

    const emailEnabled = preferences?.email_enabled !== false && preferences?.is_enabled !== false;
    
    if (!emailEnabled) {
      console.log(`Email notifications disabled for user ${user_id}, template ${template_key}`);
      return new Response(JSON.stringify({ 
        message: 'Email notifications disabled for this user/template combination' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate email content
    const { subject, htmlContent } = generateEmailContent(
      template as NotificationTemplate,
      profile as UserProfile,
      template_vars
    );

    // Log delivery attempt
    await supabase
      .from('notification_delivery_log')
      .insert({
        notification_id,
        delivery_type: 'email',
        status: 'pending'
      });

    // For now, we'll log the email content (in production, integrate with email service)
    console.log('Email Content Generated:', {
      to: profile.email,
      subject,
      html: htmlContent,
      template_key,
      user_id
    });

    // Update notification as email sent (for demo purposes)
    await supabase
      .from('notifications')
      .update({ 
        email_sent: true, 
        email_sent_at: new Date().toISOString() 
      })
      .eq('id', notification_id);

    // Update delivery log
    await supabase
      .from('notification_delivery_log')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('notification_id', notification_id)
      .eq('delivery_type', 'email');

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Email notification processed successfully',
      notification_id,
      email_sent_to: profile.email,
      subject
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in send-smart-notification-email:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

function generateEmailContent(
  template: NotificationTemplate,
  profile: UserProfile,
  templateVars: Record<string, any>
): { subject: string; htmlContent: string } {
  const userName = profile.full_name || profile.username || 'there';
  
  let subject = template.email_subject_template || template.title_template;
  let htmlContent = template.email_body_template || template.message_template;

  // Replace {{user_name}}
  subject = subject.replace(/\{\{user_name\}\}/g, userName);
  htmlContent = htmlContent.replace(/\{\{user_name\}\}/g, userName);

  // Replace template variables
  Object.entries(templateVars).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    subject = subject.replace(regex, String(value || ''));
    htmlContent = htmlContent.replace(regex, String(value || ''));
  });

  // Enhanced HTML email template
  const fullHtmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background-color: #ffffff;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #007bff;
          margin: 0;
          font-size: 24px;
        }
        .content {
          margin-bottom: 30px;
        }
        .cta-button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #007bff;
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          border-top: 1px solid #e9ecef;
          padding-top: 20px;
          margin-top: 30px;
          font-size: 14px;
          color: #6c757d;
          text-align: center;
        }
        .category-badge {
          display: inline-block;
          padding: 4px 12px;
          background-color: #e9ecef;
          color: #495057;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Career Growth Platform</h1>
        </div>
        
        <div class="content">
          <div class="category-badge">${template.category.toUpperCase()}</div>
          <p>${htmlContent}</p>
          
          ${templateVars.action_url ? `
            <a href="${templateVars.action_url}" class="cta-button">
              Take Action
            </a>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>This notification was sent because you have enabled email notifications for ${template.category} activities.</p>
          <p><a href="${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/notifications/preferences">Manage your notification preferences</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    subject,
    htmlContent: fullHtmlContent
  };
}

serve(handler);