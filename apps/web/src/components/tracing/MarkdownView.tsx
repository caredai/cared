import type { FC, ReactElement, ReactNode } from 'react'
import type {
  ExtraProps as ReactMarkdownExtraProps,
  Options as ReactMarkdownOptions,
} from 'react-markdown'
import { Children, createElement, isValidElement, memo } from 'react'
import { Link } from '@tanstack/react-router'
import DOMPurify from 'dompurify'
import { Info } from 'lucide-react'
import { useTheme } from 'next-themes'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { cn } from '@cared/ui/lib/utils'

import type { LanguageModelV2Message, LanguageModelV2TextPart } from '@ai-sdk/provider'
import { copyTextToClipboard } from '@/lib/clipboard'
import { CodeBlock } from './Codeblock'
import { JSONView } from './JsonView'
import { MarkdownJsonViewHeader } from './MarkdownJsonView'
import { ResizableImage } from './resizable-image'

type ReactMarkdownNode = ReactMarkdownExtraProps['node']
type ReactMarkdownNodeChildren = Exclude<ReactMarkdownNode, undefined>['children']

// ReactMarkdown does not render raw HTML by default for security reasons, to prevent XSS (Cross-Site Scripting) attacks.
// html is rendered as plain text by default.
const MemoizedReactMarkdown: FC<ReactMarkdownOptions> = memo(ReactMarkdown)

const getSafeUrl = (href: string | undefined | null): string | null => {
  if (!href || typeof href !== 'string') return null

  // DOMPurify's default sanitization is quite permissive but safe
  // It blocks javascript:, data: with scripts, vbscript:, etc.
  // But allows http:, https:, ftp:, mailto:, tel:, and many others
  try {
    const sanitized = DOMPurify.sanitize(href, {
      // ALLOWED_TAGS: An array of HTML tags that are explicitly permitted in the output.
      // Setting this to an empty array means that no HTML tags are allowed.
      // Any HTML tag found within the 'href' string would be stripped out.
      ALLOWED_TAGS: [],

      // ALLOWED_ATTR: An array of HTML attributes that are explicitly permitted on allowed tags.
      // Setting this to an empty array means that no HTML attributes are allowed.
      // Similar to ALLOWED_TAGS, this ensures that if any attributes are somehow
      // embedded within the URL string (e.g., malformed or attempting injection),
      // they will be removed by DOMPurify. We only expect a pure URL string.
      ALLOWED_ATTR: [],
    })

    return sanitized || null
  } catch {
    return null
  }
}

const isTextElement = (child: ReactNode): child is ReactElement<{ className?: string }> =>
  isValidElement(child) &&
  typeof child.type === 'string' &&
  ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(child.type)

const isChecklist = (children: ReactNode) =>
  Array.isArray(children) &&
  children.some(
    (child) => isValidElement(child) && (child.props as any)?.className === 'task-list-item',
  )

const transformListItemChildren = (children: ReactNode) =>
  Children.map(children, (child) =>
    isTextElement(child)
      ? createElement('span', {
          ...child.props,
          className: cn(child.props.className, 'mb-1'),
        })
      : child,
  )

const isImageNode = (node?: ReactMarkdownNode): boolean =>
  !!node &&
  Array.isArray(node.children) &&
  node.children.some(
    (child: ReactMarkdownNodeChildren[number]) => 'tagName' in child && child.tagName === 'img',
  )

function MarkdownRenderer({
  markdown,
  theme,
  className,
  customCodeHeaderClassName,
}: {
  markdown: string
  theme?: string
  className?: string
  customCodeHeaderClassName?: string
}) {
  // Try to parse markdown content

  try {
    // If parsing succeeds, render with ReactMarkdown
    return (
      <div className={cn('space-y-2 overflow-x-auto break-words text-sm', className)}>
        <MemoizedReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p({ children, node }) {
              if (isImageNode(node)) {
                return <>{children}</>
              }
              return <p className="mb-2 whitespace-pre-wrap last:mb-0">{children}</p>
            },
            a({ children, href }) {
              const safeHref = getSafeUrl(href)
              if (safeHref) {
                return (
                  <Link
                    to={safeHref}
                    className="underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </Link>
                )
              }
              return <span className="text-muted-foreground underline">{children}</span>
            },
            ul({ children }) {
              if (isChecklist(children)) return <ul className="list-none">{children}</ul>

              return <ul className="list-inside list-disc">{children}</ul>
            },
            ol({ children }) {
              return <ol className="list-inside list-decimal">{children}</ol>
            },
            li({ children }) {
              return (
                <li className="mt-1 [&>ol]:pl-4 [&>ul]:pl-4">
                  {transformListItemChildren(children)}
                </li>
              )
            },
            pre({ children }) {
              return <pre className="rounded p-2">{children}</pre>
            },
            h1({ children }) {
              return <h1 className="text-2xl font-bold">{children}</h1>
            },
            h2({ children }) {
              return <h2 className="text-xl font-bold">{children}</h2>
            },
            h3({ children }) {
              return <h3 className="text-lg font-bold">{children}</h3>
            },
            h4({ children }) {
              return <h4 className="text-base font-bold">{children}</h4>
            },
            h5({ children }) {
              return <h5 className="text-sm font-bold">{children}</h5>
            },
            h6({ children }) {
              return <h6 className="text-xs font-bold">{children}</h6>
            },
            code({ children, className }) {
              const languageMatch = /language-(\w+)/.exec(className || '')
              const language = languageMatch ? languageMatch[1] : ''
              // eslint-disable-next-line @typescript-eslint/no-base-to-string
              const codeContent = String(children).replace(/\n$/, '')
              const isMultiLine = codeContent.includes('\n')

              return language && isMultiLine ? (
                // code block
                <CodeBlock
                  key={Math.random()}
                  language={language}
                  value={codeContent}
                  theme={theme}
                  className={customCodeHeaderClassName}
                />
              ) : (
                // inline code
                <code className="rounded border bg-secondary px-0.5">{codeContent}</code>
              )
            },
            blockquote({ children }) {
              return <blockquote className="border-l-4 pl-4 italic">{children}</blockquote>
            },
            img({ src, alt }) {
              return src && typeof src === 'string' ? <ResizableImage src={src} alt={alt} /> : null
            },
            hr() {
              return <hr className="my-4" />
            },
            table({ children }) {
              return (
                <div className="overflow-x-auto rounded border text-xs">
                  <table className="min-w-full divide-y">{children}</table>
                </div>
              )
            },
            thead({ children }) {
              return <thead>{children}</thead>
            },
            tbody({ children }) {
              return <tbody className="divide-y divide-border">{children}</tbody>
            },
            tr({ children }) {
              return <tr>{children}</tr>
            },
            th({ children }) {
              return (
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                  {children}
                </th>
              )
            },
            td({ children }) {
              return <td className="whitespace-nowrap px-4 py-2">{children}</td>
            },
          }}
        >
          {markdown}
        </MemoizedReactMarkdown>
      </div>
    )
  } catch {
    // fallback to JSON view if markdown parsing fails

    return (
      <>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          Markdown parsing failed. Displaying raw JSON.
        </div>
        <JSONView json={markdown} className="min-w-0" />
      </>
    )
  }
}

const parseMessageContentParts = (content: LanguageModelV2Message['content']): string => {
  if (typeof content === 'string') {
    return content
  }
  return content
    .filter((item) => item.type === 'text')
    .map((item) => (item as LanguageModelV2TextPart).text)
    .join('\n')
}

export function MarkdownView({
  markdown,
  title,
  customCodeHeaderClassName,
}: {
  markdown: LanguageModelV2Message['content']
  title?: string
  customCodeHeaderClassName?: string
}) {
  const { resolvedTheme: theme } = useTheme()

  const handleOnCopy = () => {
    const rawText = typeof markdown === 'string' ? markdown : parseMessageContentParts(markdown)
    void copyTextToClipboard(rawText)
  }

  return (
    <div className={cn('overflow-hidden')} key={theme}>
      {title ? <MarkdownJsonViewHeader title={title} handleOnCopy={handleOnCopy} /> : null}
      <div
        className={cn(
          'grid grid-flow-row gap-2 rounded-sm border p-3',
          title === 'assistant' || title === 'Output'
            ? 'bg-green-50 dark:bg-green-50/5 dark:border-green-600'
            : '',
          title === 'system' || title === 'Input' ? 'bg-primary-foreground' : '',
        )}
      >
        {typeof markdown === 'string' ? (
          // plain string
          <MarkdownRenderer
            markdown={markdown}
            theme={theme}
            customCodeHeaderClassName={customCodeHeaderClassName}
          />
        ) : (
          // content parts (multi-modal)
          markdown.map((content, index) =>
            content.type === 'text' ? (
              <MarkdownRenderer
                key={index}
                markdown={content.text}
                theme={theme}
                customCodeHeaderClassName={customCodeHeaderClassName}
              />
            ) : null,
          )
        )}
      </div>
    </div>
  )
}
