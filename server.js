const app = require('./src/app');
const { initDb, DB_TYPE } = require('./src/core/db');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await initDb();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} with ${DB_TYPE} database [Modular Monolith]`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
