import AgentMeKit
import AgentMeProtocol
import Foundation

// Prefer the AgentMeKit wrapper to keep gateway request payloads consistent.
typealias AnyCodable = AgentMeKit.AnyCodable
typealias InstanceIdentity = AgentMeKit.InstanceIdentity

extension AnyCodable {
    var stringValue: String? { self.value as? String }
    var boolValue: Bool? { self.value as? Bool }
    var intValue: Int? { self.value as? Int }
    var doubleValue: Double? { self.value as? Double }
    var dictionaryValue: [String: AnyCodable]? { self.value as? [String: AnyCodable] }
    var arrayValue: [AnyCodable]? { self.value as? [AnyCodable] }

    var foundationValue: Any {
        switch self.value {
        case let dict as [String: AnyCodable]:
            dict.mapValues { $0.foundationValue }
        case let array as [AnyCodable]:
            array.map(\.foundationValue)
        default:
            self.value
        }
    }
}

extension AgentMeProtocol.AnyCodable {
    var stringValue: String? { self.value as? String }
    var boolValue: Bool? { self.value as? Bool }
    var intValue: Int? { self.value as? Int }
    var doubleValue: Double? { self.value as? Double }
    var dictionaryValue: [String: AgentMeProtocol.AnyCodable]? { self.value as? [String: AgentMeProtocol.AnyCodable] }
    var arrayValue: [AgentMeProtocol.AnyCodable]? { self.value as? [AgentMeProtocol.AnyCodable] }

    var foundationValue: Any {
        switch self.value {
        case let dict as [String: AgentMeProtocol.AnyCodable]:
            dict.mapValues { $0.foundationValue }
        case let array as [AgentMeProtocol.AnyCodable]:
            array.map(\.foundationValue)
        default:
            self.value
        }
    }
}
