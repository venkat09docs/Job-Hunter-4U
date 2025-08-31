import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("🎯 Process-affiliate function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📝 Initializing Supabase client");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("📥 Raw request body parsing...");
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("📋 Request body received:", JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError);
      throw new Error("Invalid JSON in request body");
    }
    
    const { user_id, payment_amount, payment_id } = requestBody;

    // Detailed validation with better logging
    if (!user_id) {
      console.error("❌ Missing user_id");
      throw new Error("Missing required field: user_id");
    }
    
    if (!payment_amount) {
      console.error("❌ Missing payment_amount");
      throw new Error("Missing required field: payment_amount");
    }

    console.log("🔍 Processing affiliate referral for user:", user_id, "amount:", payment_amount, "payment_id:", payment_id);

    // First check if user exists
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(user_id);
    if (userError) {
      console.error("❌ User lookup error:", userError);
      throw new Error(`User lookup failed: ${userError.message}`);
    }
    
    if (!userData?.user) {
      console.error("❌ User not found:", user_id);
      throw new Error("User not found");
    }

    console.log("👤 User found:", userData.user.email);
    console.log("📊 User metadata:", JSON.stringify(userData.user.user_metadata, null, 2));

    // Call the database function to process affiliate referral
    console.log("🔄 Calling process_affiliate_referral function...");
    const { data, error } = await supabaseClient.rpc('process_affiliate_referral', {
      p_referred_user_id: user_id,
      p_payment_amount: payment_amount,
      p_payment_id: payment_id || null
    });

    if (error) {
      console.error('❌ Database function error:', JSON.stringify(error, null, 2));
      throw new Error(`Database function failed: ${error.message || 'Unknown error'}`);
    }

    console.log("✅ Affiliate referral processed successfully:", JSON.stringify(data, null, 2));

    // Ensure data is properly formatted as JSON
    let result;
    try {
      result = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
      console.log("📝 Data is not JSON, returning as-is:", data);
      result = data;
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Affiliate referral processed successfully",
      result: result
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("💥 Error in process-affiliate:", error);
    console.error("💥 Error stack:", error.stack);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || "Unknown error occurred",
      details: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});