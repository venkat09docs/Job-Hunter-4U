import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResumeParseRequest {
  resumeUrl: string;
  userId: string;
}

interface ParsedResumeData {
  summary: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    description?: string;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting resume parsing function');
    
    // Use service role key to bypass RLS for portfolio operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { resumeUrl, userId }: ResumeParseRequest = await req.json();
    
    if (!resumeUrl || !userId) {
      throw new Error('Missing required fields: resumeUrl and userId');
    }

    console.log('Processing resume for user:', userId);

    // Download the resume file
    console.log('Downloading resume from:', resumeUrl);
    const fileResponse = await fetch(resumeUrl);
    if (!fileResponse.ok) {
      throw new Error('Failed to download resume file');
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const fileBase64 = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));

    // Get Lovable API key
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Use Lovable AI to parse the resume
    console.log('Parsing resume with AI');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a resume parser. Extract structured information from resumes and return it as JSON. 
            Always return valid JSON with this exact structure:
            {
              "summary": "Professional summary or objective",
              "skills": ["skill1", "skill2", ...],
              "experience": [
                {
                  "title": "Job Title",
                  "company": "Company Name",
                  "duration": "Start - End",
                  "description": "Job description"
                }
              ],
              "education": [
                {
                  "degree": "Degree Name",
                  "institution": "School/University",
                  "year": "Year or Duration",
                  "description": "Optional details"
                }
              ]
            }`
          },
          {
            role: 'user',
            content: `Parse this resume and extract all information. Return only valid JSON, no additional text:\n\n${fileBase64.substring(0, 100000)}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI parsing failed:', aiResponse.status, errorText);
      throw new Error(`AI parsing failed: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    console.log('AI parsing result:', aiResult);

    // Extract parsed data from AI response
    let parsedData: ParsedResumeData;
    try {
      const content = aiResult.choices[0].message.content;
      const parsed = JSON.parse(content);
      parsedData = {
        summary: parsed.summary || '',
        skills: parsed.skills || [],
        experience: parsed.experience || [],
        education: parsed.education || []
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to empty data if parsing fails
      parsedData = {
        summary: 'Resume uploaded successfully',
        skills: [],
        experience: [],
        education: []
      };
    }

    // Update or create portfolio record
    const { data: existingPortfolio, error: fetchError } = await supabaseClient
      .from('portfolios')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching existing portfolio:', fetchError);
    }

    let portfolioData;
    if (existingPortfolio) {
      // Update existing portfolio
      const { data, error } = await supabaseClient
        .from('portfolios')
        .update({
          resume_url: resumeUrl,
          parsed_summary: parsedData.summary,
          skills: parsedData.skills,
          experience: parsedData.experience,
          education: parsedData.education,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      portfolioData = data;
    } else {
      // Create new portfolio
      const { data, error } = await supabaseClient
        .from('portfolios')
        .insert({
          user_id: userId,
          resume_url: resumeUrl,
          parsed_summary: parsedData.summary,
          skills: parsedData.skills,
          experience: parsedData.experience,
          education: parsedData.education
        })
        .select()
        .single();

      if (error) throw error;
      portfolioData = data;
    }

    console.log('Portfolio updated successfully:', portfolioData.id);

    // Also create/update public_profiles entry for shareable URL
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('username, full_name')
      .eq('user_id', userId)
      .single();

    if (userProfile) {
      // Create or update public profile using username as slug
      const { error: publicProfileError } = await supabaseClient
        .from('public_profiles')
        .upsert({
          user_id: userId,
          slug: userProfile.username,
          full_name: userProfile.full_name,
          bio: parsedData.summary,
          is_public: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (publicProfileError) {
        console.error('Error creating public profile:', publicProfileError);
      } else {
        console.log('Public profile created/updated successfully');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Resume parsed and portfolio updated successfully',
        data: portfolioData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in parse-resume function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});