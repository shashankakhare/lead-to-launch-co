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
import {
  brand,
  container,
  divider,
  footer,
  h1,
  main,
  text,
} from './_styles'

interface Props {
  name?: string
  orderId?: string
  packageLabel?: string
  amount?: string
  status?: 'paid' | 'failed'
  nextStepUrl?: string
}

const PaymentStatusEmail = ({
  name,
  orderId,
  packageLabel,
  amount,
  status = 'paid',
  nextStepUrl,
}: Props) => {
  const isPaid = status === 'paid'
  const heading = isPaid ? 'Payment received' : 'Payment could not be processed'
  const previewText = isPaid
    ? 'Your payment was successful — your project is now in queue.'
    : 'We could not process your payment. Please try again.'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>buildingwebsitenow.com</Text>
          <Heading style={h1}>{heading}</Heading>

          {isPaid ? (
            <Text style={text}>
              {name ? `Hi ${name},` : 'Hi there,'} thanks for your order. We have received
              your payment and your WordPress project is officially in our queue.
            </Text>
          ) : (
            <Text style={text}>
              {name ? `Hi ${name},` : 'Hi there,'} unfortunately your recent payment attempt
              did not go through. No charges have been captured. You can retry the checkout
              at any time from your dashboard.
            </Text>
          )}

          <Section style={summary}>
            {packageLabel ? (
              <Text style={summaryRow}>
                <span style={summaryLabel}>Package</span>
                <span style={summaryValue}>{packageLabel}</span>
              </Text>
            ) : null}
            {amount ? (
              <Text style={summaryRow}>
                <span style={summaryLabel}>Amount</span>
                <span style={summaryValue}>{amount}</span>
              </Text>
            ) : null}
            {orderId ? (
              <Text style={summaryRow}>
                <span style={summaryLabel}>Order</span>
                <span style={summaryValue}>{orderId}</span>
              </Text>
            ) : null}
            <Text style={summaryRow}>
              <span style={summaryLabel}>Status</span>
              <span style={{ ...summaryValue, color: isPaid ? '#34d399' : '#f87171' }}>
                {isPaid ? 'Paid' : 'Failed'}
              </span>
            </Text>
          </Section>

          {isPaid ? (
            <Text style={text}>
              Next step: complete your project intake so your assigned developer can begin
              building. You can start it here:{' '}
              <a href={nextStepUrl || 'https://eazybuildwebsite.com/dashboard'} style={linkStyle}>
                Open your dashboard →
              </a>
            </Text>
          ) : (
            <Text style={text}>
              Retry your checkout here:{' '}
              <a href={nextStepUrl || 'https://eazybuildwebsite.com/dashboard'} style={linkStyle}>
                Open your dashboard →
              </a>
            </Text>
          )}

          <Hr style={divider} />
          <Text style={footer}>
            Questions? Just reply to this email or write to info@digitaldreamsinc.in.
            <br />
            A product of Icon Computers, Nagpur.
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

const summaryRow = {
  margin: '4px 0',
  fontSize: '14px',
  color: '#c7c7cc',
  display: 'flex',
  justifyContent: 'space-between',
}

const summaryLabel = {
  color: '#8a8a8f',
  fontWeight: 500 as const,
  marginRight: '16px',
}

const summaryValue = {
  color: '#ffffff',
  fontWeight: 600 as const,
}

const linkStyle = {
  color: '#ffffff',
  textDecoration: 'underline',
  fontWeight: 600 as const,
}

export const template = {
  component: PaymentStatusEmail,
  subject: (data: Record<string, any>) =>
    data.status === 'failed'
      ? 'Your payment could not be processed'
      : 'Payment received — your project is in the queue',
  displayName: 'Payment status',
  previewData: {
    name: 'Alex',
    orderId: 'ord_1a2b3c4d',
    packageLabel: '5-page website',
    amount: '₹64,999',
    status: 'paid',
    nextStepUrl: 'https://eazybuildwebsite.com/dashboard',
  },
} satisfies TemplateEntry
