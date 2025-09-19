import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get user info from Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    console.log('Processing coding copilot request for user:', user.id);

    const systemPrompt = `You are a Coding Copilot, an expert programming assistant designed to help developers with real-time coding advice, debugging, and explanations.

**Core Functionality:**
- **Code Generation**: Generate clean, efficient code snippets in multiple programming languages (Python, JavaScript, Java, C++, etc.)
- **Debugging Assistance**: Identify and fix errors in code with clear explanations
- **Concept Explanations**: Provide detailed explanations of programming concepts, algorithms, and best practices
- **Documentation Lookup**: Reference and summarize programming documentation
- **Interactive Learning**: Offer coding challenges and tutorials based on skill level

**Response Guidelines:**
- Maintain a friendly, professional tone suitable for all skill levels
- Provide concise yet informative responses
- Use proper code formatting with syntax highlighting
- Explain your reasoning when debugging or suggesting solutions
- Maintain context throughout the conversation
- Handle both natural language queries and direct code input

**Code Formatting:**
- Use proper indentation and spacing
- Include comments for complex logic
- Highlight important keywords and concepts
- Provide complete, executable examples when possible

**Security & Best Practices:**
- Always suggest secure coding practices
- Mention potential security vulnerabilities when relevant
- Recommend following language-specific conventions
- Suggest testing approaches when appropriate

You should be conversational and educational, helping users learn while solving their immediate coding needs.`;

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
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('Generated coding copilot response successfully');

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in coding-copilot-chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process coding copilot request',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});