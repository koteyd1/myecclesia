import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <>
      <SEOHead
        title="Privacy Policy | MyEcclesia"
        description="Learn how MyEcclesia protects your personal data. Read our GDPR-compliant privacy policy covering data collection, usage, security measures, and your rights."
        keywords="privacy policy, data protection, GDPR, personal data, MyEcclesia privacy, UK data protection"
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-center mb-8">Privacy Policy</h1>
            
            <Card>
              <CardContent className="p-8 space-y-6">
                <div className="text-sm text-muted-foreground mb-8">
                  <p><strong>Last updated:</strong> January 2025</p>
                  <p className="mt-2">
                    MyEcclesia ("we", "us", or "our") is committed to protecting your privacy and ensuring 
                    compliance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
                  </p>
                </div>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">1. Who We Are</h2>
                  <p className="text-muted-foreground mb-4">
                    MyEcclesia is a platform for discovering and managing Christian events across the United Kingdom. 
                    We are the data controller responsible for your personal data.
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Contact for data requests:</strong>{" "}
                    <a href="mailto:privacy@myecclesia.org.uk" className="text-primary hover:underline">
                      privacy@myecclesia.org.uk
                    </a>
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                  <p className="text-muted-foreground mb-4">
                    We collect and process the following types of personal data:
                  </p>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <h4 className="font-medium text-foreground">Account Information</h4>
                      <p className="text-sm text-muted-foreground">Name, email address, password (encrypted), profile photo</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <h4 className="font-medium text-foreground">Contact Details</h4>
                      <p className="text-sm text-muted-foreground">Phone number (optional), communication preferences</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <h4 className="font-medium text-foreground">Event Activity</h4>
                      <p className="text-sm text-muted-foreground">Event registrations, saved events, ticket purchases</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <h4 className="font-medium text-foreground">Technical Data</h4>
                      <p className="text-sm text-muted-foreground">IP address, browser type, device information, pages visited</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">3. Why We Collect Your Data (Legal Basis)</h2>
                  <p className="text-muted-foreground mb-4">
                    We process your personal data based on the following legal grounds:
                  </p>
                  <ul className="list-disc ml-6 text-muted-foreground space-y-2">
                    <li><strong>Contract:</strong> To provide our services when you register for events or create an account</li>
                    <li><strong>Consent:</strong> For marketing communications and optional cookies</li>
                    <li><strong>Legitimate interests:</strong> To improve our platform, prevent fraud, and ensure security</li>
                    <li><strong>Legal obligation:</strong> To comply with applicable laws and regulations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">4. How We Use Your Information</h2>
                  <ul className="list-disc ml-6 text-muted-foreground space-y-2">
                    <li>Provide, maintain, and improve our services</li>
                    <li>Process event registrations and send confirmations</li>
                    <li>Send relevant updates about events you've registered for</li>
                    <li>Respond to your enquiries and support requests</li>
                    <li>Prevent fraudulent activity and ensure platform security</li>
                    <li>Analyse usage patterns to improve user experience</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">5. Data Sharing</h2>
                  <p className="text-muted-foreground mb-4">
                    We do not sell your personal data. We may share your data with:
                  </p>
                  <ul className="list-disc ml-6 text-muted-foreground space-y-2">
                    <li><strong>Event organisers:</strong> When you register for their events (name, email for registration purposes)</li>
                    <li><strong>Service providers:</strong> Stripe (payments), Resend (emails), Supabase (hosting)</li>
                    <li><strong>Legal authorities:</strong> When required by law or to protect our rights</li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    All our service providers are bound by data processing agreements and GDPR compliance requirements.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
                  <p className="text-muted-foreground mb-4">
                    We retain your personal data for as long as necessary to fulfil the purposes outlined in this policy:
                  </p>
                  <ul className="list-disc ml-6 text-muted-foreground space-y-2">
                    <li><strong>Account data:</strong> Until you delete your account</li>
                    <li><strong>Event registrations:</strong> 2 years after the event date</li>
                    <li><strong>Transaction records:</strong> 7 years (legal requirement)</li>
                    <li><strong>Analytics data:</strong> 26 months</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">7. Your Rights Under GDPR</h2>
                  <p className="text-muted-foreground mb-4">
                    You have the following rights regarding your personal data:
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium text-foreground">Right to Access</h4>
                      <p className="text-sm text-muted-foreground">Request a copy of your personal data</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium text-foreground">Right to Rectification</h4>
                      <p className="text-sm text-muted-foreground">Correct inaccurate or incomplete data</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium text-foreground">Right to Erasure</h4>
                      <p className="text-sm text-muted-foreground">Request deletion of your data</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium text-foreground">Right to Portability</h4>
                      <p className="text-sm text-muted-foreground">Receive your data in a portable format</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium text-foreground">Right to Restrict</h4>
                      <p className="text-sm text-muted-foreground">Limit how we process your data</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium text-foreground">Right to Object</h4>
                      <p className="text-sm text-muted-foreground">Object to processing based on legitimate interests</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-4">
                    To exercise these rights, visit your{" "}
                    <Link to="/profile/edit" className="text-primary hover:underline">
                      account settings
                    </Link>{" "}
                    or email us at{" "}
                    <a href="mailto:privacy@myecclesia.org.uk" className="text-primary hover:underline">
                      privacy@myecclesia.org.uk
                    </a>
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">8. Data Security</h2>
                  <p className="text-muted-foreground mb-4">
                    We implement appropriate technical and organisational measures to protect your data:
                  </p>
                  <ul className="list-disc ml-6 text-muted-foreground space-y-2">
                    <li>All passwords are hashed using bcrypt (never stored in plain text)</li>
                    <li>All data transmitted using TLS/HTTPS encryption</li>
                    <li>Regular security audits and monitoring</li>
                    <li>Role-based access control for staff</li>
                    <li>Automatic session timeouts</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">9. Cookies</h2>
                  <p className="text-muted-foreground">
                    We use cookies to enhance your experience. For detailed information about the cookies we use 
                    and how to manage them, please see our{" "}
                    <Link to="/cookie-policy" className="text-primary hover:underline">
                      Cookie Policy
                    </Link>.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
                  <p className="text-muted-foreground">
                    Our services are not intended for children under 13. We do not knowingly collect personal 
                    information from children under 13. If you believe we have collected such information, 
                    please contact us immediately.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">11. International Transfers</h2>
                  <p className="text-muted-foreground">
                    Some of our service providers may process data outside the UK. Where this occurs, we ensure 
                    appropriate safeguards are in place, such as Standard Contractual Clauses or adequacy decisions.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">12. Changes to This Policy</h2>
                  <p className="text-muted-foreground">
                    We may update this privacy policy from time to time. We will notify you of significant changes 
                    by email or through a notice on our website. The "Last updated" date will be revised accordingly.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">13. Complaints</h2>
                  <p className="text-muted-foreground mb-4">
                    If you have concerns about how we handle your data, please contact us first. You also have 
                    the right to lodge a complaint with the UK Information Commissioner's Office (ICO):
                  </p>
                  <p className="text-muted-foreground">
                    Information Commissioner's Office<br />
                    Wycliffe House, Water Lane<br />
                    Wilmslow, Cheshire SK9 5AF<br />
                    <a href="https://ico.org.uk" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      ico.org.uk
                    </a>
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
                  <p className="text-muted-foreground">
                    For any questions about this privacy policy or your personal data, contact us at:
                  </p>
                  <p className="text-muted-foreground mt-2">
                    Email:{" "}
                    <a href="mailto:privacy@myecclesia.org.uk" className="text-primary hover:underline">
                      privacy@myecclesia.org.uk
                    </a>
                    <br />
                    Or visit our{" "}
                    <Link to="/contact" className="text-primary hover:underline">
                      Contact Page
                    </Link>
                  </p>
                </section>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;