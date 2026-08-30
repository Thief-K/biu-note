import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom'
});

await server.ssrLoadModule('./server.ts');
