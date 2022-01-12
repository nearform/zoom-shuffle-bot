import fastify from 'fastify'
import dotenv from 'dotenv'

dotenv.config()

const server = fastify({ logger: true })

server.register(import('fastify-postgres'), {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

server.get('/healthcheck', async () => 'ok')

server.register(import('./routes/bot.js'))
server.register(import('./routes/bot-callback.js'))

const start = async () => {
  try {
    await server.listen(process.env.PORT, '0.0.0.0')
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
