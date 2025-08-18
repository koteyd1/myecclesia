import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">Terms and Conditions</h1>
          
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="text-sm text-muted-foreground mb-8">
                <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
              </div>

              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using MyEcclesia's platform, you accept and agree to be bound by the terms and 
                  provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
                <p className="text-muted-foreground mb-4">
                  Permission is granted to temporarily access MyEcclesia for personal, non-commercial transitory viewing only. 
                  This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc ml-6 text-muted-foreground space-y-2">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose or for any public display</li>
                  <li>Attempt to reverse engineer any software contained on the platform</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
                <p className="text-muted-foreground mb-4">
                  To access certain features of our platform, you may be required to register for an account. You agree to:
                </p>
                <ul className="list-disc ml-6 text-muted-foreground space-y-2">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain the security of your password</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized access</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Event Registration and Participation</h2>
                <p className="text-muted-foreground mb-4">
                  When registering for events through our platform:
                </p>
                <ul className="list-disc ml-6 text-muted-foreground space-y-2">
                  <li>Registration confirmations will be sent via email</li>
                  <li>Event details may be subject to change</li>
                  <li>Cancellation policies may vary by event</li>
                  <li>You are responsible for checking event updates</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. User Conduct</h2>
                <p className="text-muted-foreground mb-4">
                  You agree not to use our platform to:
                </p>
                <ul className="list-disc ml-6 text-muted-foreground space-y-2">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Transmit any harmful, offensive, or inappropriate content</li>
                  <li>Interfere with the platform's functionality</li>
                  <li>Impersonate others or provide false information</li>
                  <li>Engage in any activity that disrupts community events</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Content and Intellectual Property</h2>
                <p className="text-muted-foreground">
                  All content on MyEcclesia, including text, graphics, logos, and software, is the property of MyEcclesia 
                  or its licensors and is protected by copyright and other intellectual property laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Donations and Payments</h2>
                <p className="text-muted-foreground mb-4">
                  If you make donations or payments through our platform:
                </p>
                <ul className="list-disc ml-6 text-muted-foreground space-y-2">
                  <li>All donations are voluntary and non-refundable</li>
                  <li>Payment information must be accurate and current</li>
                  <li>You authorize us to charge your payment method</li>
                  <li>Tax receipts may be provided where applicable</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Disclaimer</h2>
                <p className="text-muted-foreground">
                  The materials on MyEcclesia are provided on an 'as is' basis. MyEcclesia makes no warranties, 
                  expressed or implied, and hereby disclaims and negates all other warranties including without limitation, 
                  implied warranties or conditions of merchantability, fitness for a particular purpose, or 
                  non-infringement of intellectual property or other violation of rights.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Limitations</h2>
                <p className="text-muted-foreground">
                  In no event shall MyEcclesia or its suppliers be liable for any damages (including, without limitation, 
                  damages for loss of data or profit, or due to business interruption) arising out of the use or inability 
                  to use the materials on MyEcclesia, even if MyEcclesia or its authorized representative has been notified 
                  orally or in writing of the possibility of such damage.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
                <p className="text-muted-foreground">
                  We may terminate or suspend your account and access to our platform immediately, without prior notice, 
                  for conduct that we believe violates these terms or is harmful to other users, us, or third parties.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
                <p className="text-muted-foreground">
                  These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction 
                  in which MyEcclesia operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that state.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. 
                  Your continued use of the platform after changes constitutes acceptance of the modified terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
                <p className="text-muted-foreground">
                  If you have any questions about these terms and conditions, please contact us through our contact page.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;