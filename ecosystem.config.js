module.exports = {
    apps: [
        {
            name: "billing-api-prod",
            script: "./server.js",
            env: {
                NODE_ENV: "production",
                PORT: 5000,
                DATABASE_URL: "postgres://billing_user:StrongPassword123@localhost:5432/billing_prod",
                JWT_SECRET: "termux_live_secret_2026",
                BASE_URL: "https://app.ajmallab.site"
            }
        },
        {
            name: "billing-worker-prod",
            script: "./src/jobs/worker.js",
            env: {
                NODE_ENV: "production",
                DATABASE_URL: "postgres://billing_user:StrongPassword123@localhost:5432/billing_prod",
                JWT_SECRET: "termux_live_secret_2026",
                BASE_URL: "https://app.ajmallab.site"
            }
        },
        {
            name: "billing-staging",
            script: "./server.js",
            env: {
                NODE_ENV: "staging",
                PORT: 4001,
                DATABASE_URL: "postgres://billing_user:StrongPassword123@localhost:5432/billing_staging_db",
                JWT_SECRET: "staging_secret_key_2026",
                BASE_URL: "http://192.168.1.15:4001"
            }
        },
        {
            name: "billing-tunnel",
            script: "cloudflared",
            args: "tunnel --config ./tunnel_config.yml run nokia-server-fix",
            interpreter: "none"
        }
    ]
}
