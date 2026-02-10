import Foundation

public enum AgentMeRemindersCommand: String, Codable, Sendable {
    case list = "reminders.list"
    case add = "reminders.add"
}

public enum AgentMeReminderStatusFilter: String, Codable, Sendable {
    case incomplete
    case completed
    case all
}

public struct AgentMeRemindersListParams: Codable, Sendable, Equatable {
    public var status: AgentMeReminderStatusFilter?
    public var limit: Int?

    public init(status: AgentMeReminderStatusFilter? = nil, limit: Int? = nil) {
        self.status = status
        self.limit = limit
    }
}

public struct AgentMeRemindersAddParams: Codable, Sendable, Equatable {
    public var title: String
    public var dueISO: String?
    public var notes: String?
    public var listId: String?
    public var listName: String?

    public init(
        title: String,
        dueISO: String? = nil,
        notes: String? = nil,
        listId: String? = nil,
        listName: String? = nil)
    {
        self.title = title
        self.dueISO = dueISO
        self.notes = notes
        self.listId = listId
        self.listName = listName
    }
}

public struct AgentMeReminderPayload: Codable, Sendable, Equatable {
    public var identifier: String
    public var title: String
    public var dueISO: String?
    public var completed: Bool
    public var listName: String?

    public init(
        identifier: String,
        title: String,
        dueISO: String? = nil,
        completed: Bool,
        listName: String? = nil)
    {
        self.identifier = identifier
        self.title = title
        self.dueISO = dueISO
        self.completed = completed
        self.listName = listName
    }
}

public struct AgentMeRemindersListPayload: Codable, Sendable, Equatable {
    public var reminders: [AgentMeReminderPayload]

    public init(reminders: [AgentMeReminderPayload]) {
        self.reminders = reminders
    }
}

public struct AgentMeRemindersAddPayload: Codable, Sendable, Equatable {
    public var reminder: AgentMeReminderPayload

    public init(reminder: AgentMeReminderPayload) {
        self.reminder = reminder
    }
}
