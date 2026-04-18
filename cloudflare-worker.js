// Cloudflare Worker for R2 File Uploads
// Deploy this to Cloudflare Workers and bind your R2 bucket named "maptiles"

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        case '/upload':
          return await handleUpload(request, env);
        case '/check-folder':
          return await handleCheckFolder(request, env);
        case '/create-folder':
          return await handleCreateFolder(request, env);
        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
};

// CORS headers
function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Add CORS headers to responses
function addCORSHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Handle file uploads
async function handleUpload(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const key = formData.get('key');
    const clubName = formData.get('club_name');
    const type = formData.get('type');
    const relativePath = formData.get('relative_path');

    if (!file || !key || !clubName) {
      console.error('Missing fields:', { file: !!file, key: !!key, clubName: !!clubName });
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Starting upload: ${file.name} to ${key}, size: ${file.size} bytes`);

    // Upload file to R2 with better error handling
    try {
      await env.maptiles.put(key, file);
      console.log(`Successfully uploaded ${file.name} to ${key}`);
    } catch (uploadError) {
      console.error('R2 upload failed:', uploadError);
      throw new Error(`R2 upload failed: ${uploadError.message}`);
    }

    const response = new Response(
      JSON.stringify({ 
        success: true, 
        fileName: file.name,
        key: key,
        clubName: clubName,
        type: type,
        relativePath: relativePath
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      }
    );

    return addCORSHeaders(response);
  } catch (error) {
    console.error('Upload error:', error);
    const response = new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
    return addCORSHeaders(response);
  }
}

// Check if folder exists
async function handleCheckFolder(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { club_name } = await request.json();

    if (!club_name) {
      return new Response(
        JSON.stringify({ error: 'Club name is required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if folder exists by listing objects with that prefix
    const listResult = await env.maptiles.list({
      prefix: `${club_name}/`,
      limit: 1
    });

    const exists = listResult.objects.length > 0;

    const response = new Response(
      JSON.stringify({ exists }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      }
    );

    return addCORSHeaders(response);
  } catch (error) {
    console.error('Check folder error:', error);
    const response = new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
    return addCORSHeaders(response);
  }
}

// Create folder (in R2, folders are created by uploading an empty object)
async function handleCreateFolder(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { club_name } = await request.json();

    if (!club_name) {
      return new Response(
        JSON.stringify({ error: 'Club name is required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create folder by uploading an empty object with folder marker
    const folderKey = `${club_name}/.foldermarker`;
    await env.maptiles.put(folderKey, new Uint8Array(0));

    console.log(`Created folder for ${club_name}`);

    const response = new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      }
    );

    return addCORSHeaders(response);
  } catch (error) {
    console.error('Create folder error:', error);
    const response = new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
    return addCORSHeaders(response);
  }
}
