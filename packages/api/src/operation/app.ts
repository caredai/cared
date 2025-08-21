import { eq } from '@cared/db'
import { db } from '@cared/db/client'
import { App, Chat } from '@cared/db/schema'

import { deleteApiKeys } from './api-key'

export class AppOperator {
  constructor(public appId: string) {}

  async isArchived() {
    const app = await db.query.App.findFirst({
      where: eq(App.id, this.appId),
      columns: { archived: true },
    })
    return !!app?.archived
  }

  async archive() {
    await db
      .update(App)
      .set({
        archived: true,
        archivedAt: new Date(),
      })
      .where(eq(App.id, this.appId))
  }

  async unarchive() {
    await db
      .update(App)
      .set({
        archived: null,
        archivedAt: null,
      })
      .where(eq(App.id, this.appId))
  }

  async isDeletable() {
    const hasChat = !!(await db.query.Chat.findFirst({
      where: eq(Chat.appId, this.appId),
      columns: { id: true },
    }))
    return !hasChat
  }

  async isDeleted(soft = true) {
    const app = await db.query.App.findFirst({
      where: eq(App.id, this.appId),
      columns: { deleted: true },
    })
    return !app || (soft && app.deleted)
  }

  async softDelete() {
    await db
      .update(App)
      .set({
        deleted: true,
        deletedAt: new Date(),
      })
      .where(eq(App.id, this.appId))
  }

  async delete() {
    // Ensure no associated resources to be created before deletion
    if (!(await this.isArchived())) {
      await this.archive()
    }

    if (!(await this.isDeletable())) {
      throw new Error('App cannot be deleted because it has associated resources')
    }

    await this.softDelete()

    await deleteApiKeys({
      scope: 'app',
      appId: this.appId,
    })

    await db.transaction(async (tx) => {
      await tx.delete(App).where(eq(App.id, this.appId))
    })
  }
}
