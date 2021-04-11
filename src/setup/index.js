import React from 'react'
import debounce from 'lodash/debounce'
import {
  Segment,
  Divider,
  Message,
  Icon,
  Input,
  Accordion
} from 'semantic-ui-react'
import Header from '../components/Header'
import { INIT_MESSAGE } from "../constants/data_service";

export default class Setup extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      proxyUrl: props.proxyUrl,
      isLoading: false,
      isValid: true
    }
  }

  proxyUrlOnChange = (_, { value }) => {
    this.setState({ proxyUrl: value })
    this.validateUrl()
  }

  validateUrl = debounce(() => {
    if (!isValidURL(this.state.proxyUrl)) {
      this.setState({ isValid: false })
    } else {
      this.setState({ isLoading: true })

      fetch(this.state.proxyUrl)
        .then(async res => {
          const data = await res.text();
          if (!res.ok || data !== INIT_MESSAGE)
            throw new Error()

          this.setState({
            isLoading: false,
            isValid: true
          })
          const localState = { ...this.props, proxyUrl: this.state.proxyUrl }
          chrome.storage.local.set(localState)
        })
        .catch(err => this.setState({
          isLoading: false,
          isValid: false
        }))
    }
  }, 600)

  inputIcon() {
    if (!this.state.isValid) return 'warning circle'
    if (
      !this.state.isLoading &&
      this.state.isValid &&
      this.state.proxyUrl.length > 0
    ) {
      return 'check'
    }
  }

  render() {
    return (
      <Segment className="wrapper">
        <Header />
        <Segment basic attached>
          <Message icon warning>
            <Icon name="info" />
            <Message.Content>
              <Message.Header>
                This is the service (API) used to compress your images
              </Message.Header>
              <p>
                The installation guide section lists some easy ways to deploy yours, netlify and heroku both on free plans.
              </p>
            </Message.Content>
          </Message>

          <h3>Data Compression Service</h3>
          {this.state.proxyUrl.length > 0 &&
            !this.state.isLoading &&
            !this.state.isValid && (
              <Message
                error
                header="Invalid compression service address"
                content="Given URL does not appear to be running Bandwidth Hero data compression service."
              />
            )}
          <Input
            fluid
            type="url"
            label="URL"
            loading={this.state.isLoading}
            icon={this.inputIcon()}
            value={this.state.proxyUrl}
            onChange={this.proxyUrlOnChange}
          />

          {this.state.proxyUrl === '' && (
            <div style={{ paddingTop: '1em' }}>
              <p>
                To start using Bandwidth Hero you need to setup a data
                compression service.
              </p>
              <p>
                Check out the installation guide bellow.<br /> Once you have
                your data compression service running &mdash; put its URL into
                the field above.
              </p>
            </div>
          )}

          <h3>Installation Guide</h3>
          <Accordion fluid styled>
            <Accordion.Title>
              <Icon name="dropdown" /> Netlify Functions (Recommended)
            </Accordion.Title>
            <Accordion.Content>
              <p>
                Netlify is a hosting website, and Netlify Functions are serverless functions that are good substitute for a server setup in some cases (like this one)<br />
                Their free plan gives you a quota of 1,25,000 requests per month, and 100 GB per month bandwidth (Don't fear it won't ask credit card details :D )

                More details at https://github.com/adi-g15/bandwidth-hero-proxy
              </p>
              <p>
                Click the button bellow to deploy to Netlify for free.
              </p>
              <a
                href="https://app.netlify.com/start/deploy?repository=https://github.com/adi-g15/bandwidth-hero-proxy"
                rel="nofollow"
                target="_blank"
              >
                <img
                  src="https://www.netlify.com/img/deploy/button.svg"
                  alt="Deploy to Netlify"
                />
              </a>
            </Accordion.Content>

            <Accordion.Title>
              <Icon name="dropdown" /> Heroku
            </Accordion.Title>
            <Accordion.Content>
              <p>
                Heroku is a cloud-based app hosting provider.<br />
                They offer a free plan which has limited resources and needs to
                sleep 8 hours per day.
              </p>
              <p>
                Click the button bellow to deploy an instance of compression
                service to Heroku for free.
              </p>
              <a
                href="https://heroku.com/deploy?template=https://github.com/ayastreb/bandwidth-hero-proxy"
                rel="nofollow"
                target="_blank"
              >
                <img
                  src="https://www.herokucdn.com/deploy/button.svg"
                  alt="Deploy to Heroku"
                  data-canonical-src="https://www.herokucdn.com/deploy/button.svg"
                />
              </a>
            </Accordion.Content>

            <Accordion.Title>
              <Icon name="dropdown" /> Self-hosted
            </Accordion.Title>
            <Accordion.Content>
              <p>
                This is more advanced than above options
                <br/>
                Head over to <a href="https://github.com/ayastreb/bandwidth-hero-proxy">https://github.com/ayastreb/bandwidth-hero-proxy</a>
                <br/>
                Data compression service is a Node.js app which you can run on
                any server that supports Node.js. Check out{' '}
                <a href="https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-16-04">
                  this guide
                </a>{' '}
                on how to setup Node.js on Ubuntu.
              </p>
              <p>
                DigitalOcean also provides an{' '}
                <a href="https://www.digitalocean.com/products/one-click-apps/node-js/">
                  easy way
                </a>{' '}
                to setup a server ready to host Node.js apps.
              </p>
            </Accordion.Content>
          </Accordion>
        </Segment>
      </Segment>
    )
  }
}

function isValidURL(str) {
  var a = document.createElement('a')
  a.href = str
  return a.host && a.host != window.location.host
}
