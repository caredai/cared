import type { FC } from 'react'
import { memo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Highlight, themes } from 'prism-react-renderer'

import { Button } from '@cared/ui/components/button'
import { cn } from '@cared/ui/lib/utils'

import { copyTextToClipboard } from '@/lib/clipboard'

interface Props {
  language: string
  value: string
  theme?: string
  className?: string
}

const CodeBlock: FC<Props> = memo(({ language, value, theme, className }) => {
  const [isCopied, setIsCopied] = useState(false)
  const handleCopy = () => {
    setIsCopied(true)
    void copyTextToClipboard(value)
    setTimeout(() => setIsCopied(false), 1000)
  }

  return (
    <div className="codeblock relative w-full overflow-hidden rounded border font-sans dark:bg-zinc-950">
      <div className={cn('flex w-full items-center justify-between bg-secondary px-2', className)}>
        <span className="text-xs lowercase">{language}</span>
        <div className="flex items-center py-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs hover:bg-border focus-visible:ring-1 focus-visible:ring-offset-0 h-4 px-1 rounded-sm"
            onClick={handleCopy}
          >
            {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            <span className="sr-only">Copy code</span>
          </Button>
        </div>
      </div>
      <Highlight
        theme={theme === 'dark' ? themes.vsDark : themes.github}
        code={value}
        language={language}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={className}
            style={{
              ...style,
              margin: 0,
              width: '100%',
              background: 'transparent',
              padding: '0.5rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              overflow: 'auto',
            }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
})
CodeBlock.displayName = 'CodeBlock'

export { CodeBlock }
