const { Worker } = require('bullmq');
const redisConnection = require('../core/redis');
const { dbRun, DB_TYPE } = require('../core/db');

console.log('Starting BullMQ Event Worker...');

const processInvoiceSync = async (job) => {
    const { invoice, timestamp } = job.data;
    console.log(`Processing invoice event for: ${invoice.invoice_number}`);

    try {
        // Here we could update Stock levels based on invoice.items asynchronously
        // Example: Deduct item quantities from \`items\` (simplified representation)
        // This keeps the main POST /sync/push API fast.
        
        if (invoice.items) {
            for (const item of invoice.items) {
                if (DB_TYPE === 'postgres') {
                     await dbRun(
                        "UPDATE items SET stock_quantity = stock_quantity - $1 WHERE id = $2", 
                        [item.quantity, item.item_id]
                     );
                } else {
                     await dbRun(
                        "UPDATE items SET stock_quantity = stock_quantity - ? WHERE id = ?", 
                        [item.quantity, item.item_id]
                     );
                }
            }
        }
        
        // Log event success
        if (DB_TYPE === 'postgres') {
            await dbRun(
                "INSERT INTO event_logs (id, event_type, payload, status, created_at, processed_at) VALUES ($1, $2, $3, $4, $5, $6)",
                [job.id || `evt_${Date.now()}`, 'INVOICE_SYNC_SUCCESS', JSON.stringify({ invoice_id: invoice.id }), 'COMPLETED', timestamp, Date.now()]
            );
        } else {
            await dbRun(
                "INSERT INTO event_logs (id, event_type, payload, status, created_at, processed_at) VALUES (?, ?, ?, ?, ?, ?)",
                [job.id || `evt_${Date.now()}`, 'INVOICE_SYNC_SUCCESS', JSON.stringify({ invoice_id: invoice.id }), 'COMPLETED', timestamp, Date.now()]
            );
        }

    } catch (e) {
        console.error('Failed to process invoice event:', e);
        throw e;
    }
};

const worker = new Worker('erp-events', async job => {
    if (job.name === 'invoiceSync') {
        await processInvoiceSync(job);
    }
}, { connection: redisConnection });

worker.on('completed', job => {
  console.log(`${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`${job.id} has failed with ${err.message}`);
});

module.exports = worker;
