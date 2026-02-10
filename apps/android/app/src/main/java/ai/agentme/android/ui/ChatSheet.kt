package ai.agentme.android.ui

import androidx.compose.runtime.Composable
import ai.agentme.android.MainViewModel
import ai.agentme.android.ui.chat.ChatSheetContent

@Composable
fun ChatSheet(viewModel: MainViewModel) {
  ChatSheetContent(viewModel = viewModel)
}
