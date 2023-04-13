import { Firestore } from '@google-cloud/firestore'
import fp from 'fastify-plugin'

import validateOptions from './helpers/validateOptions.js'

async function plugin(fastify, options = {}) {
  validateOptions(['collection'], options)

  const firestore = new Firestore()

  fastify.decorate('firestore', firestore.collection(options.collection))
}

export default fp(plugin, {
  name: 'zoom-firestore',
})
