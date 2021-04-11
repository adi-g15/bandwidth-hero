/* @flow */
declare var chrome: any
import type { AppState } from '../types'

module.exports = (state: AppState) => {
  if (!state.enabledHosts) {
    state.enabledHosts = state.whitelist
    chrome.storage.local.set(state)
  }
}
