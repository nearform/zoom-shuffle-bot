import { join } from 'desm'
import envSchema from 'env-schema'
import S from 'fluent-json-schema'

const schema = S.object()
  .prop('NODE_ENV', S.string().default('development'))
  .prop('LOG_LEVEL', S.string().default('info'))
  .prop('PRETTY_PRINT', S.boolean().default(false))
  .prop('CLIENT_ID', S.string().required())
  .prop('CLIENT_SECRET', S.string().required())
  .prop('BOT_JID', S.string().required())
  .prop('SECRET_TOKEN', S.string().required())
  .prop('REDIRECT_URL', S.string().required())
  .prop('FIRESTORE_COLLECTION', S.string().default('shuffle-bot-test'))

const config = envSchema({
  schema,
  dotenv: { path: join(import.meta.url, '.env') },
})

export default config
