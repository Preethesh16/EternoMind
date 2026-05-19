interface StreamingTextProps {
  content: string
  isStreaming: boolean
}

export function StreamingText({ content, isStreaming }: StreamingTextProps) {
  return (
    <span className="whitespace-pre-wrap break-words text-sm leading-relaxed">
      {content}
      {isStreaming && <span className="cursor-blink" />}
    </span>
  )
}
