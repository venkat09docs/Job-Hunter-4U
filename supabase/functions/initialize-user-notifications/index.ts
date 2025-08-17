import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InitializeNotificationsRequest {
  user_id?: string; // Optional: specific user, if not provided, initializes for all users missing preferences
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: InitializeNotificationsRequest = {};
    if (req.method === "POST") {
      body = await req.json();
    }

    // Get users who need notification preferences initialized
    let query = supabase
      .from('user_roles')
      .select(`
        user_id,
        role,
        profiles!inner (
          user_id,
          full_name
        )
      `);

    if (body.user_id) {
      query = query.eq('user_id', body.user_id);
    }

    // Only get users who don't have any notification preferences yet
    const { data: usersWithoutPrefs, error: usersError } = await query;

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    if (!usersWithoutPrefs || usersWithoutPrefs.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "No users found that need notification preferences initialization",
          count: 0 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Filter out users who already have notification preferences
    const usersToProcess = [];
    for (const user of usersWithoutPrefs) {
      const { data: existingPrefs } = await supabase
        .from('notification_preferences')
        .select('user_id')
        .eq('user_id', user.user_id)
        .limit(1);

      if (!existingPrefs || existingPrefs.length === 0) {
        usersToProcess.push(user);
      }
    }

    console.log(`Processing ${usersToProcess.length} users for notification preferences initialization`);

    // Initialize notification preferences for each user
    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    for (const user of usersToProcess) {
      try {
        // Call the database function to initialize preferences
        const { error: initError } = await supabase.rpc(
          'initialize_notification_preferences',
          {
            target_user_id: user.user_id,
            user_role: user.role
          }
        );

        if (initError) {
          console.error(`Error initializing preferences for user ${user.user_id}:`, initError);
          errors.push({
            user_id: user.user_id,
            error: initError.message
          });
          errorCount++;
        } else {
          console.log(`Successfully initialized preferences for user ${user.user_id}`);
          successCount++;
        }
      } catch (error) {
        console.error(`Exception initializing preferences for user ${user.user_id}:`, error);
        errors.push({
          user_id: user.user_id,
          error: error.message
        });
        errorCount++;
      }
    }

    const response = {
      message: `Notification preferences initialization completed`,
      total_users_processed: usersToProcess.length,
      successful_initializations: successCount,
      failed_initializations: errorCount,
      errors: errors
    };

    console.log("Initialization complete:", response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in initialize-user-notifications function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to initialize user notification preferences"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);