import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DatabaseUser {
  id: string;
  email: string;
  raw_user_meta_data: any;
}

interface Profile {
  user_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting profile sync process...');
    
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      throw authError;
    }

    console.log(`📊 Found ${authUsers?.users?.length || 0} auth users`);

    // Get existing profiles
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id');

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`📊 Found ${existingProfiles?.length || 0} existing profiles`);

    // Find users without profiles
    const existingProfileIds = new Set(existingProfiles?.map(p => p.user_id) || []);
    const usersWithoutProfiles = authUsers.users.filter(user => !existingProfileIds.has(user.id));

    console.log(`🔍 Found ${usersWithoutProfiles.length} users without profiles`);

    if (usersWithoutProfiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All users already have profiles',
          synced: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Create profiles for missing users
    const profilesToCreate = usersWithoutProfiles.map(user => {
      const metadata = user.user_metadata || {};
      return {
        user_id: user.id,
        full_name: metadata.full_name || metadata['Display Name'] || user.email?.split('@')[0] || 'User',
        username: metadata.username || user.email?.split('@')[0] || 'user',
        email: user.email || null,
        industry: metadata.industry || 'IT'
      };
    });

    console.log('📝 Creating profiles:', profilesToCreate.length);

    const { data: insertedProfiles, error: insertError } = await supabase
      .from('profiles')
      .insert(profilesToCreate)
      .select();

    if (insertError) {
      console.error('❌ Error creating profiles:', insertError);
      throw insertError;
    }

    console.log(`✅ Successfully created ${insertedProfiles?.length || 0} profiles`);

    // Ensure all users have default 'user' role
    const { data: existingRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'user');

    if (rolesError) {
      console.error('❌ Error fetching roles:', rolesError);
      throw rolesError;
    }

    const existingRoleIds = new Set(existingRoles?.map(r => r.user_id) || []);
    const usersWithoutRoles = authUsers.users.filter(user => !existingRoleIds.has(user.id));

    if (usersWithoutRoles.length > 0) {
      const rolesToCreate = usersWithoutRoles.map(user => ({
        user_id: user.id,
        role: 'user'
      }));

      const { error: roleInsertError } = await supabase
        .from('user_roles')
        .insert(rolesToCreate);

      if (roleInsertError) {
        console.error('❌ Error creating roles:', roleInsertError);
      } else {
        console.log(`✅ Created ${rolesToCreate.length} user roles`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully synced ${insertedProfiles?.length || 0} profiles`,
        synced: insertedProfiles?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('💥 Sync failed:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Sync failed', 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});