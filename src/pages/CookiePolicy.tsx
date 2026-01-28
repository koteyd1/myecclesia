import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";

const CookiePolicy = () => {
  return (
    <>
      <SEOHead
        title="Cookie Policy | MyEcclesia"
        description="Learn about the cookies we use on MyEcclesia, why we use them, and how you can manage your cookie preferences."
        keywords="cookie policy, cookies, privacy, data protection, MyEcclesia"
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-center mb-8">Cookie Policy</h1>
            
            <Card>
              <CardContent className="p-8 space-y-6">
                <div className="text-sm text-muted-foreground mb-8">
                  <p><strong>Last updated:</strong> January 2025</p>
                </div>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies?</h2>
                  <p className="text-muted-foreground mb-4">
                    Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
                    They are widely used to make websites work more efficiently and provide a better user experience. 
                    Cookies can remember your preferences, login information, and how you use the site.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
                  <p className="text-muted-foreground mb-4">
                    MyEcclesia uses cookies to:
                  </p>
                  <ul className="list-disc ml-6 text-muted-foreground space-y-2">
                    <li>Keep you signed in to your account</li>
                    <li>Remember your preferences and settings</li>
                    <li>Understand how you use our website to improve it</li>
                    <li>Ensure the security of our platform</li>
                    <li>Store your cookie consent preferences</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h3 className="font-semibold text-foreground mb-2">Essential Cookies (Required)</h3>
                      <p className="text-muted-foreground text-sm">
                        These cookies are necessary for the website to function properly. They enable core functionality 
                        such as security, network management, and account access. You cannot disable these cookies.
                      </p>
                      <table className="mt-3 w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium">Cookie Name</th>
                            <th className="text-left py-2 font-medium">Purpose</th>
                            <th className="text-left py-2 font-medium">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                          <tr className="border-b">
                            <td className="py-2">sb-*-auth-token</td>
                            <td className="py-2">Authentication session</td>
                            <td className="py-2">Session / 1 week</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">myecclesia_cookie_consent</td>
                            <td className="py-2">Store your cookie preferences</td>
                            <td className="py-2">1 year</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold text-foreground mb-2">Analytics Cookies (Optional)</h3>
                      <p className="text-muted-foreground text-sm">
                        These cookies help us understand how visitors interact with our website by collecting and 
                        reporting information anonymously. This helps us improve our site for all users.
                      </p>
                      <table className="mt-3 w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium">Cookie Name</th>
                            <th className="text-left py-2 font-medium">Purpose</th>
                            <th className="text-left py-2 font-medium">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                          <tr className="border-b">
                            <td className="py-2">_ga</td>
                            <td className="py-2">Google Analytics - distinguish users</td>
                            <td className="py-2">2 years</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">_gid</td>
                            <td className="py-2">Google Analytics - distinguish users</td>
                            <td className="py-2">24 hours</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold text-foreground mb-2">Marketing Cookies (Optional)</h3>
                      <p className="text-muted-foreground text-sm">
                        These cookies may be set through our site by advertising partners. They may be used to build 
                        a profile of your interests and show you relevant adverts on other sites.
                      </p>
                      <p className="text-muted-foreground text-sm mt-2">
                        <em>Note: MyEcclesia currently does not use marketing cookies.</em>
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">4. Managing Your Cookie Preferences</h2>
                  <p className="text-muted-foreground mb-4">
                    You can manage your cookie preferences at any time:
                  </p>
                  <ul className="list-disc ml-6 text-muted-foreground space-y-2">
                    <li>
                      <strong>On our website:</strong> When you first visit, you'll see a cookie consent banner 
                      where you can accept or reject non-essential cookies.
                    </li>
                    <li>
                      <strong>Browser settings:</strong> Most web browsers allow you to control cookies through 
                      their settings. You can set your browser to refuse cookies or delete specific cookies.
                    </li>
                    <li>
                      <strong>Google Analytics opt-out:</strong> You can opt out of Google Analytics by installing 
                      the Google Analytics Opt-out Browser Add-on.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">5. Third-Party Cookies</h2>
                  <p className="text-muted-foreground mb-4">
                    Some pages on our website may contain content from third parties (such as videos or social media widgets) 
                    that may set their own cookies. We do not control these cookies. Please check the third party's 
                    website for more information about their cookies.
                  </p>
                  <p className="text-muted-foreground">
                    Third-party services we may use include:
                  </p>
                  <ul className="list-disc ml-6 text-muted-foreground space-y-2 mt-2">
                    <li>Stripe (for payment processing)</li>
                    <li>Google Maps (for location services)</li>
                    <li>YouTube (for embedded videos)</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">6. Impact of Disabling Cookies</h2>
                  <p className="text-muted-foreground">
                    If you choose to disable cookies, some features of our website may not function properly. 
                    For example, you may not be able to stay logged in, and some interactive features may not work.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">7. Updates to This Policy</h2>
                  <p className="text-muted-foreground">
                    We may update this Cookie Policy from time to time to reflect changes in our practices or 
                    for other operational, legal, or regulatory reasons. We encourage you to periodically review 
                    this page for the latest information.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
                  <p className="text-muted-foreground">
                    If you have any questions about our use of cookies or this Cookie Policy, please contact us at{" "}
                    <a href="mailto:privacy@myecclesia.org.uk" className="text-primary hover:underline">
                      privacy@myecclesia.org.uk
                    </a>{" "}
                    or through our contact page.
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

export default CookiePolicy;
