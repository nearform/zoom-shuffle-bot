export default async function (fastify) {
  fastify.get('/authorize', async (req, res) => {
    try {
      const { code } = req.query

      await fastify.zoomApi.authorize(code)

      res.redirect(
        `https://zoom.us/launch/chat?jid=robot_${process.env.BOT_JID}`
      )
    } catch (error) {
      fastify.log.error(error)
      res.send(error)
    }
  })
}
