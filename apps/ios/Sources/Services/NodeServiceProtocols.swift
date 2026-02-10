import CoreLocation
import Foundation
import AgentMeKit
import UIKit

protocol CameraServicing: Sendable {
    func listDevices() async -> [CameraController.CameraDeviceInfo]
    func snap(params: AgentMeCameraSnapParams) async throws -> (format: String, base64: String, width: Int, height: Int)
    func clip(params: AgentMeCameraClipParams) async throws -> (format: String, base64: String, durationMs: Int, hasAudio: Bool)
}

protocol ScreenRecordingServicing: Sendable {
    func record(
        screenIndex: Int?,
        durationMs: Int?,
        fps: Double?,
        includeAudio: Bool?,
        outPath: String?) async throws -> String
}

@MainActor
protocol LocationServicing: Sendable {
    func authorizationStatus() -> CLAuthorizationStatus
    func accuracyAuthorization() -> CLAccuracyAuthorization
    func ensureAuthorization(mode: AgentMeLocationMode) async -> CLAuthorizationStatus
    func currentLocation(
        params: AgentMeLocationGetParams,
        desiredAccuracy: AgentMeLocationAccuracy,
        maxAgeMs: Int?,
        timeoutMs: Int?) async throws -> CLLocation
}

protocol DeviceStatusServicing: Sendable {
    func status() async throws -> AgentMeDeviceStatusPayload
    func info() -> AgentMeDeviceInfoPayload
}

protocol PhotosServicing: Sendable {
    func latest(params: AgentMePhotosLatestParams) async throws -> AgentMePhotosLatestPayload
}

protocol ContactsServicing: Sendable {
    func search(params: AgentMeContactsSearchParams) async throws -> AgentMeContactsSearchPayload
    func add(params: AgentMeContactsAddParams) async throws -> AgentMeContactsAddPayload
}

protocol CalendarServicing: Sendable {
    func events(params: AgentMeCalendarEventsParams) async throws -> AgentMeCalendarEventsPayload
    func add(params: AgentMeCalendarAddParams) async throws -> AgentMeCalendarAddPayload
}

protocol RemindersServicing: Sendable {
    func list(params: AgentMeRemindersListParams) async throws -> AgentMeRemindersListPayload
    func add(params: AgentMeRemindersAddParams) async throws -> AgentMeRemindersAddPayload
}

protocol MotionServicing: Sendable {
    func activities(params: AgentMeMotionActivityParams) async throws -> AgentMeMotionActivityPayload
    func pedometer(params: AgentMePedometerParams) async throws -> AgentMePedometerPayload
}

extension CameraController: CameraServicing {}
extension ScreenRecordService: ScreenRecordingServicing {}
extension LocationService: LocationServicing {}
