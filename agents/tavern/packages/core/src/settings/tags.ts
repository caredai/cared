import { default as Colorjs } from 'colorjs.io'
import { z } from 'zod'

export interface TagsSettings {
  isShow: boolean
  importOption: TagImportOption
  tags: Tag[]
  tagMap: Record<string, string[]> // char id or group id => array of tag name
}

export type TagImportOption = 'none' | 'all' | 'existing' | 'ask'

export interface Tag {
  name: string
  textColor?: string
  bgColor?: string
  folder: 'no' | 'open' | 'closed'
}

const colorSchema = z.string().refine(
  (color) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition,no-constant-binary-expression
      return new Colorjs(color) && true
    } catch {
      return false
    }
  },
  (val) => ({ message: `Could not parse '${val}' as a color` }),
)

export const tagsSettingsSchema = z.object({
  isShow: z.boolean(),
  importOption: z.enum(['none', 'all', 'existing', 'ask']),
  tags: z.array(
    z.object({
      name: z.string(),
      textColor: colorSchema.optional(),
      bgColor: colorSchema.optional(),
      folder: z.enum(['no', 'open', 'closed']),
    }),
  ),
  tagMap: z.record(z.array(z.string())),
})

export function fillInTagsSettingsWithDefaults(settings?: TagsSettings) {
  return settings
    ? {
        ...settings,
        isShow: typeof settings.isShow === 'boolean' ? settings.isShow : true,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        importOption: settings.importOption ?? 'ask',
      }
    : {
        isShow: true,
        importOption: 'ask',
        tags: [],
        tagMap: {},
      }
}
