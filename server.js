import Fastify from 'fastify'

export default function buildServer(config = { logger: true }) {
  const fastify = Fastify({ logger: config.logger })

  fastify.register(import('fastify-postgres'), {
    // connectionString: config.databaseUrl,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,

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
