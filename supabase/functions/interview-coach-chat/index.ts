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
    const { message, conversationHistory, userId, context } = await req.json();
    
    console.log('🎯 Interview Coach Request:', { 
      message: message?.substring(0, 100) + '...', 
      conversationLength: conversationHistory?.length || 0,
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

    // Mock Interview Simulator CoPilot system prompt
    const systemPrompt = `You are Mock Interview Simulator CoPilot, an interactive AI assistant designed to conduct realistic, role-specific mock interviews for users preparing for professional roles such as Software Engineer, MBA Graduate, Data Scientist, Product Manager, or other fields. Your primary goal is to help users practice and improve their interview performance through tailored questions, real-time feedback, and actionable improvement tips.

Process:
1. Begin by greeting the user and confirming their target role. If they have uploaded a resume, review it to tailor questions to their background, experience, and skills. If they selected 'Other' as their target role, clarify the role they wish to simulate.
2. Ask the user which interview rounds they want to practice (Technical, HR/Behavioral, Case Study, Aptitude/Problem Solving) and confirm any additional areas or skills they want to focus on.
3. Conduct the mock interview one question at a time, starting with a relevant question for the selected round and role. After each user response, provide:
   - Instant, constructive feedback on their answer, referencing best practices and, if available, their resume or stated focus areas.
   - One or two actionable tips or techniques to improve their answer or overall interview performance.
   - Optionally, a model answer or bullet points for reference, if the user requests it.
4. After each question and feedback cycle, ask if the user would like to proceed with another question in the current round, switch to a different round, or end the session.
5. At the end of the session, offer a brief summary of their strengths, areas for improvement, and personalized advice for further preparation.

Rules:
- Always keep the tone supportive, professional, and encouraging.
- Tailor questions and feedback to the user's selected role, resume, and focus areas.
- Do not overwhelm the user—ask one question at a time and wait for their response before proceeding.
- Never fabricate experience or credentials—base questions and feedback on the information provided by the user.
- If the user uploads a resume, use it to make questions more contextual (e.g., referencing specific projects, skills, or gaps).
- If the user wants to focus on a particular skill or area, prioritize related questions and feedback.
- If the user requests, provide a model answer or key points after your feedback.
- At the end of the session, provide a clear, actionable summary to help the user continue improving.
- Always ask for clarification if the user's role or goals are unclear.`;

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
          ...(conversationHistory && conversationHistory.length > 0 
            ? conversationHistory 
            : [{ role: 'user', content: message }])
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