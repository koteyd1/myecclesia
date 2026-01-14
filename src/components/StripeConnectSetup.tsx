import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, CheckCircle, Clock, AlertCircle, ExternalLink, Loader2, RefreshCw } from 'lucide-react';

interface ConnectStatus {
  has_account: boolean;
  stripe_account_id?: string;
  account_status: 'pending' | 'pending_verification' | 'active' | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  first_event_date: string | null;
  in_free_period: boolean;
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

  useEffect(() => {
    if (user) {
      checkConnectStatus();
    }
  }, [user]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  const checkConnectStatus = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('check-connect-status', {
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw error;
      setStatus(data);
    } catch (error) {
      console.error('Error checking connect status:', error);
      toast({
        title: "Error",
        description: "Failed to check payment account status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startOnboarding = async () => {
    try {
      setActionLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to Stripe",
          description: "Complete the onboarding in the new tab, then return here and refresh.",
        });
      }
    } catch (error) {
      console.error('Error starting onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to start payment account setup",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openDashboard = async () => {
    try {
      setActionLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('create-connect-login-link', {
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to open Stripe dashboard",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
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

  const renderStatusBadge = () => {
    if (!status?.has_account) {
      return <Badge variant="secondary">Not Set Up</Badge>;
    }
    
    switch (status.account_status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'pending_verification':
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Pending Verification</Badge>;
      case 'pending':
        return <Badge variant="secondary">Incomplete</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

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
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={checkConnectStatus}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Connect your bank account to receive payments from ticket sales
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!status?.has_account ? (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                To receive payments for paid events, you need to set up a Stripe account. 
                This allows us to send ticket revenue directly to your bank account.
              </AlertDescription>
            </Alert>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium">What you'll need:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Bank account details</li>
                <li>• Identity verification (ID or passport)</li>
                <li>• Business information (if applicable)</li>
              </ul>
            </div>
            <Button 
              onClick={startOnboarding} 
              disabled={actionLoading}
              className="w-full"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Set Up Payment Account
            </Button>
          </>
        ) : status.account_status === 'active' ? (
          <>
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200">Account Ready</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your payment account is fully set up. You can receive payments from ticket sales.
                </p>
              </div>
            </div>
            
            {status.in_free_period && (
              <Alert>
                <AlertDescription className="flex items-center gap-2">
                  🎉 <strong>Free Period Active:</strong> No platform fees for the first 6 months!
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-muted-foreground">Payments</div>
                <div className="font-medium flex items-center gap-1">
                  {status.charges_enabled ? (
                    <><CheckCircle className="h-4 w-4 text-green-500" /> Enabled</>
                  ) : (
                    <><Clock className="h-4 w-4 text-yellow-500" /> Pending</>
                  )}
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-muted-foreground">Payouts</div>
                <div className="font-medium flex items-center gap-1">
                  {status.payouts_enabled ? (
                    <><CheckCircle className="h-4 w-4 text-green-500" /> Enabled</>
                  ) : (
                    <><Clock className="h-4 w-4 text-yellow-500" /> Pending</>
                  )}
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={openDashboard} 
              disabled={actionLoading}
              className="w-full"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Open Stripe Dashboard
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                  {status.account_status === 'pending_verification' 
                    ? 'Verification in Progress' 
                    : 'Setup Incomplete'}
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {status.account_status === 'pending_verification' 
                    ? 'Stripe is verifying your information. This usually takes 1-2 business days.'
                    : 'Please complete your account setup to receive payments.'}
                </p>
              </div>
            </div>
            
            {status.account_status === 'pending' && (
              <Button 
                onClick={startOnboarding} 
                disabled={actionLoading}
                className="w-full"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Continue Setup
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
