import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface PasswordResetEmailProps {
  userEmail: string
  resetUrl: string
}

export const PasswordResetEmail = ({
  userEmail,
  resetUrl,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your MyEcclesia password</Preview>
    <Body style={main}>
      <Container style={container}>
        
        <Heading style={h1}>Reset Your Password</Heading>
        
        <Text style={text}>
          Hi there,
        </Text>
        
        <Text style={text}>
          We received a request to reset the password for your MyEcclesia account ({userEmail}).
        </Text>
        
        <Text style={text}>
          Click the button below to reset your password:
        </Text>
        
        <Section style={buttonSection}>
          <Link href={resetUrl} style={button}>
            Reset Password
          </Link>
        </Section>
        
        <Text style={text}>
          This link will expire in 1 hour for security reasons.
        </Text>
        
        <Text style={smallText}>
          If the button doesn't work, you can copy and paste this link into your browser:
        </Text>
        <Text style={linkText}>{resetUrl}</Text>
        
        <Text style={text}>
          If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
        </Text>
        
        <Text style={footer}>
          Best regards,<br />
          The MyEcclesia Team
        </Text>
        
        <Text style={disclaimer}>
          This is an automated message. Please do not reply to this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail

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

const h1 = {
  color: '#dc2626',
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

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#dc2626',
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
  color: '#dc2626',
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