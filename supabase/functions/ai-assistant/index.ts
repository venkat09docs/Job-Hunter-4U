import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, context } = await req.json();
    
    console.log('AI assistant request:', { message, userId, context });

    // Here you would integrate with your n8n webhook for AI processing
    // For now, we'll return a mock AI response
    let aiResponse = '';
    
    if (message.toLowerCase().includes('resume')) {
      aiResponse = "I'd be happy to help you with your resume! Here are some key tips: 1) Tailor it to each job application, 2) Use action verbs and quantifiable achievements, 3) Keep it concise (1-2 pages), 4) Include relevant keywords from the job description. Would you like specific advice on any section of your resume?";
    } else if (message.toLowerCase().includes('interview')) {
      aiResponse = "Great question about interviews! Here's my advice: 1) Research the company thoroughly, 2) Prepare STAR method examples for behavioral questions, 3) Practice common technical questions for your field, 4) Prepare thoughtful questions to ask them, 5) Dress appropriately and arrive early. What specific aspect of interview preparation would you like to focus on?";
    } else if (message.toLowerCase().includes('job search')) {
      aiResponse = "Job searching can be challenging, but I'm here to help! Key strategies include: 1) Use multiple job boards and company websites, 2) Network through LinkedIn and professional events, 3) Customize your applications for each role, 4) Follow up appropriately, 5) Consider working with recruiters in your field. What's your current biggest challenge in your job search?";
    } else {
      aiResponse = `I understand you're asking about "${message}". As your AI career assistant, I can help with job search strategies, resume optimization, interview preparation, LinkedIn profile enhancement, salary negotiation, and career development planning. Could you be more specific about what aspect you'd like assistance with?`;
    }

    const response = {
      response: aiResponse,
      timestamp: new Date().toISOString(),
      context: context
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});