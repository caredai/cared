import { artifactRouter } from './artifact'
import { chatRouter } from './chat'
import { fileRouter } from './file'
import { messageRouter } from './message'

export const userRouter = {
  file: fileRouter,
  chat: chatRouter,
  message: messageRouter,
  artifact: artifactRouter,
}
