// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "AgentMeKit",
    platforms: [
        .iOS(.v18),
        .macOS(.v15),
    ],
    products: [
        .library(name: "AgentMeProtocol", targets: ["AgentMeProtocol"]),
        .library(name: "AgentMeKit", targets: ["AgentMeKit"]),
        .library(name: "AgentMeChatUI", targets: ["AgentMeChatUI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/steipete/ElevenLabsKit", exact: "0.1.0"),
        .package(url: "https://github.com/gonzalezreal/textual", exact: "0.3.1"),
    ],
    targets: [
        .target(
            name: "AgentMeProtocol",
            path: "Sources/AgentMeProtocol",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "AgentMeKit",
            dependencies: [
                "AgentMeProtocol",
                .product(name: "ElevenLabsKit", package: "ElevenLabsKit"),
            ],
            path: "Sources/AgentMeKit",
            resources: [
                .process("Resources"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "AgentMeChatUI",
            dependencies: [
                "AgentMeKit",
                .product(
                    name: "Textual",
                    package: "textual",
                    condition: .when(platforms: [.macOS, .iOS])),
            ],
            path: "Sources/AgentMeChatUI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "AgentMeKitTests",
            dependencies: ["AgentMeKit", "AgentMeChatUI"],
            path: "Tests/AgentMeKitTests",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
