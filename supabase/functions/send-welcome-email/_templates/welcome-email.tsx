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
        {/* Header with Logo/Brand */}
        <Section style={headerSection}>
          <Text style={logoText}>MyEcclesia</Text>
          <Text style={tagline}>Connecting Faith Communities</Text>
        </Section>
        
        <Section style={welcomeBanner}>
          <Text style={welcomeEmoji}>🎉</Text>
          <Heading style={h1}>Welcome to MyEcclesia!</Heading>
        </Section>
        
        <Text style={text}>
          Hello and welcome!
        </Text>
        
        <Text style={text}>
          Thank you for joining our faith community platform. We're blessed to have you as part of our digital congregation and excited to help you connect with Christian events and opportunities near you.
        </Text>
        
        <Text style={text}>
          To get started, please confirm your email address by clicking the button below:
        </Text>
        
        <Section style={buttonSection}>
          <Link href={confirmationUrl} style={button}>
            ✓ Confirm My Email
          </Link>
        </Section>
        
        <Hr style={divider} />
        
        <Section style={featuresSection}>
          <Text style={featuresTitle}>Once confirmed, you'll be able to:</Text>
          
          <Section style={featureItem}>
            <Text style={featureIcon}>📅</Text>
            <Text style={featureText}>Discover and register for upcoming Christian events and services</Text>
          </Section>
          
          <Section style={featureItem}>
            <Text style={featureIcon}>🎟️</Text>
            <Text style={featureText}>Book tickets and manage your event registrations</Text>
          </Section>
          
          <Section style={featureItem}>
            <Text style={featureIcon}>⛪</Text>
            <Text style={featureText}>Connect with churches and ministries in your area</Text>
          </Section>
          
          <Section style={featureItem}>
            <Text style={featureIcon}>💼</Text>
            <Text style={featureText}>Find volunteer and job opportunities within the faith community</Text>
          </Section>
          
          <Section style={featureItem}>
            <Text style={featureIcon}>🔔</Text>
            <Text style={featureText}>Receive personalized notifications about events you'll love</Text>
          </Section>
        </Section>
        
        <Hr style={divider} />
        
        <Text style={smallText}>
          If the button doesn't work, copy and paste this link into your browser:
        </Text>
        <Text style={linkText}>{confirmationUrl}</Text>
        
        <Section style={footerSection}>
          <Text style={footer}>
            Blessings,<br />
            <strong>The MyEcclesia Team</strong>
          </Text>
          
          <Text style={footerLinks}>
            <Link href="https://myecclesia.org.uk" style={footerLink}>Visit Website</Link>
            {' • '}
            <Link href="https://myecclesia.org.uk/events" style={footerLink}>Browse Events</Link>
            {' • '}
            <Link href="https://myecclesia.org.uk/help-centre" style={footerLink}>Help Centre</Link>
          </Text>
          
          <Text style={disclaimer}>
            If you didn't create an account with MyEcclesia, you can safely ignore this email.
          </Text>
          
          <Text style={copyright}>
            © {new Date().getFullYear()} MyEcclesia. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

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

const welcomeBanner = {
  textAlign: 'center' as const,
  padding: '32px 40px 0',
}

const welcomeEmoji = {
  fontSize: '48px',
  margin: '0 0 16px',
}

const h1 = {
  color: '#16a34a',
  fontSize: '28px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0',
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

const divider = {
  borderColor: '#e2e8f0',
  margin: '24px 40px',
}

const featuresSection = {
  margin: '0 40px',
}

const featuresTitle = {
  color: '#1e293b',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 20px',
}

const featureItem = {
  display: 'flex',
  alignItems: 'flex-start' as const,
  marginBottom: '16px',
}

const featureIcon = {
  fontSize: '20px',
  margin: '0 12px 0 0',
  lineHeight: '26px',
}

const featureText = {
  color: '#475569',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0',
  flex: '1',
}

const smallText = {
  color: '#64748b',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 40px 8px',
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
