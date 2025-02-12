import type { TRPCRouterRecord } from '@trpc/server'
import { z } from 'zod'

import { desc, eq } from '@mindworld/db'
import { CreatePostSchema, Post } from '@mindworld/db/schema'

import { protectedProcedure, publicProcedure } from '../trpc'

export const postRouter = {
  /**
   * Get all posts.
   * Accessible by any user.
   * @returns List of posts ordered by descending ID, limited to 10 posts.
   */
  all: publicProcedure.query(({ ctx }) => {
    // return ctx.db.select().from(schema.post).orderBy(desc(schema.post.id));
    return ctx.db.query.Post.findMany({
      orderBy: desc(Post.id),
      limit: 10,
    })
  }),

  /**
   * Get a single post by ID.
   * Accessible by any user.
   * @param input - Object containing the post {@link id}
   * @returns The post if found
   */
  byId: publicProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    // return ctx.db
    //   .select()
    //   .from(schema.post)
    //   .where(eq(schema.post.id, input.id));

    return ctx.db.query.Post.findFirst({
      where: eq(Post.id, input.id),
    })
  }),

  /**
   * Create a new post.
   * Only accessible by authenticated users.
   * @param input - The post data following the {@link CreatePostSchema}
   * @returns The created post
   */
  create: protectedProcedure.input(CreatePostSchema).mutation(({ ctx, input }) => {
    return ctx.db.insert(Post).values(input)
  }),

  /**
   * Delete a post by ID.
   * Only accessible by authenticated users.
   * @param input - The ID of the post to delete
   * @returns The deletion result
   */
  delete: protectedProcedure.input(z.string()).mutation(({ ctx, input }) => {
    return ctx.db.delete(Post).where(eq(Post.id, input))
  }),
} satisfies TRPCRouterRecord
