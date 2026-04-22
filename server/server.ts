import { connectDB } from './src/config/db.js';
import { PORT } from './src/config/env.js';
import app from './app.js';
import logger from './src/utils/logger.js';

connectDB()
  .then(() => {
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  })
  .catch((err: Error) => {
    logger.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
