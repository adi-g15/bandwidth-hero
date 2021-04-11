import React from 'react'
import { Segment, Accordion, Icon } from 'semantic-ui-react'
import ManageEnabled from './ManageEnabled'
import CompressionSettings from './CompressionSettings'

export default ({
  enabledHosts,
  convertBw,
  compressionLevel,
  enabledOnChange,
  convertBwOnChange,
  isWebpSupported,
  compressionLevelOnChange
}) => {
  return (
    <Segment attached>
      <Accordion>
        <Accordion.Title>
          <Icon name="dropdown" />
          Manage enabled sites
        </Accordion.Title>
        <Accordion.Content>
          <ManageEnabled enabledHosts={enabledHosts} onChange={enabledOnChange} />
        </Accordion.Content>
        <Accordion.Title>
          <Icon name="dropdown" />
          Compression settings
        </Accordion.Title>
        <Accordion.Content>
          <CompressionSettings
            convertBw={convertBw}
            isWebpSupported={isWebpSupported}
            compressionLevel={compressionLevel}
            onConvertBwChange={convertBwOnChange}
            onCompressionLevelChange={compressionLevelOnChange}
          />
        </Accordion.Content>
      </Accordion>
    </Segment>
  )
}
