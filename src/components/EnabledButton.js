import React from 'react'
import { Segment, Button } from 'semantic-ui-react'
import parseUrl from '../utils/parseUrl'

export default function EnabledButton({ enabledHosts, currentUrl, onSiteDisable, onSiteEnable }) {
  const { schema, hostname } = parseUrl(currentUrl)

  if (!/^https?:/i.test(schema)) return null
  if (!enabledHosts.includes(hostname)) {
    return (
      <Segment attached>
        <Button content="Enable on this site" onClick={onSiteEnable} basic positive fluid />
      </Segment>
    )
  } else {
    return (
      <Segment attached>
        <Button content="Disable on this site" onClick={onSiteDisable} basic negative fluid />
      </Segment>
    )
  }
}
