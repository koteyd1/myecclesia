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
  Hr,
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
        {/* Header with Logo/Brand */}
        <Section style={headerSection}>
          <Text style={logoText}>MyEcclesia</Text>
          <Text style={tagline}>Connecting Faith Communities</Text>
        </Section>
        
        <Hr style={divider} />
        
        <Heading style={h1}>Reset Your Password</Heading>
        
        <Text style={text}>
          Hello,
        </Text>
        
        <Text style={text}>
          We received a request to reset the password for your MyEcclesia account associated with <strong>{userEmail}</strong>.
        </Text>
        
        <Text style={text}>
          Click the button below to set a new password:
        </Text>
        
        <Section style={buttonSection}>
          <Link href={resetUrl} style={button}>
            Reset My Password
          </Link>
        </Section>
        
        <Section style={warningBox}>
          <Text style={warningText}>
            ⏰ This link will expire in <strong>1 hour</strong> for your security.
          </Text>
        </Section>
        
        <Text style={smallText}>
          If the button doesn't work, copy and paste this link into your browser:
        </Text>
        <Text style={linkText}>{resetUrl}</Text>
        
        <Hr style={divider} />
        
        <Text style={text}>
          If you didn't request this password reset, please ignore this email. Your password will remain unchanged and your account is secure.
        </Text>
        
        <Section style={footerSection}>
          <Text style={footer}>
            Blessings,<br />
            <strong>The MyEcclesia Team</strong>
          </Text>
          
          <Text style={footerLinks}>
            <Link href="https://myecclesia.org.uk" style={footerLink}>Visit Website</Link>
            {' • '}
            <Link href="https://myecclesia.org.uk/help-centre" style={footerLink}>Help Centre</Link>
            {' • '}
            <Link href="https://myecclesia.org.uk/contact" style={footerLink}>Contact Us</Link>
          </Text>
          
          <Text style={disclaimer}>
            This is an automated message from MyEcclesia. Please do not reply to this email.
          </Text>
          
          <Text style={copyright}>
            © {new Date().getFullYear()} MyEcclesia. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail

const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  margin: '40px auto',
  padding: '0',
  maxWidth: '600px',
  overflow: 'hidden' as const,
}

const headerSection = {
  backgroundColor: '#16a34a',
  padding: '32px 40px',
  textAlign: 'center' as const,
}

const logoText = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '-0.5px',
}

const tagline = {
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '14px',
  margin: '8px 0 0',
  letterSpacing: '0.5px',
}

const divider = {
  borderColor: '#e2e8f0',
  margin: '0',
}

const h1 = {
  color: '#1e293b',
  fontSize: '26px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '32px 40px 24px',
  padding: '0',
}

const text = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 40px',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 40px',
}

const button = {
  backgroundColor: '#16a34a',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  border: 'none',
  boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)',
}

const warningBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '16px 20px',
  borderLeft: '4px solid #f59e0b',
}

const warningText = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
}

const smallText = {
  color: '#64748b',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '24px 40px 8px',
}

const linkText = {
  color: '#16a34a',
  fontSize: '13px',
  lineHeight: '20px',
  wordBreak: 'break-all' as const,
  margin: '0 40px 24px',
}

const footerSection = {
  backgroundColor: '#f8fafc',
  padding: '32px 40px',
  marginTop: '24px',
}

const footer = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const footerLinks = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 16px',
  textAlign: 'center' as const,
}

const footerLink = {
  color: '#16a34a',
  textDecoration: 'none',
}

const disclaimer = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0 0 8px',
  textAlign: 'center' as const,
}

const copyright = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0',
  textAlign: 'center' as const,
}
