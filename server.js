import Fastify from 'fastify'

export default function buildServer(config = { logger: true }) {
  const fastify = Fastify({ logger: config.logger })

  fastify.register(import('fastify-postgres'), {
    user: config.dbUser,
    password: config.dbPassword,
    host: config.dbHost,
    port: config.dbPort || 5432,
    database: config.dbName,
    ssl: false,
  })

  fastify.register(import('./plugins/zoom.js'), config)

  fastify.get('/healthcheck', async () => 'ok')

  fastify.register(import('./routes/authorize.js'))
  fastify.register(import('./routes/hook.js'))
  fastify.register(import('./routes/bot.js'))

  return fastify
}
