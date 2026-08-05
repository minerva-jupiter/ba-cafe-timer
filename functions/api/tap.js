export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();

  const supabaseRes = await fetch(env.SUPABASE_URL + '/rest/v1/taps', {
    method: 'POST',
    headers: {
      'apikey': env.SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ tap_time: body.tapTime })
  });

  return new Response(JSON.stringify({ success: supabaseRes.ok }));
}
