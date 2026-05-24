import { Vcs } from '@appwrite.io/console'

import { AppwriteService } from './base'

export class AppwriteVcsService extends AppwriteService {
  protected vcs(regionId: string, accountId: string) {
    return new Vcs(this.projectClient(regionId, accountId))
  }
}
