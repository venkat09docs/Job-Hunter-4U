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
    const systemPrompt = `You are an expert assignment evaluator. Analyze the student's answer and provide constructive feedback.

Format your response EXACTLY as follows:
SCORE: [0 or 1]
RELEVANCE: [Yes/Partially/No]
QUALITY: [Poor/Fair/Good/Excellent]
STRENGTHS: [Key strengths]
IMPROVEMENTS: [Areas needing improvement]
SUGGESTIONS: [Actionable suggestions]

Score 1 if the answer is Good or Excellent, 0 if Poor or Fair.`;

    const userPrompt = `Question Type: ${questionType || 'Unknown'}

Question: ${question}

Student's Answer: ${answer}

Analyze this answer and provide feedback.`;

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
    const content = data.choices[0].message.content;
    
    // Parse the structured response
    const scoreMatch = content.match(/SCORE:\s*(\d+)/i);
    const relevanceMatch = content.match(/RELEVANCE:\s*(\w+)/i);
    const qualityMatch = content.match(/QUALITY:\s*(\w+)/i);
    const strengthsMatch = content.match(/STRENGTHS:\s*(.+?)(?=IMPROVEMENTS:|$)/is);
    const improvementsMatch = content.match(/IMPROVEMENTS:\s*(.+?)(?=SUGGESTIONS:|$)/is);
    const suggestionsMatch = content.match(/SUGGESTIONS:\s*(.+?)$/is);
    
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const relevance = relevanceMatch ? relevanceMatch[1] : 'Unknown';
    const quality_rating = qualityMatch ? qualityMatch[1] : 'Unknown';
    const strengths = strengthsMatch ? strengthsMatch[1].trim() : 'Not provided';
    const improvements = improvementsMatch ? improvementsMatch[1].trim() : 'Not provided';
    const suggestions = suggestionsMatch ? suggestionsMatch[1].trim() : 'Not provided';
    
    // Format the analysis text for display
    const analysisText = `**Relevance:** ${relevance}
**Quality Rating:** ${quality_rating}
**Score:** ${score}/1

**Strengths:** ${strengths}

**Areas for Improvement:** ${improvements}

**Suggestions:** ${suggestions}`;

    console.log('Answer analysis completed successfully', { score });

    return new Response(
      JSON.stringify({ 
        analysis: analysisText,
        score,
        quality_rating,
        relevance
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
