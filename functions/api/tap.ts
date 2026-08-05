import { createClient } from '@supabase/supabase-js';
import { addHours, isAfter, startOfHour, setHours, addDays } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

// Environment Variables Interface
interface Env {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  ONESIGNAL_REST_API_KEY: string;
  NEXT_PUBLIC_ONESIGNAL_APP_ID: string;
}

// Helper to create Supabase client
const getSupabaseClient = (env: Env, authHeader: string) => {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } }
  );
};

// From src/lib/messages.ts
interface NotificationMessage {
  title: string;
  body: string;
}

const messages: NotificationMessage[] = [
  { 
    title: "先生！お仕事の時間ですよ！", 
    body: "生徒さんたちが待ってます！" 
  },
  { 
    title: "先生、お仕事お疲れ様です。", 
    body: "生徒のみなさんがお待ちです。" 
  },
];

// From src/lib/timeUtils.ts
const JST_TZ = 'Asia/Tokyo';

const CALENDAR_LIMITS = {
  MIN: new Date(2025, 12, 1),
  MAX: new Date(),
} as const;

const getNextBoundary = (date: Date): Date => {
  const jst = toZonedTime(date, JST_TZ);
  const hour = jst.getHours();

  let boundary = startOfHour(jst);
  if (hour < 4) {
    boundary = setHours(boundary, 4);
  } else if (hour < 16) {
    boundary = setHours(boundary, 16);
  } else {
    boundary = setHours(addDays(boundary, 1), 4);
  }
  return fromZonedTime(boundary, JST_TZ);
};

const getSessionEndTime = (lastTapTime: Date | null): Date | null => {
  if (!lastTapTime) return null;

  const baseTime = new Date(lastTapTime);
  baseTime.setMilliseconds(0);

  const standardEnd = addHours(baseTime, 3);
  const boundary = getNextBoundary(baseTime);

  return isAfter(standardEnd, boundary) ? boundary : standardEnd;
};

const shouldScheduleNotification = (tapTime: Date): boolean => {
  const jst = toZonedTime(tapTime, JST_TZ);
  const h = jst.getHours();
  
  if ((h >= 1 && h < 4) || (h >= 13 && h < 16)) return false;

  const endTime = getSessionEndTime(tapTime);
  if (!endTime) return false;

  const standardEnd = addHours(tapTime, 3);
  standardEnd.setMilliseconds(0);

  return endTime.getTime() === standardEnd.getTime();
};

// Cloudflare Pages Function Handlers
export async function onRequestOptions({ request, env }: EventContext<Env, any, any>): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', // Adjust as needed, 'https://rabbit1.cc' was in original
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function onRequestPost({ request, env }: EventContext<Env, any, any>): Promise<Response> {
  try {
    const body = await request.json();
    const { tapTime, ticket1Time, ticket2Time } = body;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const supabase = getSupabaseClient(env, authHeader);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const now = new Date();
    now.setMilliseconds(0);
    const nowIso = now.toISOString();

    // 1. カフェタップの処理
    if (tapTime) {
      const { data: lastTap } = await supabase
        .from('taps')
        .select('tap_time')
        .eq('user_id', user.id)
        .order('tap_time', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const currentTapDate = new Date(tapTime);
      currentTapDate.setMilliseconds(0);

      if (lastTap) {
        const lastTapDate = new Date(lastTap.tap_time);
        const diffMs = currentTapDate.getTime() - lastTapDate.getTime();

        if (diffMs < 3600000) { 
          if (shouldScheduleNotification(lastTapDate) === shouldScheduleNotification(currentTapDate)) {
            return new Response(JSON.stringify({ error: 'Duplicate tap' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
          }
        }
      }
      await supabase.from('taps').insert([{ user_id: user.id, tap_time: currentTapDate.toISOString() }]);
    }

    // 2. プロフィールの更新
    const upsertData: any = { 
      id: user.id, 
      updated_at: nowIso 
    };

    if (ticket1Time !== undefined) {
      const d1 = ticket1Time ? new Date(ticket1Time) : null;
      if (d1) d1.setMilliseconds(0);
      upsertData.ticket1_time = d1 ? d1.toISOString() : null;
    }
    if (ticket2Time !== undefined) {
      const d2 = ticket2Time ? new Date(ticket2Time) : null;
      if (d2) d2.setMilliseconds(0);
      upsertData.ticket2_time = d2 ? d2.toISOString() : null;
    }

    await supabase.from('profiles').upsert(upsertData);

    // 3. 通知予約処理
    if (tapTime && shouldScheduleNotification(new Date(tapTime))) {
      const sendAfter = new Date(tapTime);
      sendAfter.setSeconds(0, 0); 
      sendAfter.setHours(sendAfter.getHours() + 3);

      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      
      await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${env.ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
          app_id: env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          include_aliases: { external_id: [user.id] },
          target_channel: "push",
          contents: { en: randomMsg.body, ja: randomMsg.body },
          headings: { en: randomMsg.title, ja: randomMsg.title },
          send_after: sendAfter.toISOString(), 
        })
      });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
