import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  CreditCard, CheckCircle, Clock, AlertCircle, PauseCircle, PlayCircle,
  Settings, RefreshCw, DollarSign, Search, Wallet,
} from 'lucide-react';
import { format } from 'date-fns';

interface OrganiserAccount {
  id: string;
  user_id: string;
  stripe_account_id: string;
  account_status: string;
  charges_enabled: boolean | null;
  payouts_enabled: boolean | null;
  details_submitted: boolean | null;
  paypal_email: string | null;
  payouts_paused: boolean;
  payouts_paused_reason: string | null;
  payouts_paused_at: string | null;
  created_at: string;
  updated_at: string;
  profile?: { full_name: string | null; email: string | null };
}

export function AdminPayments() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<OrganiserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Platform settings
  const [platformFeePercent, setPlatformFeePercent] = useState('2.5');
  const [platformFeeFixedPence, setPlatformFeeFixedPence] = useState('20');
  const [paypalEnabled, setPaypalEnabled] = useState(true);
  const [appleGooglePayEnabled, setAppleGooglePayEnabled] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchAccounts(), fetchSettings()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('stripe_connected_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching accounts:', error);
      return;
    }

    // Fetch profiles for all user_ids
    const userIds = (data || []).map(a => a.user_id);
    let profileMap: Record<string, { full_name: string | null; email: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);
      profileMap = Object.fromEntries(
        (profiles || []).map(p => [p.user_id, { full_name: p.full_name, email: p.email }])
      );
    }

    setAccounts(
      (data || []).map(a => ({
        ...a,
        payouts_paused: (a as any).payouts_paused ?? false,
        payouts_paused_reason: (a as any).payouts_paused_reason ?? null,
        payouts_paused_at: (a as any).payouts_paused_at ?? null,
        profile: profileMap[a.user_id] || null,
      }))
    );
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('key, value');

    if (error) {
      console.error('Error fetching settings:', error);
      return;
    }

    const settingsMap = Object.fromEntries((data || []).map(s => [s.key, s.value]));
    setPlatformFeePercent(String(settingsMap['platform_fee_percent'] ?? '2.5'));
    setPlatformFeeFixedPence(String(settingsMap['platform_fee_fixed_pence'] ?? '20'));
    setPaypalEnabled(settingsMap['paypal_enabled'] !== false);
    setAppleGooglePayEnabled(settingsMap['apple_google_pay_enabled'] !== false);
    setSettingsLoaded(true);
  };

  const savePlatformSettings = async () => {
    setSavingSettings(true);
    try {
      const feeVal = parseFloat(platformFeePercent);
      if (isNaN(feeVal) || feeVal < 0 || feeVal > 50) {
        toast({ title: 'Invalid fee', description: 'Fee must be between 0 and 50%', variant: 'destructive' });
        return;
      }
      const fixedVal = parseInt(platformFeeFixedPence);
      if (isNaN(fixedVal) || fixedVal < 0 || fixedVal > 500) {
        toast({ title: 'Invalid fixed fee', description: 'Fixed fee must be between 0 and 500p', variant: 'destructive' });
        return;
      }

      const updates = [
        { key: 'platform_fee_percent', value: feeVal },
        { key: 'platform_fee_fixed_pence', value: fixedVal },
        { key: 'paypal_enabled', value: paypalEnabled },
        { key: 'apple_google_pay_enabled', value: appleGooglePayEnabled },
      ];

      for (const u of updates) {
        const { error } = await supabase
          .from('platform_settings')
          .update({ value: u.value as any, updated_at: new Date().toISOString() })
          .eq('key', u.key);
        if (error) throw error;
      }

      toast({ title: 'Settings saved' });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSavingSettings(false);
    }
  };

  const togglePayoutsPaused = async (accountId: string, pause: boolean, reason?: string) => {
    try {
      const { error } = await supabase
        .from('stripe_connected_accounts')
        .update({
          payouts_paused: pause,
          payouts_paused_reason: pause ? (reason || 'Paused by admin') : null,
          payouts_paused_at: pause ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', accountId);

      if (error) throw error;

      toast({ title: pause ? 'Payouts paused' : 'Payouts resumed' });
      await fetchAccounts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const filteredAccounts = accounts.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.profile?.full_name?.toLowerCase().includes(term) ||
      a.profile?.email?.toLowerCase().includes(term) ||
      a.stripe_account_id?.toLowerCase().includes(term) ||
      a.paypal_email?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Platform Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Platform Payment Settings
          </CardTitle>
          <CardDescription>Configure global payment settings for the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Platform Fee % */}
            <div className="space-y-2">
              <Label htmlFor="platform-fee">Platform Fee (%)</Label>
              <div className="flex gap-2">
                <Input
                  id="platform-fee"
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={platformFeePercent}
                  onChange={(e) => setPlatformFeePercent(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground self-center">%</span>
              </div>
              <p className="text-xs text-muted-foreground">Percentage of ticket price</p>
            </div>

            {/* Fixed Fee per Ticket */}
            <div className="space-y-2">
              <Label htmlFor="platform-fee-fixed">Per-Ticket Fee (pence)</Label>
              <div className="flex gap-2">
                <Input
                  id="platform-fee-fixed"
                  type="number"
                  min="0"
                  max="500"
                  step="1"
                  value={platformFeeFixedPence}
                  onChange={(e) => setPlatformFeeFixedPence(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground self-center">p per ticket</span>
              </div>
              <p className="text-xs text-muted-foreground">Fixed fee added per ticket sold</p>
            </div>

            {/* PayPal Toggle */}
            <div className="space-y-2">
              <Label>PayPal Payments</Label>
              <div className="flex items-center gap-3">
                <Switch
                  checked={paypalEnabled}
                  onCheckedChange={setPaypalEnabled}
                />
                <span className="text-sm">{paypalEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <p className="text-xs text-muted-foreground">Allow organisers to use PayPal as a payout method</p>
            </div>

            {/* Apple/Google Pay Toggle */}
            <div className="space-y-2">
              <Label>Apple Pay / Google Pay</Label>
              <div className="flex items-center gap-3">
                <Switch
                  checked={appleGooglePayEnabled}
                  onCheckedChange={setAppleGooglePayEnabled}
                />
                <span className="text-sm">{appleGooglePayEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <p className="text-xs text-muted-foreground">Via Stripe Checkout (requires Stripe dashboard config)</p>
            </div>
          </div>

          <Button onClick={savePlatformSettings} disabled={savingSettings}>
            {savingSettings ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Accounts</p>
                <p className="text-2xl font-bold">{accounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{accounts.filter(a => a.account_status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <PauseCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paused</p>
                <p className="text-2xl font-bold">{accounts.filter(a => a.payouts_paused).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">PayPal Only</p>
                <p className="text-2xl font-bold">{accounts.filter(a => a.stripe_account_id?.startsWith('paypal_only_')).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organiser Accounts Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Organiser Payment Accounts</CardTitle>
              <CardDescription>{filteredAccounts.length} accounts</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search organisers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[250px]"
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchAll}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAccounts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payment accounts found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organiser</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payouts</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map(account => {
                    const isPaypalOnly = account.stripe_account_id?.startsWith('paypal_only_');
                    return (
                      <TableRow key={account.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{account.profile?.full_name || 'Unknown'}</div>
                            <div className="text-xs text-muted-foreground">{account.profile?.email || account.user_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {!isPaypalOnly && (
                              <Badge variant="outline" className="w-fit">
                                <CreditCard className="h-3 w-3 mr-1" /> Stripe
                              </Badge>
                            )}
                            {account.paypal_email && (
                              <Badge variant="outline" className="w-fit">
                                <Wallet className="h-3 w-3 mr-1" /> PayPal
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {account.account_status === 'active' ? (
                            <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                          ) : account.account_status === 'pending_verification' ? (
                            <Badge variant="secondary" className="bg-yellow-500 text-white">Verifying</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {account.payouts_paused ? (
                            <div>
                              <Badge variant="destructive" className="mb-1">
                                <PauseCircle className="h-3 w-3 mr-1" /> Paused
                              </Badge>
                              {account.payouts_paused_reason && (
                                <div className="text-xs text-muted-foreground">{account.payouts_paused_reason}</div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              <PlayCircle className="h-3 w-3 mr-1" /> Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(account.created_at), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          {account.payouts_paused ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => togglePayoutsPaused(account.id, false)}
                            >
                              <PlayCircle className="h-4 w-4 mr-1" />
                              Resume
                            </Button>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <PauseCircle className="h-4 w-4 mr-1" />
                                  Pause
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Pause payouts for {account.profile?.full_name || 'this organiser'}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will prevent payments from being routed to this organiser's account. Ticket sales will still be processed but held by the platform.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => togglePayoutsPaused(account.id, true, 'Paused by admin')}
                                  >
                                    Pause Payouts
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
