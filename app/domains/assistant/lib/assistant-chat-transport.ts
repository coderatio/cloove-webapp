import { HttpChatTransport, type UIMessage, type UIMessageChunk } from "ai"
import { EventSourceParserStream, type EventSourceMessage } from "eventsource-parser/stream"
import { apiClient } from "@/app/lib/api-client"
import { storage } from "@/app/lib/storage"
import type { FileAttachment } from "../types"

interface AssistantMessageMetadata {
    attachments?: FileAttachment[]
    analysis?: boolean
}

type AssistantUIMessage = UIMessage<AssistantMessageMetadata>

interface AssistantAttachmentPayload {
    url: string
    name?: string
    fileType?: string
    size?: number
}

function buildAuthHeaders(): Record<string, string> {
    const token = storage.getToken()
    const businessId = storage.getActiveBusinessId()
    return {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(businessId ? { "x-business-id": businessId } : {}),
    }
}

function getLastUserMessage(messages: AssistantUIMessage[]): AssistantUIMessage | undefined {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
        const message = messages[index]
        if (message.role === "user") return message
    }
    return undefined
}

function buildPayloadFromMessage(message?: AssistantUIMessage): {
    message: string
    attachments: AssistantAttachmentPayload[]
    analysis?: boolean
} {
    if (!message) {
        return { message: "", attachments: [] }
    }

    const text = message.parts
        .filter((part) => part.type === "text")
        .map((part) => ("text" in part ? part.text : ""))
        .join(" ")
        .trim()

    const metadataAttachments = message.metadata?.attachments ?? []
    const attachments = metadataAttachments.length
        ? metadataAttachments.map((attachment) => ({
            url: attachment.url,
            name: attachment.name,
            fileType: attachment.fileType,
            size: attachment.size,
        }))
        : message.parts
            .filter((part) => part.type === "file")
            .map((part) => {
                const filePart = part as { url: string; filename?: string; mediaType?: string }
                return {
                    url: filePart.url,
                    name: filePart.filename,
                    fileType: filePart.mediaType,
                }
            })

    return {
        message: text,
        attachments,
        analysis: message.metadata?.analysis,
    }
}

export class AssistantChatTransport extends HttpChatTransport<AssistantUIMessage> {
    constructor() {
        super({
            api: apiClient.buildUrl("/assistant/messages/stream"),
            headers: buildAuthHeaders,
            prepareSendMessagesRequest: ({ id, messages }) => {
                const lastUserMessage = getLastUserMessage(messages)
                const payload = buildPayloadFromMessage(lastUserMessage)
                return {
                    body: {
                        conversationId: id,
                        message: payload.message,
                        attachments: payload.attachments,
                        analysis: payload.analysis,
                    },
                }
            },
        })
    }

    protected processResponseStream(
        stream: ReadableStream<Uint8Array<ArrayBufferLike>>
    ): ReadableStream<UIMessageChunk> {
        let messageId: string | undefined
        let textPartId: string | undefined
        let hasStartedText = false

        const emitTextStart = (controller: TransformStreamDefaultController<UIMessageChunk>) => {
            if (hasStartedText) return
            if (!textPartId) {
                const baseId = messageId || `assistant-${Date.now()}`
                textPartId = `${baseId}-text`
            }
            controller.enqueue({ type: "text-start", id: textPartId })
            hasStartedText = true
        }

        const handleEvent = (
            controller: TransformStreamDefaultController<UIMessageChunk>,
            eventType: string,
            data: string
        ) => {
            if (!eventType || !data) return

            let payload: any
            try {
                payload = JSON.parse(data)
            } catch {
                return
            }

            if (eventType === "assistant_start") {
                messageId = payload.messageId || messageId
                textPartId = messageId ? `${messageId}-text` : textPartId
                controller.enqueue({
                    type: "start",
                    messageId,
                    messageMetadata: {
                        conversationId: payload.conversationId,
                        title: payload.title,
                    },
                })
                emitTextStart(controller)
                return
            }

            if (eventType === "assistant_delta") {
                emitTextStart(controller)
                controller.enqueue({
                    type: "text-delta",
                    id: textPartId || "assistant-text",
                    delta: payload.delta || "",
                })
                return
            }

            if (eventType === "assistant_tool_call") {
                // Close current text part before tool call
                if (hasStartedText && textPartId) {
                    controller.enqueue({ type: "text-end", id: textPartId })
                    hasStartedText = false
                }
                controller.enqueue({
                    type: "tool-input-available",
                    toolCallId: payload.toolCallId,
                    toolName: payload.toolName,
                    input: {},
                })
                return
            }

            if (eventType === "assistant_tool_result") {
                controller.enqueue({
                    type: "tool-output-available",
                    toolCallId: payload.toolCallId,
                    output: {},
                })
                // Start a new text part after tool result
                textPartId = `${messageId || "assistant"}-text-${payload.toolCallId}`
                emitTextStart(controller)
                return
            }

            if (eventType === "assistant_error") {
                emitTextStart(controller)
                const errorText = payload.error || "An unexpected error occurred"
                controller.enqueue({
                    type: "text-delta",
                    id: textPartId || "assistant-text",
                    delta: `\n\n**Error:** ${errorText}`,
                })
                if (hasStartedText && textPartId) {
                    controller.enqueue({ type: "text-end", id: textPartId })
                }
                controller.enqueue({ type: "finish" })
                return
            }

            if (eventType === "assistant_done") {
                if (hasStartedText && textPartId) {
                    controller.enqueue({ type: "text-end", id: textPartId })
                }
                controller.enqueue({ type: "finish" })
            }
        }

        const textStream = stream.pipeThrough(
            new TextDecoderStream() as unknown as TransformStream<Uint8Array<ArrayBufferLike>, string>
        )

        return textStream
            .pipeThrough(new EventSourceParserStream())
            .pipeThrough(
                new TransformStream<EventSourceMessage, UIMessageChunk>({
                    transform({ event, data }, controller) {
                        handleEvent(controller, event ?? "", data)
                    },
                })
            )
    }
}
