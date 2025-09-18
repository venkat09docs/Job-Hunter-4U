import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!openAIApiKey) {
    console.error('❌ OPENAI_API_KEY not configured');
    return new Response(JSON.stringify({ 
      error: 'OpenAI API key not configured. Please add your API key in the Supabase dashboard.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { message, userId, context } = await req.json();
    
    console.log('🎯 Interview Coach Request:', { 
      message: message?.substring(0, 100) + '...', 
      userId, 
      context,
      timestamp: new Date().toISOString()
    });

    if (!message || !userId) {
      return new Response(JSON.stringify({ 
        error: 'Message and user ID are required.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Interview Coach system prompt
    const systemPrompt = `You are an expert AI Interview Coach with years of experience helping candidates succeed in job interviews. Your role is to:

1. **Interview Preparation**: Help candidates prepare for various types of interviews (behavioral, technical, case studies, etc.)

2. **Practice Questions**: Provide realistic interview questions and guide candidates through practice answers

3. **Feedback & Improvement**: Offer constructive feedback on answers and suggest improvements

4. **Industry-Specific Guidance**: Tailor advice based on the role and industry

5. **Confidence Building**: Help reduce interview anxiety and build confidence

**Your Expertise Covers:**
- Behavioral interview questions (STAR method)
- Technical interviews for various roles
- System design interviews
- Case study interviews
- Salary negotiation tips
- Body language and presentation skills
- Questions to ask interviewers
- Interview follow-up strategies

**Communication Style:**
- Be encouraging and supportive
- Provide actionable, specific advice
- Use examples when helpful
- Break down complex concepts into digestible parts
- Ask clarifying questions to better help the candidate

**Always:**
- Be positive and motivating
- Provide practical, real-world advice
- Help build the candidate's confidence
- Offer specific examples and frameworks
- Encourage practice and preparation

Start each conversation by understanding what type of interview they're preparing for and their specific needs.`;

    console.log('🤖 Making OpenAI API call...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ OpenAI response received');

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response generated from OpenAI');
    }

    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      response: aiResponse,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Interview coach error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});