import Fastify from 'fastify'

export default function buildServer(config) {
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      ...(config.PRETTY_PRINT && {
        transport: {
          target: 'pino-pretty',
        },
      }),
    },
  })

  fastify.register(import('./plugins/firestore.js'), {
    collection: config.FIRESTORE_COLLECTION,
  })

  fastify.register(import('./plugins/zoom.js'), {
    clientId: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET,
    botJid: config.BOT_JID,
    secretToken: config.SECRET_TOKEN,
    redirectUri: config.REDIRECT_URL,
  })

  fastify.get('/healthcheck', async () => 'ok')

  fastify.register(import('./routes/authorize.js'))
  fastify.register(import('./routes/hook.js'))
  fastify.register(import('./routes/bot.js'))

  return fastify
}
