import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailWebhookPayload {
  from: string;
  to: string;
  subject: string;
  body: string;
  attachments?: Array<{
    name: string;
    content: string; // Base64 encoded
    contentType: string;
  }>;
  headers?: Record<string, string>;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing email evidence webhook...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: EmailWebhookPayload = await req.json();
    console.log('Received email from:', payload.from, 'Subject:', payload.subject);

    // Parse the email to extract assignment ID and evidence data
    // Expected format: "Career Task Evidence - Assignment ID: [UUID]" in subject
    // Or assignment ID in the email body
    const assignmentIdMatch = 
      payload.subject.match(/Assignment ID:\s*([a-f0-9-]{36})/i) ||
      payload.body.match(/Assignment ID:\s*([a-f0-9-]{36})/i) ||
      payload.body.match(/Task ID:\s*([a-f0-9-]{36})/i);

    if (!assignmentIdMatch) {
      console.log('No assignment ID found in email');
      return new Response(JSON.stringify({
        success: false,
        error: 'Assignment ID not found in email subject or body'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const assignmentId = assignmentIdMatch[1];
    console.log('Found assignment ID:', assignmentId);

    // Verify the assignment exists and get user info
    const { data: assignment, error: assignmentError } = await supabase
      .from('career_task_assignments')
      .select(`
        *,
        template:career_task_templates(*)
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      console.error('Assignment not found:', assignmentError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Assignment not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's email to verify sender
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', assignment.user_id)
      .single();

    if (profileError || !profile || payload.from.toLowerCase() !== profile.email.toLowerCase()) {
      console.error('Email sender verification failed');
      return new Response(JSON.stringify({
        success: false,
        error: 'Email sender not authorized for this assignment'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process attachments and upload to storage
    const fileUrls: string[] = [];
    
    if (payload.attachments && payload.attachments.length > 0) {
      console.log(`Processing ${payload.attachments.length} attachments`);
      
      for (const attachment of payload.attachments) {
        try {
          // Decode base64 content
          const fileContent = Deno.decode(attachment.content);
          
          // Generate file path
          const fileExt = attachment.name.split('.').pop() || 'bin';
          const fileName = `email_${Date.now()}_${attachment.name}`;
          const filePath = `${assignment.user_id}/${assignmentId}/${fileName}`;

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('career-evidence')
            .upload(filePath, fileContent, {
              contentType: attachment.contentType
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('career-evidence')
            .getPublicUrl(filePath);

          fileUrls.push(urlData.publicUrl);
          console.log('Uploaded file:', fileName, 'to', urlData.publicUrl);

        } catch (attachmentError) {
          console.error('Error processing attachment:', attachmentError);
          continue;
        }
      }
    }

    // Parse email content for evidence data
    const evidenceData = {
      subject: payload.subject,
      body: cleanEmailBody(payload.body),
      from: payload.from,
      timestamp: payload.timestamp,
      originalEmail: true,
      processed_by_webhook: true
    };

    // Create evidence record
    const { data: evidence, error: evidenceError } = await supabase
      .from('career_task_evidence')
      .insert({
        assignment_id: assignmentId,
        evidence_type: 'email_forward',
        evidence_data: evidenceData,
        file_urls: fileUrls.length > 0 ? fileUrls : null,
        verification_status: 'pending'
      })
      .select()
      .single();

    if (evidenceError) {
      console.error('Error creating evidence record:', evidenceError);
      throw evidenceError;
    }

    // Update assignment status
    const { error: statusError } = await supabase
      .from('career_task_assignments')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', assignmentId);

    if (statusError) {
      console.error('Error updating assignment status:', statusError);
    }

    // Attempt auto-verification if criteria are met
    const autoVerificationResult = await attemptAutoVerification(evidence, assignment.template);

    console.log('Email evidence processed successfully:', {
      assignmentId,
      evidenceId: evidence.id,
      filesUploaded: fileUrls.length,
      autoVerified: autoVerificationResult.verified
    });

    return new Response(JSON.stringify({
      success: true,
      assignmentId,
      evidenceId: evidence.id,
      filesUploaded: fileUrls.length,
      autoVerificationResult,
      message: 'Email evidence processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing email evidence:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Clean email body by removing quoted text, signatures, etc.
function cleanEmailBody(body: string): string {
  // Remove common email reply patterns
  const cleanedBody = body
    .replace(/On .* wrote:/g, '')
    .replace(/From:.*To:.*Subject:.*/gs, '')
    .replace(/-----Original Message-----[\s\S]*/g, '')
    .replace(/________________________________[\s\S]*/g, '')
    .replace(/^\s*>.*$/gm, '') // Remove quoted lines starting with >
    .trim();

  return cleanedBody;
}

// Attempt to auto-verify email evidence based on content and attachments
async function attemptAutoVerification(evidence: any, template: any): Promise<{ verified: boolean; reason: string }> {
  try {
    const evidenceData = evidence.evidence_data;
    
    // Basic verification rules
    if (template.category === 'linkedin_growth') {
      const hasLinkedInKeywords = /linkedin|connection|network|post|share/i.test(evidenceData.body);
      if (hasLinkedInKeywords && evidenceData.body.length > 50) {
        return { verified: true, reason: 'Contains relevant LinkedIn keywords and sufficient detail' };
      }
    }

    if (template.category === 'networking') {
      const hasNetworkingKeywords = /network|professional|meeting|conference|colleague|industry/i.test(evidenceData.body);
      if (hasNetworkingKeywords && evidenceData.body.length > 50) {
        return { verified: true, reason: 'Contains networking-related content and sufficient detail' };
      }
    }

    if (template.category === 'content_creation') {
      const hasContentKeywords = /content|article|post|blog|video|creative|writing|publish/i.test(evidenceData.body);
      if (hasContentKeywords || evidence.file_urls?.length > 0) {
        return { verified: true, reason: 'Contains content creation-related material or attachments' };
      }
    }

    // If email has attachments, it's likely legitimate
    if (evidence.file_urls?.length > 0) {
      return { verified: true, reason: 'Email contains relevant attachments' };
    }

    // If body is substantial and contains task-related keywords
    if (evidenceData.body.length > 100) {
      const taskKeywords = /task|evidence|completion|project|work|progress/i.test(evidenceData.body);
      if (taskKeywords) {
        return { verified: true, reason: 'Substantial email with task-related content' };
      }
    }

    return { verified: false, reason: 'Insufficient content for auto-verification' };

  } catch (error) {
    console.error('Auto-verification failed:', error);
    return { verified: false, reason: 'Auto-verification error' };
  }
}