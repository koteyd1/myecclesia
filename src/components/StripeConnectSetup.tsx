import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, CheckCircle, Clock, AlertCircle, ExternalLink, Loader2, RefreshCw, Mail, Wallet } from 'lucide-react';

interface ConnectStatus {
  has_account: boolean;
  stripe_account_id?: string;
  account_status: 'pending' | 'pending_verification' | 'active' | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  first_event_date: string | null;
  in_free_period: boolean;
  paypal_email?: string | null;
}

interface StripeConnectSetupProps {
  onStatusChange?: (status: ConnectStatus | null) => void;
}

export function StripeConnectSetup({ onStatusChange }: StripeConnectSetupProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [connectNotEnabled, setConnectNotEnabled] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [savingPaypal, setSavingPaypal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'stripe' | 'paypal' | null>(null);

  useEffect(() => {
    if (user) {
      checkConnectStatus();
    }
  }, [user]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    if (status?.paypal_email) {
      setPaypalEmail(status.paypal_email);
    }
  }, [status]);

  // Auto-detect which provider is already set up
  useEffect(() => {
    if (!status) return;
    const hasStripe = status.has_account && !status.stripe_account_id?.startsWith('paypal_only_');
    const hasPaypal = !!status.paypal_email;
    if (hasStripe) setSelectedProvider('stripe');
    else if (hasPaypal) setSelectedProvider('paypal');
  }, [status]);

  const checkConnectStatus = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('check-connect-status', {
        headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
      });
      if (error) throw error;
      setStatus(data);
    } catch (error) {
      console.error('Error checking connect status:', error);
      toast({ title: "Error", description: "Failed to check payment account status", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const startOnboarding = async () => {
    try {
      setActionLoading(true);
      setConnectNotEnabled(false);
      const { data: sessionData } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
      });

      if (error) {
        // Try to read the actual response body from the FunctionsHttpError
        let errorBody: any = null;
        try {
          if (error.context && typeof error.context.json === 'function') {
            errorBody = await error.context.json();
          }
        } catch { /* ignore parse errors */ }

        if (
          errorBody?.code === 'CONNECT_NOT_ENABLED' ||
          JSON.stringify(error).includes('CONNECT_NOT_ENABLED') ||
          JSON.stringify(error).includes('signed up for Connect')
        ) {
          setConnectNotEnabled(true);
          toast({ title: "Stripe Connect Unavailable", description: "Stripe Connect is not enabled yet. You can still use PayPal.", variant: "destructive" });
          return;
        }
        throw error;
      }

      if (data?.code === 'CONNECT_NOT_ENABLED') {
        setConnectNotEnabled(true);
        toast({ title: "Stripe Connect Unavailable", description: "Stripe Connect is not enabled yet. You can still use PayPal.", variant: "destructive" });
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({ title: "Redirecting to Stripe", description: "Complete the onboarding in the new tab, then return here and refresh." });
      }
    } catch (error: any) {
      console.error('Error starting onboarding:', error);
      setConnectNotEnabled(true);
      toast({ title: "Stripe Connect Unavailable", description: "Stripe Connect is not available right now. You can still use PayPal.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const openDashboard = async () => {
    try {
      setActionLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('create-connect-login-link', {
        headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening dashboard:', error);
      toast({ title: "Error", description: "Failed to open Stripe dashboard", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const savePaypalEmail = async () => {
    if (!user || !paypalEmail.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(paypalEmail.trim())) {
      toast({ title: "Invalid Email", description: "Please enter a valid PayPal email address.", variant: "destructive" });
      return;
    }
    try {
      setSavingPaypal(true);
      const { data: existing } = await supabase
        .from('stripe_connected_accounts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('stripe_connected_accounts')
          .update({ paypal_email: paypalEmail.trim() })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('stripe_connected_accounts')
          .insert({
            user_id: user.id,
            stripe_account_id: `paypal_only_${user.id}`,
            account_status: 'active',
            paypal_email: paypalEmail.trim(),
          });
        if (error) throw error;
      }
      toast({ title: "PayPal email saved successfully" });
      await checkConnectStatus();
    } catch (error: any) {
      console.error('Error saving PayPal email:', error);
      toast({ title: "Error", description: error.message || "Failed to save PayPal email", variant: "destructive" });
    } finally {
      setSavingPaypal(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasPaypal = !!status?.paypal_email;
  const hasStripe = status?.has_account && !status?.stripe_account_id?.startsWith('paypal_only_');
  const isSetUp = hasPaypal || (hasStripe && status?.account_status === 'active');

  const renderStatusBadge = () => {
    if (isSetUp) return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    if (hasStripe && status?.account_status === 'pending_verification') return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Pending Verification</Badge>;
    if (hasStripe && status?.account_status === 'pending') return <Badge variant="secondary">Incomplete</Badge>;
    return <Badge variant="secondary">Not Set Up</Badge>;
  };

  // Provider selection screen (shown when nothing is set up yet)
  const renderProviderSelection = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Choose how you'd like to receive payments from ticket sales:</p>
      <RadioGroup
        value={selectedProvider || ''}
        onValueChange={(val) => setSelectedProvider(val as 'stripe' | 'paypal')}
        className="space-y-3"
      >
        <label
          htmlFor="provider-stripe"
          className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
            selectedProvider === 'stripe' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
          }`}
        >
          <RadioGroupItem value="stripe" id="provider-stripe" className="mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 font-medium">
              <CreditCard className="h-4 w-4" />
              Stripe (Bank Transfer)
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Receive payments directly to your bank account. Requires Stripe account setup.
            </p>
          </div>
        </label>

        <label
          htmlFor="provider-paypal"
          className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
            selectedProvider === 'paypal' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
          }`}
        >
          <RadioGroupItem value="paypal" id="provider-paypal" className="mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 font-medium">
              <Wallet className="h-4 w-4" />
              PayPal
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Receive payments to your PayPal account. Just enter your PayPal email.
            </p>
          </div>
        </label>
      </RadioGroup>
    </div>
  );

  // Stripe setup / status section
  const renderStripeSection = () => {
    if (connectNotEnabled) {
      return (
        <div className="space-y-3">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Stripe Connect is not available at this time. You can try again later or use PayPal below.
            </AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => { setConnectNotEnabled(false); startOnboarding(); }} disabled={actionLoading} className="w-full">
            {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Retry Stripe Setup
          </Button>
        </div>
      );
    }

    if (!hasStripe) {
      return (
        <div className="space-y-3">
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              Set up a Stripe account to receive ticket revenue directly to your bank account.
            </AlertDescription>
          </Alert>
          <Button onClick={startOnboarding} disabled={actionLoading} className="w-full">
            {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
            Set Up Stripe Account
          </Button>
        </div>
      );
    }

    if (status?.account_status === 'active') {
      return (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200">Account Ready</h4>
              <p className="text-sm text-green-700 dark:text-green-300">Your Stripe account is fully set up.</p>
            </div>
          </div>
          {status.in_free_period && (
            <Alert>
              <AlertDescription className="flex items-center gap-2">
                🎉 <strong>Free Period Active:</strong> No platform fees for the first 3 months!
              </AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-muted-foreground">Payments</div>
              <div className="font-medium flex items-center gap-1">
                {status.charges_enabled ? <><CheckCircle className="h-4 w-4 text-green-500" /> Enabled</> : <><Clock className="h-4 w-4 text-yellow-500" /> Pending</>}
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-muted-foreground">Payouts</div>
              <div className="font-medium flex items-center gap-1">
                {status.payouts_enabled ? <><CheckCircle className="h-4 w-4 text-green-500" /> Enabled</> : <><Clock className="h-4 w-4 text-yellow-500" /> Pending</>}
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={openDashboard} disabled={actionLoading} className="w-full">
            {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
            Open Stripe Dashboard
          </Button>
        </div>
      );
    }

    // Pending states
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
          <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
              {status?.account_status === 'pending_verification' ? 'Verification in Progress' : 'Setup Incomplete'}
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {status?.account_status === 'pending_verification'
                ? 'Stripe is verifying your information. This usually takes 1-2 business days.'
                : 'Please complete your account setup to receive payments.'}
            </p>
          </div>
        </div>
        {status?.account_status === 'pending' && (
          <Button onClick={startOnboarding} disabled={actionLoading} className="w-full">
            {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
            Continue Setup
          </Button>
        )}
      </div>
    );
  };

  // PayPal setup / status section
  const renderPaypalSection = () => (
    <div className="space-y-3">
      {hasPaypal && (
        <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-800 dark:text-green-200">PayPal Connected</h4>
            <p className="text-sm text-green-700 dark:text-green-300">Payments can be sent to: {status?.paypal_email}</p>
          </div>
        </div>
      )}
      {!hasPaypal && (
        <p className="text-sm text-muted-foreground">Enter your PayPal email to receive payments.</p>
      )}
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="paypal-email" className="sr-only">PayPal Email</Label>
          <Input
            id="paypal-email"
            type="email"
            placeholder="your-paypal@email.com"
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
          />
        </div>
        <Button onClick={savePaypalEmail} disabled={savingPaypal || !paypalEmail.trim()} variant={hasPaypal ? "outline" : "default"}>
          {savingPaypal ? <Loader2 className="h-4 w-4 animate-spin" /> : hasPaypal ? "Update" : "Save"}
        </Button>
      </div>
    </div>
  );

  const showProviderPicker = !hasStripe && !hasPaypal && !selectedProvider;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Account
          </span>
          <div className="flex items-center gap-2">
            {renderStatusBadge()}
            <Button variant="ghost" size="icon" onClick={checkConnectStatus} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          {showProviderPicker
            ? 'Choose a payment provider to start receiving payments from ticket sales'
            : 'Manage your payment account for receiving ticket sale revenue'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showProviderPicker ? (
          renderProviderSelection()
        ) : (
          <>
            {/* Active provider section */}
            {(selectedProvider === 'stripe' || hasStripe) && renderStripeSection()}
            {(selectedProvider === 'paypal' || (!hasStripe && hasPaypal)) && renderPaypalSection()}

            {/* Switch provider link */}
            {!hasStripe && !hasPaypal && selectedProvider && (
              <Button
                variant="link"
                size="sm"
                className="text-muted-foreground p-0 h-auto"
                onClick={() => setSelectedProvider(null)}
              >
                ← Choose a different provider
              </Button>
            )}

            {/* Show secondary provider if one is already active */}
            {(hasStripe || hasPaypal) && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  {hasStripe ? 'Also accept PayPal' : 'Also set up Stripe'}
                </h4>
                {hasStripe ? renderPaypalSection() : renderStripeSection()}
              </div>
            )}
          </>
        )}
        <PaymentComplianceText />
      </CardContent>
    </Card>
  );
}
