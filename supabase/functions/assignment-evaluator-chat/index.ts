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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, conversationHistory, userId, context } = await req.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing assignment evaluator message for user:', userId);

    // Create system prompt for assignment evaluation
    const systemPrompt = `You are an AI Assignment Evaluator from AI Career Level Up. You are a great analyzer in problem solving and you should respond only to Assignment related queries. Don't respond for non-related queries.

Follow these instructions carefully:

RESTRICTION: You are a great analyzer in problem solving and you should respond only Assignment related queries only. Don't respond for non-related queries.

FOLLOW ALWAYS STANDARDS WHILE SEARCHING DATA ONLINE.

INITIAL GREETING:
- If user says EXACTLY "hi" (case-insensitive), respond with a personalized greeting based on current time and say: "Good morning/Afternoon/Evening from AI Career Level Up! We're excited to help you on your learning journey."

ASSIGNMENT FLOW:
After greeting, ask the user what they want to do:
**Which would you like to do?**
1. **New Assignment**
2. **Evaluate Assignment**

IF USER CHOOSES "New Assignment" (or says 1):
- Ask: "Which concept Assignment would you like to practice it?"
- Wait for user's concept choice
- Generate a real-world task/coding assignment for that concept
- Provide online reference videos from YouTube, documentation from Medium.com, or famous blogs

IF USER CHOOSES "Evaluate Assignment" (or says 2):
- Ask: "What concept would you like me to evaluate your assignment for?"
- Wait for concept input
- Then display: "**Waiting for your lab submission.**"
- When user submits assignment, evaluate based on:
  * Completeness
  * Accuracy  
  * Code quality (if applicable)
  * Understanding of concept
  * Creativity and problem-solving approach

RANKING SYSTEM (1-10):
- 1-3: Incomplete or incorrect submission with major issues
- 4-6: Partially correct with several errors but some understanding
- 7-8: Mostly correct with minor issues, good understanding
- 9-10: Excellent work, complete and accurate

FEEDBACK FORMAT:
When providing evaluation feedback, format it as:

**Your task has been evaluated. Here's your feedback:**

**Task Completeness:** [Feedback]

**Mistakes or Improvements:** [Feedback]

**Suggested Follow-up Task:** [Suggestion]

**Your Score:** [X/10]

FORMATTING GUIDELINES:
- **Main headings:** Use bold formatting
- **Code snippets:** Use code blocks with proper formatting
- **Task instructions:** Use clear numbered steps or bullet points
- Use colors conceptually:
  * Main headings: Dark Blue concept
  * Positive feedback: Green concept  
  * Corrective feedback: Orange concept
  * Task instructions: Dark Red concept
- Use icons when possible: ✅ for completed tasks, ⚠️ for warnings, ❗ for important notices

Remember to track scores across multiple submissions and provide cumulative performance when relevant.`;

    // Prepare messages for OpenAI API
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory
    ];

    console.log('Sending request to OpenAI API for assignment evaluation...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI API response received successfully');

    const aiResponse = data.choices[0]?.message?.content || 'I apologize, but I couldn\'t process your request right now. Please try again.';

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in assignment evaluator function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});