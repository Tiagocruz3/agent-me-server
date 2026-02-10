import Foundation
import Testing
@testable import AgentMe

@Suite(.serialized)
struct AgentMeConfigFileTests {
    @Test
    func configPathRespectsEnvOverride() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("agentme-config-\(UUID().uuidString)")
            .appendingPathComponent("agentme.json")
            .path

        await TestIsolation.withEnvValues(["AGENTME_CONFIG_PATH": override]) {
            #expect(AgentMeConfigFile.url().path == override)
        }
    }

    @MainActor
    @Test
    func remoteGatewayPortParsesAndMatchesHost() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("agentme-config-\(UUID().uuidString)")
            .appendingPathComponent("agentme.json")
            .path

        await TestIsolation.withEnvValues(["AGENTME_CONFIG_PATH": override]) {
            AgentMeConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "ws://gateway.ts.net:19999",
                    ],
                ],
            ])
            #expect(AgentMeConfigFile.remoteGatewayPort() == 19999)
            #expect(AgentMeConfigFile.remoteGatewayPort(matchingHost: "gateway.ts.net") == 19999)
            #expect(AgentMeConfigFile.remoteGatewayPort(matchingHost: "gateway") == 19999)
            #expect(AgentMeConfigFile.remoteGatewayPort(matchingHost: "other.ts.net") == nil)
        }
    }

    @MainActor
    @Test
    func setRemoteGatewayUrlPreservesScheme() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("agentme-config-\(UUID().uuidString)")
            .appendingPathComponent("agentme.json")
            .path

        await TestIsolation.withEnvValues(["AGENTME_CONFIG_PATH": override]) {
            AgentMeConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "wss://old-host:111",
                    ],
                ],
            ])
            AgentMeConfigFile.setRemoteGatewayUrl(host: "new-host", port: 2222)
            let root = AgentMeConfigFile.loadDict()
            let url = ((root["gateway"] as? [String: Any])?["remote"] as? [String: Any])?["url"] as? String
            #expect(url == "wss://new-host:2222")
        }
    }

    @Test
    func stateDirOverrideSetsConfigPath() async {
        let dir = FileManager().temporaryDirectory
            .appendingPathComponent("agentme-state-\(UUID().uuidString)", isDirectory: true)
            .path

        await TestIsolation.withEnvValues([
            "AGENTME_CONFIG_PATH": nil,
            "AGENTME_STATE_DIR": dir,
        ]) {
            #expect(AgentMeConfigFile.stateDirURL().path == dir)
            #expect(AgentMeConfigFile.url().path == "\(dir)/agentme.json")
        }
    }
}
