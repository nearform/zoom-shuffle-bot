export default async function (fastify) {
  fastify.get('/authorize', async (req, res) => {
    try {
      res.redirect(
        `https://zoom.us/launch/chat?jid=robot_${process.env.ROBOT_JID}`
      )
    } catch (error) {
      fastify.log.error(error)
      res.send(error)
    }
  })
}
