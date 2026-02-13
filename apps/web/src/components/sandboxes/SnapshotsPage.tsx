import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs'
import { SectionTitle } from '@/components/section'
import { SnapshotsTab } from './SnapshotsTab'
import { RegistriesTab } from './RegistriesTab'

/**
 * Snapshots route page: Snapshots and Registries in tabs (per requirement).
 */
export function SnapshotsPage() {
  return (
    <>
      <SectionTitle
        title="Snapshots"
        description="Manage snapshots"
      />
      <Tabs defaultValue="snapshots" className="w-full">
        <TabsList>
          <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
          <TabsTrigger value="registries">Registries</TabsTrigger>
        </TabsList>
        <TabsContent value="snapshots" className="space-y-4 mt-4">
          <SnapshotsTab />
        </TabsContent>
        <TabsContent value="registries" className="space-y-4 mt-4">
          <RegistriesTab />
        </TabsContent>
      </Tabs>
    </>
  )
}
