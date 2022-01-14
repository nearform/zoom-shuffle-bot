import Fastify from 'fastify'
import dotenv from 'dotenv'

dotenv.config()

const fastify = Fastify({ logger: true })

fastify.register(import('fastify-postgres'), {
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'development'
      ? false
      : {
          rejectUnauthorized: false,
        },
})
fastify.register(import('./plugins/zoom-chatbot.js'), {
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  botJid: process.env.BOT_JID,
  verificationToken: process.env.VERIFICATION_TOKEN,
})

fastify.get('/healthcheck', async () => 'ok')

fastify.register(import('./routes/authorize.js'))
fastify.register(import('./routes/hook.js'))
fastify.register(import('./routes/bot.js'))

const start = async () => {
  try {
    await fastify.listen(process.env.PORT, '0.0.0.0')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
