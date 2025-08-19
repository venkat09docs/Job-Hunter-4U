import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyResumeRequest {
  userId: string;
  evidenceId: string;
  targetKeywords?: string[];
}

interface ResumeAnalysis {
  pages: number;
  words: number;
  has_email: boolean;
  has_phone: boolean;
  has_links: boolean;
  keyword_match_ratio: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, evidenceId, targetKeywords = [] }: VerifyResumeRequest = await req.json();

    // Get the evidence record
    const { data: evidence, error: evidenceError } = await supabaseClient
      .from('career_task_evidence')
      .select('*')
      .eq('id', evidenceId)
      .single();

    if (evidenceError || !evidence) {
      throw new Error('Evidence not found');
    }

    // Download and analyze the resume file
    let analysis: ResumeAnalysis;
    
    if (evidence.file_urls && evidence.file_urls.length > 0) {
      // Download the file from storage
      const fileName = evidence.file_urls[0].split('/').pop();
      const { data: fileData } = await supabaseClient.storage
        .from('career-evidence')
        .download(fileName);

      if (fileData) {
        // Simple text analysis (in production, you'd use a proper PDF parser)
        const text = await fileData.text().catch(() => '');
        
        analysis = analyzeResumeText(text, targetKeywords);
      } else {
        analysis = getDefaultAnalysis();
      }
    } else {
      analysis = getDefaultAnalysis();
    }

    // Save analysis results
    await supabaseClient
      .from('resume_checks')
      .upsert({
        user_id: userId,
        evidence_id: evidenceId,
        ...analysis,
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        message: 'Resume analysis completed'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in verify-resume function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

function analyzeResumeText(text: string, targetKeywords: string[]): ResumeAnalysis {
  const words = text.split(/\s+/).length;
  const pages = Math.ceil(words / 250); // Rough estimate

  // Check for email pattern
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const has_email = emailRegex.test(text);

  // Check for phone pattern
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/;
  const has_phone = phoneRegex.test(text);

  // Check for links
  const linkRegex = /(https?:\/\/[^\s]+|linkedin\.com|github\.com)/i;
  const has_links = linkRegex.test(text);

  // Calculate keyword match ratio
  let keywordMatches = 0;
  if (targetKeywords.length > 0) {
    targetKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    });
  }
  const keyword_match_ratio = targetKeywords.length > 0 
    ? keywordMatches / targetKeywords.length 
    : 0;

  return {
    pages,
    words,
    has_email,
    has_phone,
    has_links,
    keyword_match_ratio
  };
}

function getDefaultAnalysis(): ResumeAnalysis {
  return {
    pages: 1,
    words: 0,
    has_email: false,
    has_phone: false,
    has_links: false,
    keyword_match_ratio: 0
  };
}

serve(handler);