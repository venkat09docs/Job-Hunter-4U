import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { user_id, payment_amount, payment_id } = await req.json();

    if (!user_id || !payment_amount) {
      throw new Error("Missing required fields: user_id, payment_amount");
    }

    // Call the database function to process affiliate referral
    const { error } = await supabaseClient.rpc('process_affiliate_referral', {
      p_referred_user_id: user_id,
      p_payment_amount: payment_amount,
      p_payment_id: payment_id
    });

    if (error) {
      console.error('Error processing affiliate referral:', error);
      throw error;
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Affiliate referral processed successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in process-affiliate:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});