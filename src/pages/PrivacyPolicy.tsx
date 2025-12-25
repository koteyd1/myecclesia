import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";

const PrivacyPolicy = () => {
  return (
    <>
      <SEOHead
        title="Privacy Policy | MyEcclesia"
        description="Learn how MyEcclesia protects your personal data. Read our privacy policy covering data collection, usage, security measures, and your rights."
        keywords="privacy policy, data protection, GDPR, personal data, MyEcclesia privacy"
      />
      <div className="min-h-screen bg-background">
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">Privacy Policy</h1>
          
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="text-sm text-muted-foreground mb-8">
                <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
              </div>

              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
                <p className="text-muted-foreground mb-4">
                  MyEcclesia collects information you provide directly to us, such as when you create an account, 
                  register for events, or contact us. This may include:
                </p>
                <ul className="list-disc ml-6 text-muted-foreground space-y-2">
                  <li>Name and contact information (email address, phone number)</li>
                  <li>Account credentials</li>
                  <li>Event registration details</li>
                  <li>Communication preferences</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc ml-6 text-muted-foreground space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process event registrations and communicate about events</li>
                  <li>Send you updates about our church community</li>
                  <li>Respond to your comments and questions</li>
                  <li>Ensure the security of our platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
                <p className="text-muted-foreground mb-4">
                  We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
                  except in the following circumstances:
                </p>
                <ul className="list-disc ml-6 text-muted-foreground space-y-2">
                  <li>With your explicit consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and safety</li>
                  <li>With service providers who assist us in operating our platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
                <p className="text-muted-foreground">
                  We implement appropriate security measures to protect your personal information against unauthorized access, 
                  alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic 
                  storage is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
                <p className="text-muted-foreground">
                  We retain your personal information only for as long as necessary to fulfill the purposes outlined in this 
                  privacy policy, unless a longer retention period is required by law.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
                <p className="text-muted-foreground mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc ml-6 text-muted-foreground space-y-2">
                  <li>Access your personal information</li>
                  <li>Update or correct your information</li>
                  <li>Delete your account and associated data</li>
                  <li>Opt out of certain communications</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our services are not intended for children under 13. We do not knowingly collect personal information 
                  from children under 13. If you believe we have collected information from a child under 13, please contact us.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this privacy policy from time to time. We will notify you of any material changes by 
                  posting the new policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions about this privacy policy, please contact us through our contact page or 
                  email us directly.
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