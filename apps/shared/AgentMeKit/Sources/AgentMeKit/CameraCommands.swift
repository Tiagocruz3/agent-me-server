import Foundation

public enum AgentMeCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum AgentMeCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum AgentMeCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum AgentMeCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct AgentMeCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: AgentMeCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: AgentMeCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: AgentMeCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: AgentMeCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct AgentMeCameraClipParams: Codable, Sendable, Equatable {
    public var facing: AgentMeCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: AgentMeCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: AgentMeCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: AgentMeCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
