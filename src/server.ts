import { app } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';

await connectDatabase();
const server = app.listen(env.PORT, () => console.log(`Doctor Tracker API listening on http://localhost:${env.PORT}`));

const shutdown = async () => {
  server.close();
  await disconnectDatabase();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
