import React from 'react'
import UsageStatistic from './UsageStatistic'
import EnabledButton from './EnabledButton'
import SettingsAccordion from './SettingsAccordion'

export default function Home({
  statistics,
  enabledHosts,
  currentUrl,
  compressionLevel,
  convertBw,
  onSiteDisable,
  onSiteEnable,
  enabledOnChange,
  convertBwOnChange,
  isWebpSupported,
  compressionLevelOnChange
}) {
  return (
    <div>
      <UsageStatistic
        filesProcessed={statistics.filesProcessed}
        bytesProcessed={statistics.bytesProcessed}
        bytesSaved={statistics.bytesSaved}
      />
      <EnabledButton
        enabledHosts={enabledHosts}
        currentUrl={currentUrl}
        onSiteDisable={onSiteDisable}
        onSiteEnable={onSiteEnable}
      />
      <SettingsAccordion
        enabledHosts={enabledHosts}
        convertBw={convertBw}
        isWebpSupported={isWebpSupported}
        compressionLevel={compressionLevel}
        enabledOnChange={enabledOnChange}
        convertBwOnChange={convertBwOnChange}
        compressionLevelOnChange={compressionLevelOnChange}
      />
    </div>
  );
}
