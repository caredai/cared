import { z } from 'zod'

export interface ThemeSettings {
  // Active theme label; if conflicted, use the first one.
  theme: string
  // Customizations for the active theme.
  // If key is `[theme label]`, its value will customize the corresponding theme.
  customizations: Partial<Theme> & Record<`[${string}]`, Partial<Theme>>
}

export interface Theme {
  mainTextColor: string
  italicTextColor: string
  underlineTextColor: string
  quoteTextColor: string
  textShadowColor: string
  chatBackgroundColor: string
  uiBackgroundColor: string
  uiBorderColor: string
  userMessageBackgroundColor: string
  botMessageBackgroundColor: string

  avatarStyle: 'circle' | 'square' | 'rectangular'
  chatStyle: 'flat' | 'bubble' | 'document'

  chatWidth: number // [25, 100]
  fontScale: number // [0.5, 1.5]
  shadowWidth: number // [0, 5]
}

export const themeSchema = z.object({
  mainTextColor: z.string(),
  italicTextColor: z.string(),
  underlineTextColor: z.string(),
  quoteTextColor: z.string(),
  textShadowColor: z.string(),
  chatBackgroundColor: z.string(),
  uiBackgroundColor: z.string(),
  uiBorderColor: z.string(),
  userMessageBackgroundColor: z.string(),
  botMessageBackgroundColor: z.string(),

  avatarStyle: z.enum(['circle', 'square', 'rectangular']),
  chatStyle: z.enum(['flat', 'bubble', 'document']),

  chatWidth: z.number().int().min(25).max(100),
  fontScale: z.number().min(0.5).max(1.5),
  shadowWidth: z.number().int().min(0).max(5),
})
