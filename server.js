import Fastify from 'fastify'

export default function buildServer(config = { log: true }) {
  const fastify = Fastify({ log: config.log })

  fastify.register(import('fastify-postgres'), {
    connectionString: config.databaseUrl,
    ssl:
      process.env.NODE_ENV === 'development'
        ? false
        : {
            rejectUnauthorized: false,
          },
  })

  fastify.register(import('./plugins/zoom.js'), config)

  fastify.get('/healthcheck', async () => 'ok')

  fastify.register(import('./routes/authorize.js'))
  fastify.register(import('./routes/hook.js'))
  fastify.register(import('./routes/bot.js'))

  return fastify
}
