import { getStore } from '@netlify/blobs';

export async function handler(event: {
  httpMethod: string;
  body: string | null;
  queryStringParameters?: Record<string, string>;
}) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  try {
    const store = getStore({ name: 'heavyduty-vault' });

    // GET: fetch workouts by key
    if (event.httpMethod === 'GET') {
      const syncKey = event.queryStringParameters?.key;
      if (!syncKey) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing key parameter' }),
        };
      }

      const normalizedKey = syncKey.toUpperCase().trim();
      const existingData = await store.get(normalizedKey, { type: 'json' });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          found: Boolean(existingData),
          data: existingData || null,
        }),
      };
    }

    // POST: save/merge workouts by key
    if (event.httpMethod === 'POST') {
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Empty body' }),
        };
      }

      const payload = JSON.parse(event.body);
      if (!payload.syncKey) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing syncKey in payload' }),
        };
      }

      const normalizedKey = payload.syncKey.toUpperCase().trim();
      payload.updatedAt = new Date().toISOString();

      await store.setJSON(normalizedKey, payload);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          syncKey: normalizedKey,
          updatedAt: payload.updatedAt,
          workoutCount: payload.workouts?.length || 0,
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
}
