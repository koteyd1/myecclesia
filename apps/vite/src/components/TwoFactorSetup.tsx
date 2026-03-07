import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import QRCode from "qrcode";

interface Factor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
}

export function TwoFactorSetup() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<{
    id: string;
    totp: { qr_code: string; secret: string; uri: string };
  } | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [factorToDisable, setFactorToDisable] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    fetchFactors();
  }, []);

  useEffect(() => {
    if (enrollmentData?.totp?.uri) {
      QRCode.toDataURL(enrollmentData.totp.uri, { width: 200 })
        .then(setQrCodeDataUrl)
        .catch(console.error);
    }
  }, [enrollmentData]);

  const fetchFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setFactors(data?.totp || []);
    } catch (error) {
      console.error("Error fetching MFA factors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEnrollment = async () => {
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator App",
      });

      if (error) throw error;

      setEnrollmentData(data);
    } catch (error: any) {
      console.error("Error starting MFA enrollment:", error);
      toast({
        variant: "destructive",
        title: "Enrollment Failed",
        description: error.message || "Failed to start 2FA setup. Please try again.",
      });
      setIsEnrolling(false);
    }
  };

  const verifyEnrollment = async () => {
    if (!enrollmentData || verificationCode.length !== 6) return;

    setIsVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollmentData.id,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollmentData.id,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (verifyError) throw verifyError;

      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled for your account.",
      });

      setEnrollmentData(null);
      setVerificationCode("");
      setIsEnrolling(false);
      fetchFactors();
    } catch (error: any) {
      console.error("Error verifying MFA:", error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const cancelEnrollment = async () => {
    if (enrollmentData) {
      try {
        await supabase.auth.mfa.unenroll({ factorId: enrollmentData.id });
      } catch (error) {
        console.error("Error canceling enrollment:", error);
      }
    }
    setEnrollmentData(null);
    setVerificationCode("");
    setIsEnrolling(false);
  };

  const disableFactor = async (factorId: string) => {
    setIsDisabling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;

      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled for your account.",
      });

      fetchFactors();
    } catch (error: any) {
      console.error("Error disabling MFA:", error);
      toast({
        variant: "destructive",
        title: "Failed to Disable 2FA",
        description: error.message || "Could not disable 2FA. Please try again.",
      });
    } finally {
      setIsDisabling(false);
      setShowDisableDialog(false);
      setFactorToDisable(null);
    }
  };

  const copySecret = () => {
    if (enrollmentData?.totp?.secret) {
      navigator.clipboard.writeText(enrollmentData.totp.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const hasActiveFactor = factors.some((f) => f.status === "verified");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account by requiring a verification code from your authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              {hasActiveFactor ? (
                <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
              ) : (
                <ShieldOff className="w-8 h-8 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  {hasActiveFactor ? "2FA is enabled" : "2FA is not enabled"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {hasActiveFactor
                    ? "Your account is protected with two-factor authentication"
                    : "Enable 2FA for enhanced security"}
                </p>
              </div>
            </div>
            <Badge variant={hasActiveFactor ? "default" : "secondary"}>
              {hasActiveFactor ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Enrollment Flow */}
          {enrollmentData ? (
            <div className="space-y-6 p-4 border rounded-lg">
              <div className="text-center">
                <h4 className="font-medium mb-2">Scan QR Code</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                {qrCodeDataUrl && (
                  <div className="inline-block p-4 bg-white rounded-lg">
                    <img src={qrCodeDataUrl} alt="2FA QR Code" className="mx-auto" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Or enter this secret key manually:
                </p>
                <div className="flex items-center gap-2 justify-center">
                  <code className="px-3 py-2 bg-muted rounded text-sm font-mono">
                    {enrollmentData.totp.secret}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copySecret}
                    title="Copy secret"
                  >
                    {copiedSecret ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-code">Enter Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-lg tracking-widest"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={cancelEnrollment}
                  disabled={isVerifying}
                >
                  Cancel
                </Button>
                <Button
                  onClick={verifyEnrollment}
                  disabled={verificationCode.length !== 6 || isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Enable"
                  )}
                </Button>
              </div>
            </div>
          ) : hasActiveFactor ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">Registered Authenticators:</p>
                {factors
                  .filter((f) => f.status === "verified")
                  .map((factor) => (
                    <div
                      key={factor.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                        <span>{factor.friendly_name || "Authenticator App"}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setFactorToDisable(factor.id);
                          setShowDisableDialog(true);
                        }}
                        disabled={isDisabling}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <Button onClick={startEnrollment} disabled={isEnrolling} className="w-full">
              {isEnrolling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Enable Two-Factor Authentication
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Disable Confirmation Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the authenticator from your account. Your account will be less secure
              without 2FA enabled. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDisabling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => factorToDisable && disableFactor(factorToDisable)}
              disabled={isDisabling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDisabling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable 2FA"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
