import { DefaultChatTransport, type UIMessage } from "ai"
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

export class AssistantChatTransport extends DefaultChatTransport<AssistantUIMessage> {
    /** Set to true before calling sdkRegenerate() to skip duplicate user interaction save */
    isNextRegeneration = false

    constructor() {
        super({
            api: apiClient.buildUrl("/assistant/messages/stream"),
            headers: buildAuthHeaders,
            prepareSendMessagesRequest: ({ id, messages }) => {
                const lastUserMessage = getLastUserMessage(messages)
                const payload = buildPayloadFromMessage(lastUserMessage)
                const isRegeneration = this.isNextRegeneration
                this.isNextRegeneration = false
                return {
                    body: {
                        conversationId: id,
                        message: payload.message,
                        attachments: payload.attachments,
                        analysis: payload.analysis,
                        isRegeneration,
                    },
                }
            },
        })
    }
}
