import Fastify from 'fastify'

export default function buildServer(config = { logger: true }) {
  const fastify = Fastify({ logger: config.logger })

  fastify.register(import('fastify-postgres'), {
    connectionString: config.databaseUrl,
    ssl: false,
    // process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
    //   ? false
    //   : {
    //       rejectUnauthorized: false,
    //     },
  })

  fastify.register(import('./plugins/zoom.js'), config)

  fastify.get('/healthcheck', async () => 'ok')

  fastify.register(import('./routes/authorize.js'))
  fastify.register(import('./routes/hook.js'))
  fastify.register(import('./routes/bot.js'))

  return fastify
}
