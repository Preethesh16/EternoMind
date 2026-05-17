interface StreamingTextProps {
  content: string
  isStreaming: boolean
}

export function StreamingText({ content, isStreaming }: StreamingTextProps) {
  return (
    <span className="whitespace-pre-wrap break-words text-sm leading-relaxed">
      {content}
      {isStreaming && (
        <span className="inline-block w-[2px] h-[14px] bg-indigo-400 ml-[1px] align-middle animate-pulse" />
      )}
    </span>
  )
}
