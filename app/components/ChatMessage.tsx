interface ChatMessageProps {
    role: 'user' | 'assistant'
    content: string
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
    return (
        <div className={`chat-bubble ${role} animate-fade-in`}>
            {content}
        </div>
    )
}
