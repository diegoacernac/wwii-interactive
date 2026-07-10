import { createApp } from './app';

const port = parseInt(process.env.PORT ?? '3001', 10);
createApp().listen(port, () => {
  console.log(`WWII Platform API listening on http://localhost:${port}`);
});
