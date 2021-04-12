import React from 'react'
import { Segment, Button, Checkbox, Label } from 'semantic-ui-react'
import parseUrl from '../utils/parseUrl'

export default function EnabledButton({ enabledAll, allSitesChanged, enabledHosts, currentUrl, onSiteDisable, onSiteEnable }) {
  const { schema, hostname } = parseUrl(currentUrl)

  if (/^https?:/i.test(schema)) {
    return (
      <Segment attached>
        { (!enabledHosts.includes(hostname)) ? (
          <Button content="Enable on this site" onClick={onSiteEnable} basic positive fluid />
        ) : (<Button content="Disable on this site" onClick={onSiteDisable} basic negative fluid />)
        }
      </Segment>
    );
  } else {
    return null;
    // TODO - Implement a Enable Everywhere function
    // return (
    //   <Segment.Group horizontal>
    //     <Segment className="center_element">
    //       <Checkbox checked={enabledAll} onChange={(_) => allSitesChanged()} slider />
    //     </Segment>
    //     <Segment>
    //       <Label>{enabledAll ? "Enabled Everywhere" : "Use Enable List"}</Label>
    //     </Segment>
    //   </Segment.Group>
    // );
  }
}
