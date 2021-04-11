import React, { useEffect, useState } from 'react'
import { HashRouter as Router, Route } from 'react-router-dom'
import Header from '../components/Header'
import Home from '../components/Home'
import Footer from '../components/Footer'
import parseUrl from '../utils/parseUrl'
import defaults from '../defaults'

export default function Popup(props) {
  const [enabled, setEnabled] = useState(props.enabled);
  const [statistics, setstatistics] = useState(props.statistics);
  const [enabledHosts, setEnabledHosts] = useState(props.enabledHosts);
  const [convertBw, setconvertBw] = useState(props.convertBw);
  const [compressionLevel, setcompressionLevel] = useState(props.compressionLevel);
  const [isWebpSupported, setisWebpSupported] = useState(props.isWebpSupported);
  const [proxyUrl, setproxyUrl] = useState(props.proxyUrl);


  /**
 * Receive state changes from background process and update UI.
 */
  function stateWasUpdatedFromBackground(changes) {
    if (changes["enabled"]) {
      setEnabled(changes["enabled"].newValue); // if not different, then no repaint will be done
    }
    if (changes["statistics"]) {
      setstatistics(changes["statistics"].newValue); // if not different, then no repaint will be done
    }
    if (changes["enabledHosts"]) {
      setEnabledHosts(changes["enabledHosts"].newValue); // if not different, then no repaint will be done
    }
    if (changes["convertBw"]) {
      setconvertBw(changes["convertBw"].newValue); // if not different, then no repaint will be done
    }
    if (changes["compressionLevel"]) {
      setcompressionLevel(changes["compressionLevel"].newValue); // if not different, then no repaint will be done
    }
    if (changes["isWebpSupported"]) {
      setisWebpSupported(changes["isWebpSupported"].newValue); // if not different, then no repaint will be done
    }
    if (changes["proxyUrl"]) {
      setproxyUrl(changes["proxyUrl"].newValue); // if not different, then no repaint will be done
    }
  }


  // @NOTE @BUG (Can be) - Note that this code was in the constructor, and should be well off here, though consider it moving out of inside useEffect
  useEffect(() => {
    if (!chrome.storage.onChanged.hasListener(stateWasUpdatedFromBackground)) {
      chrome.storage.onChanged.addListener(stateWasUpdatedFromBackground);
    }
  }, [])

  function enableSwitchWasChanged() {
    chrome.storage.local.set({ enabled: !enabled });
    setEnabled(enabled => !enabled);
  }

  function siteWasDisabled() {
    const { hostname } = parseUrl(props.currentUrl);
    chrome.storage.local.set({ enabledHosts: enabledHosts.filter(site => site !== hostname) });
    setEnabledHosts(enabledHosts => enabledHosts.filter(site => site !== hostname));
  }

  function siteWasEnabled() {
    const { hostname } = parseUrl(props.currentUrl);
    chrome.storage.local.set({ enabledHosts: enabledHosts.concat(hostname) });
    setEnabledHosts(enabledHosts => enabledHosts.concat(hostname))
  }

  function enabledHostsWasChanged(_, { value }) {
    chrome.storage.local.set({ enabledHosts: value.split('\n') })
    setEnabledHosts(value.split('\n'));
  }

  function convertBwWasChanged() {
    chrome.storage.local.set({ convertBw: !convertBw });
    setconvertBw(convertBw => !convertBw);
  }

  function compressionLevelWasChanged(_, { value }) {
    chrome.storage.local.set({ compressionLevel: value });
    setcompressionLevel(value);
  }

  return (
    <Router>
      <div>
        <Header enabled={enabled} onChange={enableSwitchWasChanged} />
        <Route
          exact
          path="/"
          render={() => (
            <Home
              enabled={enabled}
              statistics={statistics}
              enabledHosts={enabledHosts}
              convertBw={convertBw}
              compressionLevel={compressionLevel}
              isWebpSupported={isWebpSupported}
              proxyUrl={proxyUrl}
              currentUrl={props.currentUrl}
              onSiteEnable={siteWasEnabled}
              onSiteDisable={siteWasDisabled}
              enabledOnChange={enabledHostsWasChanged}
              convertBwOnChange={convertBwWasChanged}
              compressionLevelOnChange={compressionLevelWasChanged}
            />
          )}
        />
        <Footer />
      </div>
    </Router>
  )

}
