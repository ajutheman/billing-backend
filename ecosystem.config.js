module.exports = {
    apps: [{
        name: "billing-backend",
        script: "./server.js",
        env: {
            NODE_ENV: "production",
            PORT: 3000,
            DATABASE_URL: "./cloud_db.sqlite",
            JWT_SECRET: "super_secret_billing_app_key_2026"
        }
    }]
}
