/**
 * table-ro AI Proxy — Cloudflare Worker
 * Routes: POST /api/claude, POST /api/openai, POST /api/gemini
 * Secrets: CLAUDE_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY
 */

const CORS_HEADERS = origin => ({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
});

function isAllowedOrigin(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim());
    // Allow localhost for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return origin;
    if (allowed.includes(origin)) return origin;
    return null;
}

export default {
    async fetch(request, env) {
        const origin = isAllowedOrigin(request, env);
        if (!origin) return new Response('Forbidden', { status: 403 });

        const cors = CORS_HEADERS(origin);

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: cors });
        }

        if (request.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405, headers: cors });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            let body = await request.json();
            let upstream;

            if (path === '/api/claude') {
                if (!env.CLAUDE_API_KEY) return jsonError('CLAUDE_API_KEY not configured', 500, cors);
                upstream = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': env.CLAUDE_API_KEY,
                        'anthropic-version': '2023-06-01',
                    },
                    body: JSON.stringify(body),
                });
            } else if (path === '/api/openai') {
                if (!env.OPENAI_API_KEY) return jsonError('OPENAI_API_KEY not configured', 500, cors);
                upstream = await fetch('https://api.openai.com/v1/responses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
                    },
                    body: JSON.stringify(body),
                });
            } else if (path === '/api/gemini') {
                const model = body._model || 'gemini-2.0-flash';
                delete body._model;
                if (!env.GEMINI_API_KEY) return jsonError('GEMINI_API_KEY not configured', 500, cors);
                upstream = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                    }
                );
            } else {
                return jsonError('Not Found', 404, cors);
            }

            const data = await upstream.text();
            return new Response(data, {
                status: upstream.status,
                headers: {...cors, 'Content-Type': 'application/json' },
            });
        } catch (err) {
            return jsonError(err.message || 'Internal error', 500, cors);
        }
    },
};

function jsonError(message, status, cors) {
    return new Response(JSON.stringify({ error: { message } }), {
        status,
        headers: {...cors, 'Content-Type': 'application/json' },
    });
}