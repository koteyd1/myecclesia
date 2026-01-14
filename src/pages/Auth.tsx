import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Shield } from "lucide-react";
import { useRateLimit } from "@/hooks/useRateLimit";
import { validateEmail, validatePassword, validateName, sanitizeInput, INPUT_LIMITS } from "@/utils/validation";
import { performSecureSignIn, cleanupAuthState } from "@/utils/authCleanup";
import { SEOHead } from "@/components/SEOHead";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Rate limiting for authentication attempts
  const authRateLimit = useRateLimit({ maxAttempts: 5, windowMs: 15 * 60 * 1000 }); // 5 attempts per 15 minutes

  useEffect(() => {
    // Check URL parameters for password reset
    const urlParams = new URLSearchParams(window.location.search);
    const isReset = urlParams.get('reset') === 'true';
    
    // Also check for recovery token in URL hash (Supabase puts tokens there)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const tokenType = hashParams.get('type');
    
    if (isReset || tokenType === 'recovery') {
      setIsPasswordReset(true);
    }

    // Listen for auth state changes - especially PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked the password reset link and has a valid recovery session
        setIsPasswordReset(true);
      } else if (event === 'SIGNED_IN' && !isPasswordReset) {
        // Normal sign in - redirect to home
        navigate("/");
      }
    });

    // Check if user is already logged in (but not in password reset flow)
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If there's a recovery token, we're in password reset mode
      if (accessToken && tokenType === 'recovery') {
        setIsPasswordReset(true);
        return;
      }
      
      if (session && !isReset && tokenType !== 'recovery') {
        navigate("/");
      }
    };
    checkUser();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    if (!authRateLimit.checkRateLimit()) {
      const remainingTime = authRateLimit.getRemainingTime();
      toast({
        variant: "destructive",
        title: "Too many attempts",
        description: `Please wait ${remainingTime} seconds before trying again.`,
      });
      return;
    }
    
    // Validate inputs
    const sanitizedEmail = sanitizeInput(email, INPUT_LIMITS.EMAIL_MAX);
    const sanitizedPassword = sanitizeInput(password, INPUT_LIMITS.PASSWORD_MAX);
    
    if (!validateEmail(sanitizedEmail)) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address.",
      });
      return;
    }
    
    setIsLoading(true);
    authRateLimit.recordAttempt();

    try {
      const { data, error } = await performSecureSignIn(supabase, sanitizedEmail, sanitizedPassword);

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      
      // performSecureSignIn handles the redirect
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    if (!authRateLimit.checkRateLimit()) {
      const remainingTime = authRateLimit.getRemainingTime();
      toast({
        variant: "destructive",
        title: "Too many attempts",
        description: `Please wait ${remainingTime} seconds before trying again.`,
      });
      return;
    }
    
    // Validate inputs
    const sanitizedEmail = sanitizeInput(email, INPUT_LIMITS.EMAIL_MAX);
    const sanitizedPassword = sanitizeInput(password, INPUT_LIMITS.PASSWORD_MAX);
    const sanitizedFullName = sanitizeInput(fullName, INPUT_LIMITS.NAME_MAX);
    
    const errors: string[] = [];
    
    if (!validateEmail(sanitizedEmail)) {
      errors.push("Please enter a valid email address");
    }
    
    const passwordValidation = validatePassword(sanitizedPassword);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
    
    if (!sanitizedFullName || sanitizedFullName.length < 2) {
      errors.push("Please enter your full name (at least 2 characters)");
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: errors[0],
      });
      return;
    }
    
    setValidationErrors([]);
    setIsLoading(true);
    authRateLimit.recordAttempt();

    try {
      // Clean up any existing auth state before signing up
      cleanupAuthState();
      
      const { error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: sanitizedPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: sanitizedFullName,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link to complete your registration.",
      });
      
      // Clear form
      setEmail("");
      setPassword("");
      setFullName("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing up",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    const sanitizedEmail = sanitizeInput(email, INPUT_LIMITS.EMAIL_MAX);
    
    if (!validateEmail(sanitizedEmail)) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address.",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // Use our custom password reset edge function
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email: sanitizedEmail },
      });

      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to send password reset email');
      }

      toast({
        title: "Password reset email sent",
        description: "Check your email for a link to reset your password.",
      });
      
      setEmail("");
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        variant: "destructive",
        title: "Error sending reset email",
        description: error.message || "Failed to send password reset email. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    const sanitizedPassword = sanitizeInput(password, INPUT_LIMITS.PASSWORD_MAX);
    const sanitizedConfirmPassword = sanitizeInput(confirmPassword, INPUT_LIMITS.PASSWORD_MAX);
    
    if (sanitizedPassword !== sanitizedConfirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical.",
      });
      return;
    }
    
    const passwordValidation = validatePassword(sanitizedPassword);
    if (!passwordValidation.isValid) {
      toast({
        variant: "destructive",
        title: "Invalid password",
        description: passwordValidation.errors[0],
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: sanitizedPassword
      });

      if (error) throw error;

      toast({
        title: "Password updated successfully",
        description: "You can now sign in with your new password.",
      });
      
      // Clear form and redirect to sign in
      setPassword("");
      setConfirmPassword("");
      setIsPasswordReset(false);
      navigate("/auth");
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        variant: "destructive",
        title: "Error updating password",
        description: error.message || "Failed to update password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Sign In or Create Account | MyEcclesia"
        description="Sign in to your MyEcclesia account or create a new one. Join the UK's Christian events community and start discovering faith-based events."
        noIndex={true}
      />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="absolute left-4 top-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/0d3d2918-a9f2-480a-ab92-4a5c6554877d.png" 
              alt="MyEcclesia Logo" 
              className="h-10 w-10 object-contain"
            />
            <span className="text-2xl font-bold text-foreground">MyEcclesia</span>
          </div>
        </div>

        <Card>
          {isPasswordReset ? (
            <>
              <CardHeader className="text-center">
                <CardTitle>Reset Your Password</CardTitle>
                <CardDescription>
                  Enter your new password below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter your new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      maxLength={INPUT_LIMITS.PASSWORD_MAX}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      maxLength={INPUT_LIMITS.PASSWORD_MAX}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Updating password..." : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <CardTitle>Welcome</CardTitle>
                <CardDescription>
                  Sign in to your account or create a new one
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    <TabsTrigger value="forgot">Reset</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          maxLength={INPUT_LIMITS.EMAIL_MAX}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          maxLength={INPUT_LIMITS.PASSWORD_MAX}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Enter your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          maxLength={INPUT_LIMITS.NAME_MAX}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          maxLength={INPUT_LIMITS.EMAIL_MAX}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          maxLength={INPUT_LIMITS.PASSWORD_MAX}
                          required
                        />
                        {validationErrors.length > 0 && (
                          <div className="text-sm text-destructive space-y-1">
                            {validationErrors.map((error, index) => (
                              <div key={index} className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                {error}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Creating account..." : "Sign Up"}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="forgot">
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          maxLength={INPUT_LIMITS.EMAIL_MAX}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Sending reset email..." : "Send Reset Email"}
                      </Button>
                      <p className="text-sm text-muted-foreground text-center">
                        We'll send you a link to reset your password
                      </p>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
    </>
  );
};

export default Auth;