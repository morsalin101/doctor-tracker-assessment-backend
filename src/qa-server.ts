import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri();
process.env.MONGODB_DB_NAME = 'doctor_tracker_qa';
process.env.NODE_ENV = 'development';

const [{ connectDatabase, disconnectDatabase }, { seedData }, { app }, { env }] = await Promise.all([
  import('./config/db.js'),
  import('./seed.js'),
  import('./app.js'),
  import('./config/env.js'),
]);

await connectDatabase();
await seedData();
const server = app.listen(env.PORT, () => console.log(`QA API listening on http://localhost:${env.PORT}`));

const shutdown = async () => {
  server.close();
  await disconnectDatabase();
  await mongo.stop();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
