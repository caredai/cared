import type { Theme } from './theme-config'

const variables: Record<keyof Theme, string> = {
  background: 'background',
  foreground: 'foreground',
  card: 'card',
  cardForeground: 'card-foreground',
  popover: 'popover',
  popoverForeground: 'popover-foreground',
  primary: 'primary',
  primaryForeground: 'primary-foreground',
  secondary: 'secondary',
  secondaryForeground: 'secondary-foreground',
  muted: 'muted',
  mutedForeground: 'muted-foreground',
  accent: 'accent',
  accentForeground: 'accent-foreground',
  destructive: 'destructive',
  destructiveForeground: 'destructive-foreground',
  border: 'border',
  input: 'input',
  ring: 'ring',
  'chart-1': 'chart-1',
  'chart-2': 'chart-2',
  'chart-3': 'chart-3',
  'chart-4': 'chart-4',
  'chart-5': 'chart-5',
}

export const themeToStyles = (theme: Theme) => {
  return Object.fromEntries(
    Object.entries(variables)
      .filter(([key]) => key in theme)
      .map(([key, variable]) => {
        const value = theme[key as keyof Theme]
        return [
          `--${variable}`,
          value,
        ] as const
      }),
  )
}
