const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.splat(),
        winston.format.errors({ stack: true })
    ),
    defaultMeta : { service: 'post-service' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({
            filename: 'logs/post-service-error.log',
            level: 'error',

        }),
        new winston.transports.File({
            filename: 'logs/combine-error.log',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ]
});

module.exports = logger;