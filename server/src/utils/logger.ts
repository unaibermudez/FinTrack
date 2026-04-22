import { createLogger, format, transports } from 'winston';
import { NODE_ENV } from '../config/env.js';

const logger = createLogger({
  level: NODE_ENV === 'production' ? 'warn' : 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [new transports.Console()],
});

export default logger;
