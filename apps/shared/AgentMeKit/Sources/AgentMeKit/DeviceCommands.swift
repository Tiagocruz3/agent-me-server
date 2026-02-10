import Foundation

public enum AgentMeDeviceCommand: String, Codable, Sendable {
    case status = "device.status"
    case info = "device.info"
}

public enum AgentMeBatteryState: String, Codable, Sendable {
    case unknown
    case unplugged
    case charging
    case full
}

public enum AgentMeThermalState: String, Codable, Sendable {
    case nominal
    case fair
    case serious
    case critical
}

public enum AgentMeNetworkPathStatus: String, Codable, Sendable {
    case satisfied
    case unsatisfied
    case requiresConnection
}

public enum AgentMeNetworkInterfaceType: String, Codable, Sendable {
    case wifi
    case cellular
    case wired
    case other
}

public struct AgentMeBatteryStatusPayload: Codable, Sendable, Equatable {
    public var level: Double?
    public var state: AgentMeBatteryState
    public var lowPowerModeEnabled: Bool

    public init(level: Double?, state: AgentMeBatteryState, lowPowerModeEnabled: Bool) {
        self.level = level
        self.state = state
        self.lowPowerModeEnabled = lowPowerModeEnabled
    }
}

public struct AgentMeThermalStatusPayload: Codable, Sendable, Equatable {
    public var state: AgentMeThermalState

    public init(state: AgentMeThermalState) {
        self.state = state
    }
}

public struct AgentMeStorageStatusPayload: Codable, Sendable, Equatable {
    public var totalBytes: Int64
    public var freeBytes: Int64
    public var usedBytes: Int64

    public init(totalBytes: Int64, freeBytes: Int64, usedBytes: Int64) {
        self.totalBytes = totalBytes
        self.freeBytes = freeBytes
        self.usedBytes = usedBytes
    }
}

public struct AgentMeNetworkStatusPayload: Codable, Sendable, Equatable {
    public var status: AgentMeNetworkPathStatus
    public var isExpensive: Bool
    public var isConstrained: Bool
    public var interfaces: [AgentMeNetworkInterfaceType]

    public init(
        status: AgentMeNetworkPathStatus,
        isExpensive: Bool,
        isConstrained: Bool,
        interfaces: [AgentMeNetworkInterfaceType])
    {
        self.status = status
        self.isExpensive = isExpensive
        self.isConstrained = isConstrained
        self.interfaces = interfaces
    }
}

public struct AgentMeDeviceStatusPayload: Codable, Sendable, Equatable {
    public var battery: AgentMeBatteryStatusPayload
    public var thermal: AgentMeThermalStatusPayload
    public var storage: AgentMeStorageStatusPayload
    public var network: AgentMeNetworkStatusPayload
    public var uptimeSeconds: Double

    public init(
        battery: AgentMeBatteryStatusPayload,
        thermal: AgentMeThermalStatusPayload,
        storage: AgentMeStorageStatusPayload,
        network: AgentMeNetworkStatusPayload,
        uptimeSeconds: Double)
    {
        self.battery = battery
        self.thermal = thermal
        self.storage = storage
        self.network = network
        self.uptimeSeconds = uptimeSeconds
    }
}

public struct AgentMeDeviceInfoPayload: Codable, Sendable, Equatable {
    public var deviceName: String
    public var modelIdentifier: String
    public var systemName: String
    public var systemVersion: String
    public var appVersion: String
    public var appBuild: String
    public var locale: String

    public init(
        deviceName: String,
        modelIdentifier: String,
        systemName: String,
        systemVersion: String,
        appVersion: String,
        appBuild: String,
        locale: String)
    {
        self.deviceName = deviceName
        self.modelIdentifier = modelIdentifier
        self.systemName = systemName
        self.systemVersion = systemVersion
        self.appVersion = appVersion
        self.appBuild = appBuild
        self.locale = locale
    }
}
