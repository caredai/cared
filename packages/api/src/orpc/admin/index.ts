import { accountRouter } from './account'
import { mockRouter } from './mock'
import { userRouter } from './user'

export const adminRouter = {
  ...userRouter,
  ...accountRouter,
  ...mockRouter,
}
