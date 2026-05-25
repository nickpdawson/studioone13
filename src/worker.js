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

const CANONICAL_HOST = 'georgedawsonart.com';
const REDIRECT_HOSTS = new Set([
  'one13studio.com',
  'www.one13studio.com',
  'www.georgedawsonart.com',
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Canonical redirect: any non-canonical host → georgedawsonart.com.
    // Keeps the OAuth flow on a single origin (so the GitHub OAuth App's
    // registered callback URL only has to match one host).
    if (REDIRECT_HOSTS.has(url.hostname)) {
      const target = new URL(url.pathname + url.search, `https://${CANONICAL_HOST}`);
      return Response.redirect(target.toString(), 301);
    }

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

  const accessToken = tokenData.access_token;
  const tokenScope = tokenData.scope || 'repo,user';
  const payload = JSON.stringify({
    token: accessToken,
    provider: 'github',
  });
  const successMessage = `authorization:github:success:${payload}`;

  // Sveltia / Decap CMS handshake protocols differ slightly.
  // - Decap (older): popup sends "authorizing:github", waits for the
  //   opener to echo, then sends "authorization:github:success:{...}".
  // - Sveltia (current): popup sends the success message directly.
  // We do both: send the success message on a short delay (gives the
  // opener time to register its listener), AND respond to a handshake
  // if one arrives. Either path completes the auth.
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Signed in</title></head>
<body style="font-family: -apple-system, system-ui, sans-serif; padding: 2rem; color: #1a1a1a; background: #faf8f4;">
  <h2 style="margin-top:0">Signed in</h2>
  <p>If the CMS doesn't continue automatically, tap the button below.</p>
  <button id="finish" style="font-size:1.1rem; padding:0.8rem 1.4rem; background:#1a1a1a; color:#faf8f4; border:0; border-radius:4px;">Continue to CMS</button>
  <pre id="log" style="margin-top:2rem; font-size:11px; color:#6b6660; white-space:pre-wrap; word-break:break-all;"></pre>
  <script>
    (function () {
      var successMessage = ${JSON.stringify(successMessage)};
      var logEl = document.getElementById('log');
      function log(msg) {
        try { logEl.textContent += msg + '\\n'; } catch (e) {}
        try { console.log('[oauth-callback]', msg); } catch (e) {}
      }

      var accessToken = ${JSON.stringify(accessToken)};
      var tokenScope = ${JSON.stringify(tokenScope)};

      log('callback loaded. has opener: ' + (!!window.opener));

      // No opener = top-level navigation (mobile Safari, popup-blocked, etc.)
      // Hand the token to /admin/ via URL fragment + localStorage and redirect.
      // Sveltia/Decap CMS pick the token up on next page load.
      if (!window.opener) {
        log('top-level flow — handing off via fragment + localStorage');
        try {
          var user = JSON.stringify({ token: accessToken, backendName: 'github' });
          // Cover Sveltia + Decap + legacy Netlify CMS keys
          localStorage.setItem('sveltia-cms.user', user);
          localStorage.setItem('decap-cms.user', user);
          localStorage.setItem('netlify-cms-user', user);
          log('wrote user to localStorage (3 keys)');
        } catch (e) {
          log('localStorage error: ' + (e && e.message));
        }
        var fragment = 'access_token=' + encodeURIComponent(accessToken) +
                       '&token_type=bearer&scope=' + encodeURIComponent(tokenScope) +
                       '&provider=github';
        log('redirecting to /admin/#' + fragment.substring(0, 30) + '…');
        setTimeout(function () {
          window.location.replace('/admin/#' + fragment);
        }, 250);
        return;
      }

      function notify() {
        try {
          if (window.opener) {
            window.opener.postMessage(successMessage, '*');
            log('posted success message to opener');
          } else {
            log('window.opener is null — cannot postMessage');
          }
        } catch (e) {
          log('postMessage error: ' + (e && e.message));
        }
      }

      // Legacy Decap handshake — respond to authorizing:github
      window.addEventListener('message', function (e) {
        try {
          if (typeof e.data === 'string' && e.data.indexOf('authorizing:github') === 0) {
            log('got handshake from ' + e.origin);
            if (window.opener) window.opener.postMessage(successMessage, e.origin);
          }
        } catch (err) {
          log('listener error: ' + (err && err.message));
        }
      });

      // Tell opener we're authorizing (in case it's waiting on handshake)
      try {
        if (window.opener) {
          window.opener.postMessage('authorizing:github', '*');
          log('sent authorizing:github');
        }
      } catch (e) {
        log('authorizing post error: ' + (e && e.message));
      }

      // Send the success message multiple times — gives opener time to
      // register listeners on mobile where timing can be flaky.
      notify();
      setTimeout(notify, 100);
      setTimeout(notify, 500);
      setTimeout(notify, 1500);

      // Manual fallback: button closes the window (or focuses opener).
      document.getElementById('finish').addEventListener('click', function () {
        notify();
        try { window.close(); } catch (e) {}
        try { if (window.opener) window.opener.focus(); } catch (e) {}
      });
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
  });
}
