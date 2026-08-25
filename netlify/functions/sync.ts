// Serverless Cloud Sync Function for Netlify
// Stores encrypted/encoded workout data per syncKey

interface SyncPayload {
  syncKey: string;
  workouts: any[];
  personalRecords: any[];
  settings?: any;
  updatedAt: string;
}

// In-memory cache for fast serverless execution
const globalMemoryStore = new Map<string, SyncPayload>();

export async function handler(event: { httpMethod: string; body: string | null; queryStringParameters?: Record<string, string> }) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  try {
    // GET: Retrieve remote state by syncKey
    if (event.httpMethod === 'GET') {
      const syncKey = event.queryStringParameters?.key;
      if (!syncKey) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing sync key parameter' }),
        };
      }

      const normalizedKey = syncKey.toUpperCase().trim();
      const existingData = globalMemoryStore.get(normalizedKey);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          found: Boolean(existingData),
          data: existingData || null,
        }),
      };
    }

    // POST: Save/Merge remote state
    if (event.httpMethod === 'POST') {
      if (!event.body) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Empty body' }) };
      }

      const payload: SyncPayload = JSON.parse(event.body);
      if (!payload.syncKey) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing syncKey' }) };
      }

      const normalizedKey = payload.syncKey.toUpperCase().trim();
      
      // Store in memory cache
      payload.updatedAt = new Date().toISOString();
      globalMemoryStore.set(normalizedKey, payload);

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

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
}
