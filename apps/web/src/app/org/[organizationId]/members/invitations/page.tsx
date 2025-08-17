import { HydrateMembers } from '../page'

export default function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  return <HydrateMembers kind="invitations" params={params} />
}
