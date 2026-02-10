import Foundation

public enum AgentMeLocationMode: String, Codable, Sendable, CaseIterable {
    case off
    case whileUsing
    case always
}
