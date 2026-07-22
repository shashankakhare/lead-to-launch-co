import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'
import { brand, button, container, divider, footer, h1, link, main, text } from './_styles'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName}</Text>
        <Heading style={h1}>Confirm your email</Heading>
        <Text style={text}>
          Welcome aboard. Verify{' '}
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>{' '}
          to activate your account and start tracking your project.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Verify email
        </Button>
        <Hr style={divider} />
        <Text style={footer}>
          Didn't sign up? You can safely ignore this email.{' '}
          <Link href={siteUrl} style={{ color: '#8a8a8f' }}>
            {siteUrl.replace(/^https?:\/\//, '')}
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
