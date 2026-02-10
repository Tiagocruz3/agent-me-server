import Foundation

// Stable identifier used for both the macOS LaunchAgent label and Nix-managed defaults suite.
// nix-agentme writes app defaults into this suite to survive app bundle identifier churn.
let launchdLabel = "ai.agentme.mac"
let gatewayLaunchdLabel = "ai.agentme.gateway"
let onboardingVersionKey = "agentme.onboardingVersion"
let onboardingSeenKey = "agentme.onboardingSeen"
let currentOnboardingVersion = 7
let pauseDefaultsKey = "agentme.pauseEnabled"
let iconAnimationsEnabledKey = "agentme.iconAnimationsEnabled"
let swabbleEnabledKey = "agentme.swabbleEnabled"
let swabbleTriggersKey = "agentme.swabbleTriggers"
let voiceWakeTriggerChimeKey = "agentme.voiceWakeTriggerChime"
let voiceWakeSendChimeKey = "agentme.voiceWakeSendChime"
let showDockIconKey = "agentme.showDockIcon"
let defaultVoiceWakeTriggers = ["agentme"]
let voiceWakeMaxWords = 32
let voiceWakeMaxWordLength = 64
let voiceWakeMicKey = "agentme.voiceWakeMicID"
let voiceWakeMicNameKey = "agentme.voiceWakeMicName"
let voiceWakeLocaleKey = "agentme.voiceWakeLocaleID"
let voiceWakeAdditionalLocalesKey = "agentme.voiceWakeAdditionalLocaleIDs"
let voicePushToTalkEnabledKey = "agentme.voicePushToTalkEnabled"
let talkEnabledKey = "agentme.talkEnabled"
let iconOverrideKey = "agentme.iconOverride"
let connectionModeKey = "agentme.connectionMode"
let remoteTargetKey = "agentme.remoteTarget"
let remoteIdentityKey = "agentme.remoteIdentity"
let remoteProjectRootKey = "agentme.remoteProjectRoot"
let remoteCliPathKey = "agentme.remoteCliPath"
let canvasEnabledKey = "agentme.canvasEnabled"
let cameraEnabledKey = "agentme.cameraEnabled"
let systemRunPolicyKey = "agentme.systemRunPolicy"
let systemRunAllowlistKey = "agentme.systemRunAllowlist"
let systemRunEnabledKey = "agentme.systemRunEnabled"
let locationModeKey = "agentme.locationMode"
let locationPreciseKey = "agentme.locationPreciseEnabled"
let peekabooBridgeEnabledKey = "agentme.peekabooBridgeEnabled"
let deepLinkKeyKey = "agentme.deepLinkKey"
let modelCatalogPathKey = "agentme.modelCatalogPath"
let modelCatalogReloadKey = "agentme.modelCatalogReload"
let cliInstallPromptedVersionKey = "agentme.cliInstallPromptedVersion"
let heartbeatsEnabledKey = "agentme.heartbeatsEnabled"
let debugPaneEnabledKey = "agentme.debugPaneEnabled"
let debugFileLogEnabledKey = "agentme.debug.fileLogEnabled"
let appLogLevelKey = "agentme.debug.appLogLevel"
let voiceWakeSupported: Bool = ProcessInfo.processInfo.operatingSystemVersion.majorVersion >= 26
