import { html, nothing } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import type { AssistantIdentity } from "../assistant-identity.ts";
import type { MessageGroup } from "../types/chat-types.ts";
import { icons } from "../icons.ts";
import { toSanitizedMarkdownHtml } from "../markdown.ts";
import {
  extractTextCached,
  extractThinkingCached,
  formatReasoningMarkdown,
} from "./message-extract.ts";
import { isToolResultMessage, normalizeRoleForGrouping } from "./message-normalizer.ts";
import { extractToolCards, renderToolCardSidebar } from "./tool-cards.ts";

type ImageBlock = {
  url: string;
  alt?: string;
};

function extractImages(message: unknown): ImageBlock[] {
  const m = message as Record<string, unknown>;
  const content = m.content;
  const images: ImageBlock[] = [];

  if (Array.isArray(content)) {
    for (const block of content) {
      if (typeof block !== "object" || block === null) {
        continue;
      }
      const b = block as Record<string, unknown>;

      if (b.type === "image") {
        const source = b.source as Record<string, unknown> | undefined;
        if (source?.type === "base64" && typeof source.data === "string") {
          const data = source.data;
          const mediaType = (source.media_type as string) || "image/png";
          const url = data.startsWith("data:") ? data : `data:${mediaType};base64,${data}`;
          images.push({ url });
        } else if (typeof b.url === "string") {
          images.push({ url: b.url });
        }
      } else if (b.type === "image_url") {
        const imageUrl = b.image_url as Record<string, unknown> | undefined;
        if (typeof imageUrl?.url === "string") {
          images.push({ url: imageUrl.url });
        }
      }
    }
  }

  return images;
}

export function renderReadingIndicatorGroup(assistant?: AssistantIdentity) {
  return html`
    <div class="chat-turn assistant">
      ${renderAvatar("assistant", assistant)}
      <div class="chat-turn-content">
        <div class="chat-reading-indicator" aria-hidden="true">
          <span class="chat-reading-indicator__dots">
            <span></span><span></span><span></span>
          </span>
        </div>
      </div>
    </div>
  `;
}

export function renderStreamingGroup(
  text: string,
  startedAt: number,
  onOpenSidebar?: (content: string) => void,
  assistant?: AssistantIdentity,
) {
  return html`
    <div class="chat-turn assistant">
      ${renderAvatar("assistant", assistant)}
      <div class="chat-turn-content">
        ${renderGroupedMessage(
          {
            role: "assistant",
            content: [{ type: "text", text }],
            timestamp: startedAt,
          },
          { isStreaming: true, showReasoning: false },
          onOpenSidebar,
        )}
        <div class="chat-streaming-indicator" aria-hidden="true">
          <span class="chat-streaming-indicator__dot"></span>
          <span class="chat-streaming-indicator__dot"></span>
          <span class="chat-streaming-indicator__dot"></span>
        </div>
      </div>
    </div>
  `;
}

export function renderMessageGroup(
  group: MessageGroup,
  opts: {
    onOpenSidebar?: (content: string) => void;
    showReasoning: boolean;
    assistantName?: string;
    assistantAvatar?: string | null;
    onRegenerate?: (messageText: string) => void;
    onLike?: (messageId: string, liked: boolean) => void;
  },
) {
  const normalizedRole = normalizeRoleForGrouping(group.role);
  const assistantName = opts.assistantName ?? "Assistant";
  const roleClass =
    normalizedRole === "user" ? "user" : normalizedRole === "assistant" ? "assistant" : "other";

  if (roleClass === "user") {
    return html`
      <div class="chat-turn user">
        <div class="chat-turn-messages">
          ${group.messages.map((item, index) =>
            renderGroupedMessage(
              item.message,
              {
                isStreaming: group.isStreaming && index === group.messages.length - 1,
                showReasoning: opts.showReasoning,
              },
              opts.onOpenSidebar,
            ),
          )}
        </div>
      </div>
    `;
  }

  // Assistant or other role
  const firstMessage = group.messages[0]?.message;
  const messageId = extractMessageId(firstMessage);
  const markdown = extractAssistantMarkdown(group, opts.showReasoning);

  return html`
    <div class="chat-turn ${roleClass}">
      ${renderAvatar(group.role, {
        name: assistantName,
        avatar: opts.assistantAvatar ?? null,
      })}
      <div class="chat-turn-content">
        ${group.messages.map((item, index) =>
          renderGroupedMessage(
            item.message,
            {
              isStreaming: group.isStreaming && index === group.messages.length - 1,
              showReasoning: opts.showReasoning,
            },
            opts.onOpenSidebar,
          ),
        )}
        ${renderActionRow({ markdown, messageId, onRegenerate: opts.onRegenerate, onLike: opts.onLike })}
      </div>
    </div>
  `;
}

function extractMessageId(message: unknown): string {
  const m = message as Record<string, unknown>;
  return typeof m.id === "string" ? m.id : typeof m.messageId === "string" ? m.messageId : "";
}

function extractAssistantMarkdown(group: MessageGroup, showReasoning: boolean): string {
  const parts: string[] = [];
  for (const item of group.messages) {
    const text = extractTextCached(item.message) ?? "";
    if (text.trim()) {
      parts.push(text.trim());
    }
    const thinking = showReasoning ? extractThinkingCached(item.message) : null;
    if (thinking?.trim()) {
      parts.push(formatReasoningMarkdown(thinking));
    }
  }
  return parts.join("\n\n");
}

function renderAvatar(role: string, assistant?: Pick<AssistantIdentity, "name" | "avatar">) {
  const normalized = normalizeRoleForGrouping(role);
  const assistantName = assistant?.name?.trim() || "Assistant";
  const assistantAvatar = assistant?.avatar?.trim() || "";
  const initial =
    normalized === "user"
      ? "U"
      : normalized === "assistant"
        ? assistantName.charAt(0).toUpperCase() || "A"
        : normalized === "tool"
          ? "⚙"
          : "?";
  const className =
    normalized === "user"
      ? "user"
      : normalized === "assistant"
        ? "assistant"
        : normalized === "tool"
          ? "tool"
          : "other";

  if (assistantAvatar && normalized === "assistant") {
    if (isAvatarUrl(assistantAvatar)) {
      return html`<img
        class="chat-avatar ${className}"
        src="${assistantAvatar}"
        alt="${assistantName}"
      />`;
    }
    return html`<div class="chat-avatar ${className}">${assistantAvatar}</div>`;
  }

  return html`<div class="chat-avatar ${className}">${initial}</div>`;
}

function isAvatarUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || /^data:image\//i.test(value) || value.startsWith("/");
}

function renderMessageImages(images: ImageBlock[]) {
  if (images.length === 0) {
    return nothing;
  }

  return html`
    <div class="chat-message-images">
      ${images.map(
        (img) => html`
          <img
            src=${img.url}
            alt=${img.alt ?? "Attached image"}
            class="chat-message-image"
            @click=${() => window.open(img.url, "_blank")}
          />
        `,
      )}
    </div>
  `;
}

function renderActionRow(props: {
  markdown: string;
  messageId: string;
  onRegenerate?: (messageText: string) => void;
  onLike?: (messageId: string, liked: boolean) => void;
}) {
  const hasContent = props.markdown.trim().length > 0;
  if (!hasContent) {
    return nothing;
  }

  return html`
    <div class="chat-action-row">
      <button
        class="chat-action-btn"
        type="button"
        title="Copy"
        aria-label="Copy response"
        @click=${async (e: Event) => {
          const btn = e.currentTarget as HTMLButtonElement;
          try {
            await navigator.clipboard.writeText(props.markdown);
            btn.dataset.copied = "1";
            setTimeout(() => delete btn.dataset.copied, 1500);
          } catch {
            // ignore
          }
        }}
      >
        ${icons.copy}
      </button>
      <button
        class="chat-action-btn"
        type="button"
        title="Regenerate"
        aria-label="Regenerate response"
        ?disabled=${!props.onRegenerate}
        @click=${() => props.onRegenerate?.(props.markdown)}
      >
        ${icons.refresh}
      </button>
      <button
        class="chat-action-btn"
        type="button"
        title="Good response"
        aria-label="Good response"
        ?disabled=${!props.onLike}
        @click=${(e: Event) => {
          const btn = e.currentTarget as HTMLButtonElement;
          const liked = btn.dataset.liked !== "true";
          btn.dataset.liked = String(liked);
          props.onLike?.(props.messageId, liked);
        }}
      >
        ${icons.thumbsUp}
      </button>
      <button
        class="chat-action-btn"
        type="button"
        title="Bad response"
        aria-label="Bad response"
        ?disabled=${!props.onLike}
        @click=${(e: Event) => {
          const btn = e.currentTarget as HTMLButtonElement;
          const liked = btn.dataset.liked !== "false";
          btn.dataset.liked = String(!liked);
          props.onLike?.(props.messageId, false);
        }}
      >
        ${icons.thumbsDown}
      </button>
    </div>
  `;
}

function renderGroupedMessage(
  message: unknown,
  opts: { isStreaming: boolean; showReasoning: boolean },
  onOpenSidebar?: (content: string) => void,
) {
  const m = message as Record<string, unknown>;
  const role = typeof m.role === "string" ? m.role : "unknown";
  const isToolResult =
    isToolResultMessage(message) ||
    role.toLowerCase() === "toolresult" ||
    role.toLowerCase() === "tool_result" ||
    typeof m.toolCallId === "string" ||
    typeof m.tool_call_id === "string";

  const toolCards = extractToolCards(message);
  const hasToolCards = toolCards.length > 0;
  const images = extractImages(message);
  const hasImages = images.length > 0;

  const extractedText = extractTextCached(message);
  const extractedThinking =
    opts.showReasoning && role === "assistant" ? extractThinkingCached(message) : null;
  const markdownBase = extractedText?.trim() ? extractedText : null;
  const reasoningMarkdown = extractedThinking ? formatReasoningMarkdown(extractedThinking) : null;
  const markdown = markdownBase;

  const isUser = normalizeRoleForGrouping(role) === "user";
  const bubbleClasses = ["chat-bubble", opts.isStreaming ? "streaming" : "", "fade-in"]
    .filter(Boolean)
    .join(" ");

  if (!markdown && hasToolCards && isToolResult) {
    return html`${toolCards.map((card) => renderToolCardSidebar(card, onOpenSidebar))}`;
  }

  if (!markdown && !hasToolCards && !hasImages) {
    return nothing;
  }

  // For assistant messages, render plain content without bubble
  if (!isUser) {
    return html`
      <div class="chat-content fade-in">
        ${renderMessageImages(images)}
        ${
          reasoningMarkdown
            ? html`<div class="chat-thinking">${unsafeHTML(toSanitizedMarkdownHtml(reasoningMarkdown))}</div>`
            : nothing
        }
        ${
          markdown
            ? html`<div class="chat-text">${unsafeHTML(toSanitizedMarkdownHtml(markdown))}</div>`
            : nothing
        }
        ${toolCards.map((card) => renderToolCardSidebar(card, onOpenSidebar))}
      </div>
    `;
  }

  // User messages use bubble
  return html`
    <div class="${bubbleClasses}" data-kind=${isToolResult ? "tool" : "message"}>
      ${renderMessageImages(images)}
      ${markdown ? html`<div class="chat-text">${unsafeHTML(toSanitizedMarkdownHtml(markdown))}</div>` : nothing}
      ${toolCards.map((card) => renderToolCardSidebar(card, onOpenSidebar))}
    </div>
  `;
}
