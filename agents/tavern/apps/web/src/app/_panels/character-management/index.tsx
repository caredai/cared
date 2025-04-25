import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs'
import { Character } from './character'
import { CharacterList } from './character-list'

export function CharacterManagementPanel() {
  return (
    <Tabs defaultValue="character" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="character">
          <p className="truncate">Character name</p>
        </TabsTrigger>
        <TabsTrigger value="character-list">
          <p className="truncate">Characters</p>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="character">
        <Character />
      </TabsContent>
      <TabsContent value="character-list">
        <CharacterList />
      </TabsContent>
    </Tabs>
  )
}
