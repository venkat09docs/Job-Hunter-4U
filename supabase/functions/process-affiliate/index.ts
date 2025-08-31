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

    const requestBody = await req.json();
    console.log("📋 Request body received:", requestBody);
    
    const { user_id, payment_amount, payment_id } = requestBody;

    if (!user_id || !payment_amount) {
      console.error("❌ Missing required fields:", { user_id: !!user_id, payment_amount: !!payment_amount });
      throw new Error("Missing required fields: user_id, payment_amount");
    }

    console.log("🔍 Processing affiliate referral for user:", user_id, "amount:", payment_amount);

    // Call the database function to process affiliate referral
    const { data, error } = await supabaseClient.rpc('process_affiliate_referral', {
      p_referred_user_id: user_id,
      p_payment_amount: payment_amount,
      p_payment_id: payment_id
    });

    if (error) {
      console.error('❌ Error processing affiliate referral:', error);
      throw error;
    }

    console.log("✅ Affiliate referral processed successfully:", data);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Affiliate referral processed successfully",
      data
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("💥 Error in process-affiliate:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});