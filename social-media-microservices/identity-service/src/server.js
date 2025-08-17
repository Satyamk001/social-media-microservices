require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const {RateLimiterRedis} = require('rate-limiter-flexible');
const Redis = require('ioredis');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis')
const routes = require('./routes/identity-service');
const errorHandler = require('./middlewares/errorHandler')
const app = express();

mongoose.connect(process.env.MONGODB_URI).then(()=>{
    logger.info('Connected to MongoDB');
}).catch((err)=>{
    logger.error('Error connecting to MongoDB:', err.message);
});

const redisClient = new Redis(process.env.REDIS_URL);

app.use(express.json());
app.use(helmet());
app.use(cors());

app.use((req,res,next)=>{
    logger.info('Request received:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body
    })
    next();
})

// Rate Limiter & DDoS Protection
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rateLimiter',
    points: 100, // 100 requests
    duration: 60, // per minute
    blockDuration: 60 * 15 // Block for 15 minutes if the limit is exceeded
});

app.use((req,res,next)=>{
    rateLimiter.consume(req.ip)
        .then(() => {
            next();
        })
        .catch(() => {
            res.status(429).send('Too Many Requests');
        });
});

const sensitiveRoutesLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req,res)=>{
        logger.warn('Rate limit exceeded for:', {
            method: req.method,
            url: req.url,
            ip: req.ip
        });
        res.status(429).send('Too Many Requests');
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
    })
});

app.use('/api/auth/register', sensitiveRoutesLimiter);
app.use('/api/auth', routes);

app.use(errorHandler);

app.listen(process.env.PORT, () => {
    logger.info(`Identity Service running on port ${process.env.PORT}`);
});

// Unhandled rejections are problematic because they indicate potential bugs in your asynchronous code.
// If you don’t handle them properly:
process.on('unhandledRejection', error => {
    logger.error('Unhandled Rejection:', error.message);
    // process.exit(1);
})