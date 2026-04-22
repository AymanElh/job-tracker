const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'jobtrackr-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Always log to console (required for Docker: 'docker logs' reads stdout/stderr)
logger.add(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production'
      ? winston.format.combine(winston.format.timestamp(), winston.format.json())
      : winston.format.combine(winston.format.colorize(), winston.format.simple()),
  })
);

module.exports = logger;
