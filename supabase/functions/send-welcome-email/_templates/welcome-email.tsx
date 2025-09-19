import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface WelcomeEmailProps {
  userEmail: string
  confirmationUrl: string
}

export const WelcomeEmail = ({
  userEmail,
  confirmationUrl,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to MyEcclesia - Please confirm your email</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Logo removed to prevent broken image in email clients */}
        
        <Heading style={h1}>Welcome to MyEcclesia!</Heading>
        
        <Text style={text}>
          Thank you for joining our faith community platform. We're excited to have you as part of our digital congregation.
        </Text>
        
        <Text style={text}>
          To get started, please confirm your email address by clicking the button below:
        </Text>
        
        <Section style={buttonSection}>
          <Link href={confirmationUrl} style={button}>
            Confirm Email Address
          </Link>
        </Section>
        
        <Text style={text}>
          Once confirmed, you'll be able to:
        </Text>
        
        <Text style={bulletPoint}>✓ Register for upcoming events and services</Text>
        <Text style={bulletPoint}>✓ Access exclusive community content</Text>
        <Text style={bulletPoint}>✓ Connect with fellow believers</Text>
        <Text style={bulletPoint}>✓ Receive important church updates</Text>
        
        <Text style={smallText}>
          If the button doesn't work, you can copy and paste this link into your browser:
        </Text>
        <Text style={linkText}>{confirmationUrl}</Text>
        
        <Text style={footer}>
          Blessings,<br />
          The MyEcclesia Team
        </Text>
        
        <Text style={disclaimer}>
          If you didn't create an account with MyEcclesia, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

const main = {
  backgroundColor: '#f9fafb',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  margin: '40px auto',
  padding: '40px',
  maxWidth: '600px',
}

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const logo = {
  borderRadius: '50%',
  border: '3px solid #16a34a',
}

const h1 = {
  color: '#16a34a',
  fontSize: '28px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0 0 32px',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const bulletPoint = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
  paddingLeft: '20px',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#16a34a',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  border: 'none',
}

const smallText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 8px',
}

const linkText = {
  color: '#16a34a',
  fontSize: '14px',
  lineHeight: '20px',
  wordBreak: 'break-all' as const,
  margin: '0 0 24px',
}

const footer = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '32px 0 16px',
  fontWeight: '600',
}

const disclaimer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '24px 0 0',
  textAlign: 'center' as const,
}