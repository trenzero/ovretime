export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');
    
    // 简单的API路由处理
    if (path.startsWith('settings')) {
        return handleSettings(request, env);
    } else if (path.startsWith('records')) {
        return handleRecords(request, env);
    }
    
    return new Response('Not Found', { status: 404 });
}

async function handleSettings(request, env) {
    const SETTINGS_KEY = 'overtime_settings';
    
    switch (request.method) {
        case 'GET':
            const settings = await env.KV_NAMESPACE.get(SETTINGS_KEY, 'json');
            return new Response(JSON.stringify(settings || {}), {
                headers: { 'Content-Type': 'application/json' }
            });
            
        case 'POST':
            const newSettings = await request.json();
            await env.KV_NAMESPACE.put(SETTINGS_KEY, JSON.stringify(newSettings));
            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
            
        default:
            return new Response('Method not allowed', { status: 405 });
    }
}

async function handleRecords(request, env) {
    const RECORDS_KEY = 'overtime_records';
    
    switch (request.method) {
        case 'GET':
            const records = await env.KV_NAMESPACE.get(RECORDS_KEY, 'json');
            return new Response(JSON.stringify(records || []), {
                headers: { 'Content-Type': 'application/json' }
            });
            
        case 'POST':
            const newRecords = await request.json();
            await env.KV_NAMESPACE.put(RECORDS_KEY, JSON.stringify(newRecords));
            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
            
        default:
            return new Response('Method not allowed', { status: 405 });
    }
}