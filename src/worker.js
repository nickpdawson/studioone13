/**
 * Cloudflare Worker entry point.
 *
 * Two responsibilities:
 *   1. Handle the GitHub OAuth flow for Sveltia/Decap CMS at /auth and
 *      /auth/callback. The CMS opens /auth in a popup; we redirect to
 *      GitHub, GitHub redirects back to /auth/callback with a code; we
 *      exchange the code for an access token and post it back to the
 *      opener window. The CMS then uses the token to talk to GitHub.
 *
 *   2. Fall through to the static-assets binding (the Astro build output
 *      in ./dist) for every other request — the entire rest of the site.
 *
 * Required env (set in CF dashboard / wrangler.toml):
 *   GITHUB_CLIENT_ID      — public, the OAuth App client id
 *   GITHUB_CLIENT_SECRET  — secret, set via `wrangler secret put`
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/auth' || url.pathname === '/auth/') {
      return handleAuthStart(url, env);
    }

    if (url.pathname === '/auth/callback' || url.pathname === '/auth/callback/') {
      return handleAuthCallback(url, env);
    }

    // Everything else: static assets.
    return env.ASSETS.fetch(request);
  },
};

function handleAuthStart(url, env) {
  if (!env.GITHUB_CLIENT_ID) {
    return new Response(
      'GITHUB_CLIENT_ID is not configured. See README → CMS setup.',
      { status: 500, headers: { 'Content-Type': 'text/plain' } }
    );
  }

  const redirectUri = `${url.origin}/auth/callback`;
  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('scope', 'repo,user');
  authorize.searchParams.set('state', crypto.randomUUID());

  return Response.redirect(authorize.toString(), 302);
}

async function handleAuthCallback(url, env) {
  const code = url.searchParams.get('code');
  if (!code) {
    return new Response('Missing authorization code.', { status: 400 });
  }
  if (!env.GITHUB_CLIENT_SECRET) {
    return new Response(
      'GITHUB_CLIENT_SECRET is not configured. See README → CMS setup.',
      { status: 500 }
    );
  }

  const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'studioone13-cms',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenResp.json();

  if (tokenData.error) {
    return new Response(
      `GitHub auth error: ${tokenData.error_description || tokenData.error}`,
      { status: 400, headers: { 'Content-Type': 'text/plain' } }
    );
  }

  const payload = JSON.stringify({
    token: tokenData.access_token,
    provider: 'github',
  });
  const successMessage = `authorization:github:success:${payload}`;

  // postMessage handshake the CMS expects:
  //   1. opener sends "authorizing:github" to us
  //   2. we reply with "authorization:github:success:{...}"
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Signed in</title></head>
<body style="font-family: -apple-system, system-ui, sans-serif; padding: 2rem; color: #1a1a1a;">
  <p>Signed in. You can close this window.</p>
  <script>
    (function () {
      const successMessage = ${JSON.stringify(successMessage)};
      function relay(e) {
        if (!e.data || typeof e.data !== 'string') return;
        if (e.data.startsWith('authorizing:github')) {
          window.opener.postMessage(successMessage, e.origin);
          window.removeEventListener('message', relay);
        }
      }
      window.addEventListener('message', relay);
      window.opener && window.opener.postMessage('authorizing:github', '*');
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
  });
}
