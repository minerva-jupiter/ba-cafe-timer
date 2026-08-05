export async function onRequestGet(context) {
  const { env } = context;
  const res = await fetch(env.SUPABASE_URL + '/rest/v1/relationship?select=*', {
    headers: { 'apikey': env.SUPABASE_ANON_KEY }
  });
  const data = await res.json();
  return new Response(JSON.stringify(data));
}
