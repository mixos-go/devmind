import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isDebug = (env.VITE_DEBUG === 'true') || process.env.DEBUG === 'true' || process.env.DEBUG;

  const devInfoPlugin = (): Plugin => ({
    name: 'dev-info-plugin',
    configureServer(server) {
      // Log useful debug info without clearing the terminal
      const info = {
        mode,
        port: server.config.server.port,
        host: server.config.server.host,
        allowedHosts: server.config.server.allowedHosts,
        clearScreen: server.config.clearScreen,
        envKeys: {
          GEMINI_API_KEY: !!env.GEMINI_API_KEY,
          VITE_DEBUG: !!env.VITE_DEBUG,
        }
      };

      // Print on start
      // eslint-disable-next-line no-console
      console.log('\n[DevMind] Vite dev server starting with debug info:');
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(info, null, 2));

      // HTTP request logger (useful to see if browser is requesting assets)
      server.middlewares.use(async (req, res, next) => {
        try {
          // eslint-disable-next-line no-console
          console.log(`[DevMind][http] ${req.method} ${req.url}`);

          // Provide a small ping endpoint to verify connectivity
          if (req.url === '/__devmind_ping') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, ts: Date.now() }));
            return;
          }

          // Dev-only Gemini models test endpoint: checks server-side GEMINI_API_KEY connectivity
          if (req.url === '/.devmind/gemini-models') {
            if (!env.GEMINI_API_KEY) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'GEMINI_API_KEY not configured on server' }));
              return;
            }

            const targetUrl = `https://generativelanguage.googleapis.com/v1/models?key=${env.GEMINI_API_KEY}`;
            // eslint-disable-next-line no-console
            console.log(`[DevMind][gemini-test] Fetching models from ${targetUrl}`);

            const fetchRes = await fetch(targetUrl, { method: 'GET' });
            res.statusCode = fetchRes.status;
            fetchRes.headers.forEach((v, k) => {
              try { res.setHeader(k, v); } catch (e) {}
            });
            const buf = await fetchRes.arrayBuffer();
            res.end(Buffer.from(buf));
            return;
          }

          // Dev-only Gemini generate test endpoint: perform a small server-side generate call
          if (req.url === '/.devmind/generate-test') {
            if (!env.GEMINI_API_KEY) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'GEMINI_API_KEY not configured on server' }));
              return;
            }

            // Read request body (optional); if empty, use a small default generation payload
            let raw = '';
            for await (const chunk of req) raw += chunk;

            const defaultBody = JSON.stringify({
              contents: [
                { role: 'user', parts: [{ text: 'Please reply with a short confirmation: "generate-test OK"' }] }
              ],
              generationConfig: { maxOutputTokens: 64 }
            });

            const targetUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${env.GEMINI_API_KEY}`;
            // eslint-disable-next-line no-console
            console.log(`[DevMind][gemini-test] Forwarding generate-test to ${targetUrl}`);

            const fetchRes = await fetch(targetUrl, {
              method: 'POST',
              headers: { 'Content-Type': req.headers['content-type'] || 'application/json' },
              body: raw || defaultBody,
            });

            // Relay status and headers
            res.statusCode = fetchRes.status;
            fetchRes.headers.forEach((v, k) => { try { res.setHeader(k, v); } catch (e) {} });
            const buf = await fetchRes.arrayBuffer();
            res.end(Buffer.from(buf));
            return;
          }

          // Dev-only Gemini proxy: forward browser requests to Google GenAI using server-side key
          if (req.url && req.url.startsWith('/.devmind/gemini')) {
            const targetPath = req.url.replace('/.devmind/gemini', '');
            const targetUrl = `${env.GEMINI_API_KEY ? 'https://generativelanguage.googleapis.com' : ''}${targetPath}${targetPath.includes('?') ? '&' : '?'}key=${env.GEMINI_API_KEY}`;

            // Read request body
            let raw = '';
            for await (const chunk of req) raw += chunk;

            // eslint-disable-next-line no-console
            console.log(`[DevMind][proxy] Forwarding to ${targetUrl}`);

            const fetchRes = await fetch(targetUrl, {
              method: String(req.method),
              headers: { 'Content-Type': req.headers['content-type'] || 'application/json' },
              body: raw || undefined,
            });

            // Relay status and headers
            res.statusCode = fetchRes.status;
            fetchRes.headers.forEach((v, k) => {
              try {
                res.setHeader(k, v);
              } catch (e) {}
            });

            const buf = await fetchRes.arrayBuffer();
            res.end(Buffer.from(buf));
            return;
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[DevMind][proxy] Error forwarding request', e);
        }

        return next();
      });

      // WebSocket connection events
      if (server.ws) {
        server.ws.on('connection', (socket) => {
          // eslint-disable-next-line no-console
          console.log('[DevMind][ws] WebSocket connection established');
          socket.on('close', () => {
            // eslint-disable-next-line no-console
            console.log('[DevMind][ws] WebSocket connection closed');
          });
        });
      }

      server.watcher.on('all', (event, path) => {
        if (isDebug) {
          // eslint-disable-next-line no-console
          console.log(`[DevMind][watch] ${event}: ${path}`);
        }
      });
    }
  });

  return {
    clearScreen: !isDebug ? true : false,
    logLevel: isDebug ? 'info' : 'info',
    server: {
      port: 12000,
      host: '0.0.0.0',
      allowedHosts: true,
      cors: true,
      headers: {
        'X-Frame-Options': 'ALLOWALL',
        // Required for WebContainer API
        'Cross-Origin-Embedder-Policy': 'credentialless',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
    plugins: [devInfoPlugin(), react()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.VITE_GEMINI_DEV_PROXY': JSON.stringify(env.VITE_GEMINI_DEV_PROXY || 'false')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@sdk': path.resolve(__dirname, 'sdk'),
        '@knowledge': path.resolve(__dirname, 'knowledge'),
        '@runtime': path.resolve(__dirname, 'runtime'),
      }
    },
    optimizeDeps: {
      exclude: ['@webcontainer/api'],
    },
  };
});
