import { sendToContentScript, type PlasmoMessaging } from "@plasmohq/messaging"
const getMJSjsonHandler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log("req", req)
  const message = await sendToContentScript({ name: "tabNaga" })

  res.send({
    message
  })
}
export default getMJSjsonHandler
