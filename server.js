import Fastify from 'fastify'

export default function buildServer(config = { logger: true }) {
  const fastify = Fastify({ logger: config.logger })

  const databaseConnectionSettings = config.databaseUrl
    ? {
        connectionString: config.databaseUrl,
      }
    : {
        user: config.dbUser,
        password: config.dbPassword,
        host: config.dbHost,
        database: config.dbName,
      }

  fastify.register(import('fastify-postgres'), {
    ...databaseConnectionSettings,
    ssl: false,
  })

  fastify.register(import('./plugins/zoom.js'), config)

  fastify.get('/healthcheck', async () => 'ok')

  fastify.register(import('./routes/authorize.js'))
  fastify.register(import('./routes/hook.js'))
  fastify.register(import('./routes/bot.js'))

  return fastify
}
