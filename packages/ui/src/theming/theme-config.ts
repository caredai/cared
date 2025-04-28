import { default as Colorjs } from 'colorjs.io'
import { z } from 'zod'

export const ColorSchema = z.string().refine(
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

export type Color = z.infer<typeof ColorSchema>

export const chartKeys = [
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
] as const

export type ChartKeys = (typeof chartKeys)[number]

const chartSchemas = chartKeys.reduce(
  (acc, key) => {
    acc[key] = ColorSchema
    return acc
  },
  {} as Record<ChartKeys, typeof ColorSchema>,
)

export const ThemeSchema = z.object({
  background: ColorSchema,
  foreground: ColorSchema,
  card: ColorSchema,
  cardForeground: ColorSchema,
  popover: ColorSchema,
  popoverForeground: ColorSchema,
  primary: ColorSchema,
  primaryForeground: ColorSchema,
  secondary: ColorSchema,
  secondaryForeground: ColorSchema,
  muted: ColorSchema,
  mutedForeground: ColorSchema,
  accent: ColorSchema,
  accentForeground: ColorSchema,
  destructive: ColorSchema,
  destructiveForeground: ColorSchema,
  border: ColorSchema,
  input: ColorSchema,
  ring: ColorSchema,
  ...chartSchemas,
})

export type Theme = z.infer<typeof ThemeSchema>

export const ThemeConfigSchema = z.object({
  light: ThemeSchema,
  dark: ThemeSchema,
})

export type ThemeConfig = z.infer<typeof ThemeConfigSchema>
