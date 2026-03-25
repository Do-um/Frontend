import { cn } from "@/lib/utils"

type MarkdownSupportNoteProps = {
  className?: string
}

export function MarkdownSupportNote({ className }: MarkdownSupportNoteProps) {
  return (
    <p className={cn("text-xs leading-5 text-[#748690]", className)}>
      마크다운 지원: Enter 줄바꿈, <code>**강조**</code>, <code>*기울임*</code>, <code>- 목록</code>
    </p>
  )
}
