// swift-tools-version: 6.2
// Package manifest for the AgentMe macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "AgentMe",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "AgentMeIPC", targets: ["AgentMeIPC"]),
        .library(name: "AgentMeDiscovery", targets: ["AgentMeDiscovery"]),
        .executable(name: "AgentMe", targets: ["AgentMe"]),
        .executable(name: "agentme-mac", targets: ["AgentMeMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.2.2"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.1.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.8.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.8.1"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/AgentMeKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "AgentMeIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "AgentMeDiscovery",
            dependencies: [
                .product(name: "AgentMeKit", package: "AgentMeKit"),
            ],
            path: "Sources/AgentMeDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "AgentMe",
            dependencies: [
                "AgentMeIPC",
                "AgentMeDiscovery",
                .product(name: "AgentMeKit", package: "AgentMeKit"),
                .product(name: "AgentMeChatUI", package: "AgentMeKit"),
                .product(name: "AgentMeProtocol", package: "AgentMeKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/AgentMe.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "AgentMeMacCLI",
            dependencies: [
                "AgentMeDiscovery",
                .product(name: "AgentMeKit", package: "AgentMeKit"),
                .product(name: "AgentMeProtocol", package: "AgentMeKit"),
            ],
            path: "Sources/AgentMeMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "AgentMeIPCTests",
            dependencies: [
                "AgentMeIPC",
                "AgentMe",
                "AgentMeDiscovery",
                .product(name: "AgentMeProtocol", package: "AgentMeKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
