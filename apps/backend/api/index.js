/**
 * Vercel serverless entrypoint for the KasaHouse API.
 *
 * Plain JS (not TS) on purpose: it `require()`s the output of `nest build`
 * (`dist/`), which tsc compiles with full `emitDecoratorMetadata` — Vercel's
 * esbuild-based TS compiler does NOT emit that metadata, so compiling the Nest
 * graph through it would break dependency injection.
 *
 * The long-running server (local, Railway, Docker) uses `dist/main.js` instead.
 */
const { createApp } = require('../dist/bootstrap');

let serverPromise;

async function getServer() {
  if (!serverPromise) {
    serverPromise = (async () => {
      const app = await createApp();
      await app.init();
      // The underlying Express instance — Vercel calls it like a handler.
      return app.getHttpAdapter().getInstance();
    })();
  }
  return serverPromise;
}

module.exports = async function handler(req, res) {
  const server = await getServer();
  return server(req, res);
};
