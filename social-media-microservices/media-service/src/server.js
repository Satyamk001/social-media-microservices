require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const mediaRoutes = require('./routes/media-routes');
const logger = require('./utils/logger');
const helmet = require('helmet');
const errorHandler = require('./middlewares/errorHandler');
const { connectRabbitMQ, consumeEvents } = require('./utils/rabbitmq');
const {handlePostDeleted} = require("./eventHandler/media-event-handler");
// const Redis = require('ioredis');
const app = express();

const PORT = process.env.PORT || 3003;

const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI).then(()=>{
    logger.info('Connected to MongoDB');
}).catch((err)=>{
    logger.error('Error connecting to MongoDB:', err.message);
});

app.use(express.json());
app.use(helmet());
app.use(cors());

app.use('/api/media', mediaRoutes)

app.use(errorHandler);

async function startServer() {
    try {
        await connectRabbitMQ();
        await consumeEvents('post.deleted', handlePostDeleted)
        app.listen(PORT, () => {
            logger.info(`Media Service running on port ${PORT}`);
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
