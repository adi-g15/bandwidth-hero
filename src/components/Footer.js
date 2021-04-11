import React from 'react'
import { Button, Container } from 'semantic-ui-react'

export default function Footer() {
  return (
    <Container className="footer" textAlign="right">
      <Button
        basic
        content="How it works?"
        href="https://bandwidth-hero.com/"
        target="_blank"
        icon="home"
      />
      <Button
        basic
        href="https://github.com/adi-g15/bandwidth-hero"
        target="_blank"
        content="Repository"
        positive
      />
    </Container>
  )
}
