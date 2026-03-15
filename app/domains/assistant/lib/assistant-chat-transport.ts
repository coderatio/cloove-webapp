import { HttpChatTransport, type UIMessage, type UIMessageChunk } from "ai"
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
        const decoder = new TextDecoder()
        let buffer = ""
        let messageId: string | undefined
        let textPartId: string | undefined
        let hasStartedText = false

        const emitTextStart = (controller: ReadableStreamDefaultController<UIMessageChunk>) => {
            if (hasStartedText) return
            if (!textPartId) {
                const baseId = messageId || `assistant-${Date.now()}`
                textPartId = `${baseId}-text`
            }
            controller.enqueue({ type: "text-start", id: textPartId })
            hasStartedText = true
        }

        const handleEvent = (
            controller: ReadableStreamDefaultController<UIMessageChunk>,
            rawEvent: string
        ) => {
            const lines = rawEvent.split("\n")
            let eventType = ""
            const dataLines: string[] = []

            for (const line of lines) {
                if (line.startsWith("event:")) {
                    eventType = line.replace("event:", "").trim()
                } else if (line.startsWith("data:")) {
                    dataLines.push(line.replace("data:", "").trim())
                }
            }

            if (!dataLines.length) return

            let payload: any
            try {
                payload = JSON.parse(dataLines.join("\n"))
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

        const processBuffer = (
            controller: ReadableStreamDefaultController<UIMessageChunk>,
            flush: boolean
        ) => {
            const events = buffer.split("\n\n")
            const completeEvents = flush ? events : events.slice(0, -1)
            buffer = flush ? "" : events[events.length - 1] || ""

            for (const event of completeEvents) {
                const trimmed = event.trim()
                if (!trimmed) continue
                handleEvent(controller, trimmed)
            }
        }

        return new ReadableStream<UIMessageChunk>({
            start(controller) {
                const reader = stream.getReader()

                const readChunk = (): void => {
                    reader
                        .read()
                        .then(({ done, value }) => {
                            if (done) {
                                processBuffer(controller, true)
                                controller.close()
                                return
                            }

                            buffer += decoder.decode(value, { stream: true })
                            processBuffer(controller, false)
                            readChunk()
                        })
                        .catch((error) => {
                            controller.error(error)
                        })
                }

                readChunk()
            },
        })
    }
}
