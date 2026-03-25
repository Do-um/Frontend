import ReactMarkdown, { type Components } from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

type MarkdownContentProps = {
  content?: string | null
  className?: string
  compact?: boolean
}

const markdownComponents: Components = {
  a: ({ href, children, ...props }) => {
    const isExternal = typeof href === "string" && /^https?:\/\//.test(href)

    return (
      <a href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noreferrer" : undefined} {...props}>
        {children}
      </a>
    )
  },
}

export function MarkdownContent({ content, className, compact = false }: MarkdownContentProps) {
  const normalizedContent = content?.trim()

  if (!normalizedContent) {
    return null
  }

  return (
    <div
      className={cn(
        "min-w-0 break-words [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:border-[#bfd6e5] [&_blockquote]:pl-4 [&_code]:rounded-md [&_code]:bg-black/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_li]:leading-inherit [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:m-0 [&_p]:leading-inherit [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-[#1f2730] [&_pre]:px-4 [&_pre]:py-3 [&_pre]:text-white [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-black/10 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-black/10 [&_th]:bg-black/5 [&_th]:px-3 [&_th]:py-2 [&_ul]:list-disc [&_ul]:pl-5",
        compact ? "space-y-1 [&_ol]:space-y-1 [&_ul]:space-y-1" : "space-y-3 [&_ol]:space-y-1.5 [&_ul]:space-y-1.5",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={markdownComponents}>
        {normalizedContent}
      </ReactMarkdown>
    </div>
  )
}
