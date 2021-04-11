import React from 'react'
import { Form, TextArea } from 'semantic-ui-react'

export default ({ enabledHosts = [], onChange }) => {
  return (
    <Form>
      <Form.Field
        control={TextArea}
        rows={4}
        value={enabledHosts.join('\n')}
        onChange={onChange}
      />
    </Form>
  )
}
