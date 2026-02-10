package ai.agentme.android.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class AgentMeProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", AgentMeCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", AgentMeCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", AgentMeCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", AgentMeCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", AgentMeCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", AgentMeCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", AgentMeCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", AgentMeCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", AgentMeCapability.Canvas.rawValue)
    assertEquals("camera", AgentMeCapability.Camera.rawValue)
    assertEquals("screen", AgentMeCapability.Screen.rawValue)
    assertEquals("voiceWake", AgentMeCapability.VoiceWake.rawValue)
  }

  @Test
  fun screenCommandsUseStableStrings() {
    assertEquals("screen.record", AgentMeScreenCommand.Record.rawValue)
  }
}
