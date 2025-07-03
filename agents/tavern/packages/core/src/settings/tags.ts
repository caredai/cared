import { default as Colorjs } from 'colorjs.io'
import { z } from 'zod/v4'

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

const colorSchema = z.string().check((ctx) => {
  try {
    const _ = new Colorjs(ctx.value)
  } catch {
    ctx.issues.push({
      code: 'custom',
      message: `Could not parse '${ctx.value}' as a color`,
      input: ctx.value,
    })
  }
})

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
  tagMap: z.record(z.string(), z.array(z.string())),
})

export function fillInTagsSettingsWithDefaults(settings?: TagsSettings): TagsSettings {
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
