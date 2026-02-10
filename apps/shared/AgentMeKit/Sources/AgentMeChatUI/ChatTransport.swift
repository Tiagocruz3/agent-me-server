import Foundation

public enum AgentMeChatTransportEvent: Sendable {
    case health(ok: Bool)
    case tick
    case chat(AgentMeChatEventPayload)
    case agent(AgentMeAgentEventPayload)
    case seqGap
}

public protocol AgentMeChatTransport: Sendable {
    func requestHistory(sessionKey: String) async throws -> AgentMeChatHistoryPayload
    func sendMessage(
        sessionKey: String,
        message: String,
        thinking: String,
        idempotencyKey: String,
        attachments: [AgentMeChatAttachmentPayload]) async throws -> AgentMeChatSendResponse

    func abortRun(sessionKey: String, runId: String) async throws
    func listSessions(limit: Int?) async throws -> AgentMeChatSessionsListResponse

    func requestHealth(timeoutMs: Int) async throws -> Bool
    func events() -> AsyncStream<AgentMeChatTransportEvent>

    func setActiveSessionKey(_ sessionKey: String) async throws
}

extension AgentMeChatTransport {
    public func setActiveSessionKey(_: String) async throws {}

    public func abortRun(sessionKey _: String, runId _: String) async throws {
        throw NSError(
            domain: "AgentMeChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "chat.abort not supported by this transport"])
    }

    public func listSessions(limit _: Int?) async throws -> AgentMeChatSessionsListResponse {
        throw NSError(
            domain: "AgentMeChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.list not supported by this transport"])
    }
}
