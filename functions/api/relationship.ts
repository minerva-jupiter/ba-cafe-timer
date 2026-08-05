import { createClient } from '@supabase/supabase-js';

// Helper function to create a Supabase client with the Authorization header
const getSupabaseClient = (env: Env, authHeader: string) => {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } }
  );
};

// Define the environment interface for type safety
interface Env {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}

export async function onRequestOptions({ request }: EventContext<Env, any, any>): Promise<Response> {
  const origin = request.headers.get('Origin');
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

const corsHeaders = (request: Request) => ({
  'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
  'Content-Type': 'application/json',
});

export async function onRequestGet({ request, env }: EventContext<Env, any, any>): Promise<Response> {
  try {
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: corsHeaders(request) });
    }

    const supabase = getSupabaseClient(env, authHeader);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders(request) });
    }

    const { data: relationships, error } = await supabase
      .from('relationship')
      .select('id, char_key, bond_level, recorded_at')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(relationships || []), { headers: corsHeaders(request) });
  } catch (error: any) {
    console.error("GET API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders(request) });
  }
}

export async function onRequestPost({ request, env }: EventContext<Env, any, any>): Promise<Response> {
  try {
    const body = await request.json();
    const { char_key, bond_level, recorded_at } = body;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const supabase = getSupabaseClient(env, authHeader);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const { data: existingRecord, error: checkError } = await supabase
      .from('relationship')
      .select('id')
      .eq('user_id', user.id)
      .eq('char_key', char_key)
      .eq('bond_level', bond_level)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingRecord) {
      return new Response(
        JSON.stringify({ error: `RANK ${bond_level} は既に登録されています。` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabase
      .from('relationship')
      .insert({
        user_id: user.id,
        char_key,
        bond_level,
        recorded_at
      });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders(request) });
  } catch (error: any) {
    console.error("POST API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders(request) });
  }
}

export async function onRequestDelete({ request, env }: EventContext<Env, any, any>): Promise<Response> {
  try {
    const body = await request.json();
    const { id } = body;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const supabase = getSupabaseClient(env, authHeader);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const { error } = await supabase
      .from('relationship')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders(request) });
  } catch (error: any) {
    console.error("DELETE API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders(request) });
  }
}
