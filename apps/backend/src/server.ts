import { createApp } from './app';

const port = parseInt(process.env.PORT ?? '3001', 10);
// Bind all interfaces so the server is reachable inside containers / PaaS.
createApp().listen(port, '0.0.0.0', () => {
  console.log(`WWII Platform API listening on port ${port}`);
});
