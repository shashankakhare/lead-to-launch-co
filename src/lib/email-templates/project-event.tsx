import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'
import { brand, container, divider, footer, h1, main, text } from './_styles'

interface Props {
  recipientName?: string
  recipientRole?: 'client' | 'developer' | 'admin'
  title?: string
  message?: string
  orderId?: string
  packageLabel?: string
  status?: string
  linkUrl?: string
  linkLabel?: string
}

const ProjectEventEmail = ({
  recipientName,
  recipientRole = 'client',
  title = 'Project update',
  message = '',
  orderId,
  packageLabel,
  status,
  linkUrl,
  linkLabel,
}: Props) => {
  const preview = message ? message.slice(0, 120) : title
  const greet = recipientName ? `Hi ${recipientName},` : 'Hi there,'
  const roleContext =
    recipientRole === 'developer'
      ? 'This is an update on a project assigned to you.'
      : recipientRole === 'admin'
        ? 'This is an internal update from the eazybuildwebsite platform.'
        : 'Here is an update on your project with eazybuildwebsite.'
  const cta = linkUrl ? { url: linkUrl, label: linkLabel || 'Open dashboard →' } : null

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>eazybuildwebsite.com</Text>
          <Heading style={h1}>{title}</Heading>
          <Text style={text}>{greet} {roleContext}</Text>
          {message ? <Text style={text}>{message}</Text> : null}

          {(packageLabel || orderId || status) ? (
            <Section style={summary}>
              {packageLabel ? (
                <Text style={row}>
                  <span style={label}>Package</span>
                  <span style={value}>{packageLabel}</span>
                </Text>
              ) : null}
              {orderId ? (
                <Text style={row}>
                  <span style={label}>Order</span>
                  <span style={value}>{orderId}</span>
                </Text>
              ) : null}
              {status ? (
                <Text style={row}>
                  <span style={label}>Status</span>
                  <span style={value}>{status}</span>
                </Text>
              ) : null}
            </Section>
          ) : null}

          {cta ? (
            <Text style={text}>
              <a href={cta.url} style={linkStyle}>{cta.label}</a>
            </Text>
          ) : null}

          <Hr style={divider} />
          <Text style={footer}>
            Questions? Just reply or write to info@icon-computers.in.
            <br />A product of Icon Computers, Nagpur.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const summary = {
  backgroundColor: '#141416',
  border: '1px solid #26262a',
  borderRadius: '12px',
  padding: '18px 20px',
  margin: '0 0 28px',
}
const row = { margin: '4px 0', fontSize: '14px', color: '#c7c7cc', display: 'flex', justifyContent: 'space-between' }
const label = { color: '#8a8a8f', fontWeight: 500 as const, marginRight: '16px' }
const value = { color: '#ffffff', fontWeight: 600 as const }
const linkStyle = { color: '#ffffff', textDecoration: 'underline', fontWeight: 600 as const }

export const template = {
  component: ProjectEventEmail,
  subject: (data: Record<string, any>) => data.title || 'Project update',
  displayName: 'Project event',
  previewData: {
    recipientName: 'Alex',
    recipientRole: 'client',
    title: 'Your project moved to review',
    message: 'Your developer has moved the project to review. Please take a look.',
    orderId: 'ord_1a2b3c4d',
    packageLabel: '5-page website',
    status: 'review',
    linkUrl: 'https://eazybuildwebsite.com/dashboard',
    linkLabel: 'Open dashboard →',
  },
} satisfies TemplateEntry
