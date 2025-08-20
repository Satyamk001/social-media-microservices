require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const Redis = require('ioredis');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { validateToken } = require('./middlewares/authMiddleware');
const proxy = require('express-http-proxy');
const errorHandler = require("./middlewares/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;
const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});

app.use(cors());
app.use(helmet());
app.use(express.json());

const ratelimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        console.warn('Rate limit exceeded for:', {
            method: req.method,
            url: req.url,
            ip: req.ip
        });
        res.status(429).json({
            success: false,
            message: 'Too Many Requests'
        });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
    })
});

app.use(ratelimit);

const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, "/api");
    },
    proxyErrorHandler: (err, req, res, next) => {
        console.error('Proxy error:', err);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : err.stack
        });
        next(err);
    }
};

app.use('/v1/auth', proxy(process.env.IDENTITY_SERVICE_URL, { ...proxyOptions,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-Type"] = "application/json";
        return proxyReqOpts;
    },

        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        console.log(`Proxying request to Identity Service: ${userReq.method} ${userReq.originalUrl}`);
        return proxyResData;
    }
})
);

app.use('/v1/posts',validateToken, proxy(process.env.POST_SERVICE_URL, { ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-Type"] = "application/json";
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
        return proxyReqOpts;
    },

    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        console.log(`Proxying request to POST Service: ${userReq.method} ${userReq.originalUrl}`);
        return proxyResData;
    }
})
);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
    console.log(`Proxying requests to Identity Service at ${process.env.IDENTITY_SERVICE_URL}`);
    console.log(`Redis is connected at ${process.env.REDIS_URL}`);
});