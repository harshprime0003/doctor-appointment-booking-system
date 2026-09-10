import { createApp } from './app.js';
import config from './config/env.js';
import { connectDb } from './db/index.js';

async function start() {
  try {
    await connectDb();
    // eslint-disable-next-line no-console
    console.log(`[db] connected using "${config.db.driver}" driver`);
    const app = createApp();
    app.listen(config.port, () => {
      // eslint-disable-next-line no-console
      console.log(`[server] API listening on http://localhost:${config.port} (${config.env})`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[server] failed to start:', err);
    process.exit(1);
  }
}

start();
