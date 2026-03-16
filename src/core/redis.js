const Redis = require('ioredis');

// Connect to native Termux Redis
const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('error', (err) => {
  console.warn('Redis Connection Error - Ensure redis-server is running native in termux:', err.message);
});

redis.on('ready', () => {
    console.log('Connected to local Termux Redis Server');
});

module.exports = redis;
