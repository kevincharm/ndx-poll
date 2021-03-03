const config = {
    port: Number(process.env.PORT) || 3000,
    tempDir: process.env.TEMP_DIR || '/tmp',
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: process.env.REDIS_PORT || 6379,
    redisPassword: process.env.REDIS_PASSWORD || 'password',
    pgUser: process.env.PG_USER || 'username',
    pgPassword: process.env.PG_PASSWORD || 'password',
    pgHost: process.env.PG_HOST || 'localhost',
    pgPort: Number(process.env.PG_PORT) || 5432,
    pgDatabase: process.env.PG_DATABASE || 'ndx_poll',
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || 'TESTACCESS',
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'TESTSECRET',
    awsRegion: process.env.AWS_REGION || 'eu-central-1',
    sesEmailAddress: 'noreply@mailer.poll.indexed.finance',
    /**
     * The frontend route to the reset password page.
     * `?token=${hash}` will be appended to the end of this URL.
     */
    resetPasswordRoute:
        process.env.RESET_PASSWORD_ROUTE || 'https://wombatlab.sendcroissants.me/reset-password',
}

export default config
