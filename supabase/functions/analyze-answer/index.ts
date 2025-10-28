import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, answer, questionType } = await req.json();

    if (!question || !answer) {
      return new Response(
        JSON.stringify({ error: 'Question and answer are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct the analysis prompt
    const systemPrompt = `You are an expert assignment evaluator. Analyze the student's answer and provide constructive feedback.`;

    const userPrompt = `Question Type: ${questionType || 'Unknown'}

Question: ${question}

Student's Answer: ${answer}

Analyze this answer and provide detailed feedback including relevance, quality rating, strengths, areas for improvement, and suggestions. Also assign a score of 1 if the answer is Good or Excellent, and 0 if it's Poor or Fair.`;

    console.log('Calling AI for answer analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_answer',
              description: 'Analyze student answer and provide feedback with scoring',
              parameters: {
                type: 'object',
                properties: {
                  score: {
                    type: 'number',
                    enum: [0, 1],
                    description: '1 if answer is Good/Excellent, 0 if Poor/Fair'
                  },
                  relevance: {
                    type: 'string',
                    enum: ['Yes', 'Partially', 'No'],
                    description: 'Is the answer relevant to the question?'
                  },
                  quality_rating: {
                    type: 'string',
                    enum: ['Poor', 'Fair', 'Good', 'Excellent'],
                    description: 'Overall quality of the answer'
                  },
                  strengths: {
                    type: 'string',
                    description: 'Key strengths in the answer'
                  },
                  areas_for_improvement: {
                    type: 'string',
                    description: 'Specific areas that need improvement'
                  },
                  suggestions: {
                    type: 'string',
                    description: 'Actionable suggestions for enhancement'
                  }
                },
                required: ['score', 'relevance', 'quality_rating', 'strengths', 'areas_for_improvement', 'suggestions'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_answer' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service credits exhausted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to analyze answer' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    
    if (!toolCall || !toolCall.function.arguments) {
      console.error('No tool call found in response');
      return new Response(
        JSON.stringify({ error: 'Failed to parse analysis results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysisData = JSON.parse(toolCall.function.arguments);
    
    // Format the analysis text for display
    const analysisText = `**Relevance:** ${analysisData.relevance}
**Quality Rating:** ${analysisData.quality_rating}
**Score:** ${analysisData.score}/1

**Strengths:** ${analysisData.strengths}

**Areas for Improvement:** ${analysisData.areas_for_improvement}

**Suggestions:** ${analysisData.suggestions}`;

    console.log('Answer analysis completed successfully', { score: analysisData.score });

    return new Response(
      JSON.stringify({ 
        analysis: analysisText,
        score: analysisData.score,
        quality_rating: analysisData.quality_rating,
        relevance: analysisData.relevance
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-answer function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
