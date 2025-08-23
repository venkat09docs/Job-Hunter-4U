import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Testing points awarding for user:', user.id);

    // Check current user points
    const { data: currentPoints, error: pointsError } = await supabase
      .from('user_activity_points')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (pointsError) {
      console.error('Error fetching current points:', pointsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch current points' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const totalPoints = currentPoints?.reduce((sum, record) => sum + (record.points_earned || 0), 0) || 0;
    console.log('Current total points for user:', totalPoints);

    // Test adding 5 points
    const testPointsData = {
      user_id: user.id,
      activity_type: 'test_assignment',
      activity_id: `test_${Date.now()}`,
      points_earned: 5,
      activity_date: new Date().toISOString().split('T')[0]
    };

    console.log('Attempting to insert test points:', testPointsData);

    const { data: insertedPoints, error: insertError } = await supabase
      .from('user_activity_points')
      .insert(testPointsData)
      .select();

    if (insertError) {
      console.error('Error inserting test points:', insertError);
      return new Response(JSON.stringify({ 
        error: 'Failed to insert test points',
        details: insertError,
        currentPoints: totalPoints
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully inserted test points:', insertedPoints);

    // Fetch updated points
    const { data: updatedPoints, error: updatedError } = await supabase
      .from('user_activity_points')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const newTotalPoints = updatedPoints?.reduce((sum, record) => sum + (record.points_earned || 0), 0) || 0;
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Test points successfully added',
      previousTotal: totalPoints,
      newTotal: newTotalPoints,
      pointsAdded: 5,
      insertedRecord: insertedPoints[0],
      allPoints: updatedPoints?.slice(0, 10) // Show last 10 records
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in test-points-awarding function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});