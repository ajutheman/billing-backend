const { Queue } = require('bullmq');
const redisConnection = require('../core/redis');

// Centralize the task queues
const eventQueue = new Queue('erp-events', { connection: redisConnection });

module.exports = eventQueue;
