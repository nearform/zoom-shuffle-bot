import Fastify from 'fastify'

export default function buildServer(config) {
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      prettyPrint: config.PRETTY_PRINT,
    },
  })

  fastify.register(import('fastify-postgres'), {
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    host: config.DB_HOST,
    port: config.DB_PORT || 5432,
    database: config.DB_NAME,
    ssl: false,
  })

  fastify.register(import('./plugins/zoom.js'), {
    clientId: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET,
    botJid: config.BOT_JID,
    verificationToken: config.VERIFICATION_TOKEN,
    redirectUri: config.REDIRECT_URL,
  })

  fastify.get('/healthcheck', async () => 'ok')

  fastify.register(import('./routes/authorize.js'))
  fastify.register(import('./routes/hook.js'))
  fastify.register(import('./routes/bot.js'))

  return fastify
}
