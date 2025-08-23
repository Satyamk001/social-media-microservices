require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const postRoutes = require('./routes/post-routes');
const logger = require('./utils/logger');
const helmet = require('helmet');
const errorHandler = require('./middlewares/errorHandler');
const {connectRabbitMQ} = require('./utils/rabbitmq');
const Redis = require('ioredis');
const app = express();

const PORT = process.env.PORT || 3002;

const MONGO_URI = process.env.MONGODB_URI;
const redisClient = new Redis(process.env.REDIS_URL);

mongoose.connect(MONGO_URI).then(()=>{
    logger.info('Connected to MongoDB');
}).catch((err)=>{
    logger.error('Error connecting to MongoDB:', err.message);
});

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
//  TODO: implement rate limiting for sensitive routes
// implement ip based rate limiting for sensitive routes as implemented in identity-service
// const sensitiveRoutesLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, // limit each IP to 100 requests per windowMs
//     message: 'Too many requests, please try again later.',
//     standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//     legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// });

app.use('/api/posts',(req,res,next)=>{
    req.redisClient = redisClient;
    next();
} ,postRoutes);

app.use(errorHandler);

async function startServer() {
    try {
        await connectRabbitMQ();
        app.listen(PORT, () => {
            logger.info(`Post Service running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();

process.on('unhandledRejection', error => {
    logger.error('Unhandled Rejection:', error.message);
    // process.exit(1);
})
