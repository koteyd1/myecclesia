import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Download, TrendingUp, Ticket, CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { PaymentComplianceText } from './PaymentComplianceText';

interface TicketTransaction {
  id: string;
  event_id: string;
  event_title: string;
  quantity: number;
  status: string;
  created_at: string;
  amount_total: number;
  currency: string;
  buyer_name: string | null;
  buyer_email: string | null;
  check_in_status: string | null;
}

interface ConnectStatus {
  has_account: boolean;
  account_status: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  in_free_period: boolean;
  paypal_email: string | null;
}

export function OrganiserFinanceDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<TicketTransaction[]>([]);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [events, setEvents] = useState<{ id: string; title: string }[]>([]);
  const [platformFeePercent, setPlatformFeePercent] = useState(0);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch connect status
      const { data: sessionData } = await supabase.auth.getSession();
      const { data: statusData } = await supabase.functions.invoke('check-connect-status', {
        headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
      });
      setConnectStatus(statusData);

      // Fetch organiser's events
      const { data: myEvents } = await supabase
        .from('events')
        .select('id, title')
        .eq('created_by', user.id)
        .order('date', { ascending: false });

      setEvents(myEvents || []);

      if (!myEvents?.length) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      const eventIds = myEvents.map(e => e.id);
      const eventMap = Object.fromEntries(myEvents.map(e => [e.id, e.title]));

      // Fetch tickets for organiser's events
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
          id, event_id, quantity, status, created_at, check_in_status,
          payment_metadata, user_id
        `)
        .in('event_id', eventIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch buyer profiles
      const userIds = [...new Set((tickets || []).map(t => t.user_id))];
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

      const mapped: TicketTransaction[] = (tickets || []).map(t => {
        const meta = t.payment_metadata as any;
        const profile = profileMap[t.user_id];
        return {
          id: t.id,
          event_id: t.event_id,
          event_title: eventMap[t.event_id] || 'Unknown Event',
          quantity: t.quantity,
          status: t.status,
          created_at: t.created_at,
          amount_total: meta?.amount_total ? meta.amount_total / 100 : 0,
          currency: meta?.currency || 'gbp',
          buyer_name: profile?.full_name || null,
          buyer_email: profile?.email || null,
          check_in_status: t.check_in_status,
        };
      });

      setTransactions(mapped);
    } catch (error) {
      console.error('Error fetching finance data:', error);
      toast({ title: 'Error', description: 'Failed to load finance data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = selectedEvent === 'all'
    ? transactions
    : transactions.filter(t => t.event_id === selectedEvent);

  const confirmedTransactions = filteredTransactions.filter(t => t.status === 'confirmed');
  const totalRevenue = confirmedTransactions.reduce((sum, t) => sum + t.amount_total, 0);
  const totalTicketsSold = confirmedTransactions.reduce((sum, t) => sum + t.quantity, 0);
  const platformFees = totalRevenue * (PLATFORM_FEE_PERCENT / 100);
  const netPayout = totalRevenue - platformFees;

  const exportCSV = () => {
    const headers = ['Date', 'Event', 'Buyer Name', 'Buyer Email', 'Quantity', 'Amount (£)', 'Status', 'Check-in'];
    const rows = filteredTransactions.map(t => [
      format(new Date(t.created_at), 'yyyy-MM-dd HH:mm'),
      `"${t.event_title}"`,
      `"${t.buyer_name || 'N/A'}"`,
      `"${t.buyer_email || 'N/A'}"`,
      t.quantity,
      t.amount_total.toFixed(2),
      t.status,
      t.check_in_status || 'N/A',
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myecclesia-finance-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payout Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payout Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connectStatus?.has_account ? (
            <div className="flex flex-wrap items-center gap-3">
              {connectStatus.charges_enabled && connectStatus.payouts_enabled ? (
                <Badge className="bg-green-500 hover:bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" /> Payouts Active
                </Badge>
              ) : connectStatus.account_status === 'pending_verification' ? (
                <Badge variant="secondary" className="bg-yellow-500 text-white">
                  <Clock className="h-3 w-3 mr-1" /> Verification Pending
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" /> Setup Incomplete
                </Badge>
              )}
              {connectStatus.paypal_email && (
                <Badge variant="outline">PayPal: {connectStatus.paypal_email}</Badge>
              )}
              {connectStatus.in_free_period && (
                <Badge variant="outline" className="text-green-600 border-green-300">
                  🎉 Free Period — 0% Fees
                </Badge>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">No Payment Account</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Set up your payment account in{' '}
                  <a href="/profile/edit" className="underline font-medium">Profile Settings</a>
                  {' '}to receive payouts.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">£{totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Payout</p>
                <p className="text-2xl font-bold">£{netPayout.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Ticket className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tickets Sold</p>
                <p className="text-2xl font-bold">{totalTicketsSold}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Platform Fees</p>
                <p className="text-2xl font-bold">£{platformFees.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>{filteredTransactions.length} transactions</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={filteredTransactions.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">
                        {format(new Date(t.created_at), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {t.event_title}
                      </TableCell>
                      <TableCell className="text-sm">
                        {t.buyer_name || t.buyer_email || 'Guest'}
                      </TableCell>
                      <TableCell className="text-center">{t.quantity}</TableCell>
                      <TableCell className="text-right font-medium">
                        {t.amount_total > 0 ? `£${t.amount_total.toFixed(2)}` : 'Free'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.status === 'confirmed' ? 'default' : t.status === 'cancelled' ? 'destructive' : 'secondary'}>
                          {t.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentComplianceText />
    </div>
  );
}
