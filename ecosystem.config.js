module.exports = {
    apps: [
        {
            name: "billing-prod",
            script: "./server.js",
            env: {
                NODE_ENV: "production",
                PORT: 4000,
                DATABASE_URL: "postgres://billing_user:StrongPassword123@localhost:5432/billing_db",
                JWT_SECRET: "termux_live_secret_2026"
            }
        },
        {
            name: "billing-staging",
            script: "./server.js",
            env: {
                NODE_ENV: "staging",
                PORT: 4001,
                DATABASE_URL: "postgres://billing_user:StrongPassword123@localhost:5432/billing_staging_db",
                JWT_SECRET: "staging_secret_key_2026"
            }
        }
    ]
}
