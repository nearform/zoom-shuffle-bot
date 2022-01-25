import createError from 'http-errors'

export default async function verifyRequest(pluginOptions, req) {
  const { clientid, authorization } = req.headers

  if (
    clientid !== pluginOptions.clientId ||
    authorization !== pluginOptions.verificationToken
  ) {
    throw createError(401)
  }
}
