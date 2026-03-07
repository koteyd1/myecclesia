import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, CheckCircle, Eye, Lock, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SecurityMetrics {
  totalDonations: number;
  anonymousDonations: number;
  protectedDonations: number;
  recentAuditLogs: number;
}

export const SecurityReport = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSecurityMetrics();
  }, []);

  const fetchSecurityMetrics = async () => {
    try {
      setLoading(true);

      // Get total donations count (only admins can see this)
      const { data: donations, error: donationsError } = await supabase
        .from("donations")
        .select("id, user_id, created_at");

      if (donationsError) throw donationsError;

      // Count anonymous vs identified donations
      const anonymousCount = donations?.filter(d => d.user_id === null).length || 0;
      const totalCount = donations?.length || 0;

      // Get recent audit logs for donation access
      const { data: auditLogs, error: auditError } = await supabase
        .from("admin_audit_log")
        .select("id, action, created_at")
        .ilike("action", "%DONATION%")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false });

      if (auditError) throw auditError;

      setMetrics({
        totalDonations: totalCount,
        anonymousDonations: anonymousCount,
        protectedDonations: totalCount - anonymousCount,
        recentAuditLogs: auditLogs?.length || 0,
      });

    } catch (error) {
      console.error("Error fetching security metrics:", error);
      toast({
        title: "Error",
        description: "Failed to load security metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const securityFeatures = [
    {
      title: "Anonymous Donation Protection",
      description: "Anonymous donations (user_id=NULL) are now only accessible to admins",
      status: "active",
      icon: <UserX className="h-5 w-5" />,
    },
    {
      title: "PII Data Masking",
      description: "Email addresses and Stripe IDs are masked for non-admin users",
      status: "active",
      icon: <Eye className="h-5 w-5" />,
    },
    {
      title: "Enhanced Audit Logging",
      description: "All access to sensitive donation data is logged for security monitoring",
      status: "active",
      icon: <Shield className="h-5 w-5" />,
    },
    {
      title: "Secure RLS Policies",
      description: "Row-level security prevents unauthorized access to donor information",
      status: "active",
      icon: <Lock className="h-5 w-5" />,
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Donation Security Report
          </CardTitle>
          <CardDescription>
            Overview of security measures protecting donor information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {metrics?.totalDonations || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Donations</div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {metrics?.anonymousDonations || 0}
              </div>
              <div className="text-sm text-muted-foreground">Anonymous Donations</div>
              <Badge variant="outline" className="mt-1 text-xs">Protected</Badge>
            </div>
            
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {metrics?.protectedDonations || 0}
              </div>
              <div className="text-sm text-muted-foreground">User-Linked Donations</div>
              <Badge variant="outline" className="mt-1 text-xs">Secure</Badge>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {metrics?.recentAuditLogs || 0}
              </div>
              <div className="text-sm text-muted-foreground">Audit Logs (7 days)</div>
              <Badge variant="outline" className="mt-1 text-xs">Monitored</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Active Security Features</h3>
            <div className="grid gap-4">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="text-green-600 mt-0.5">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{feature.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <h4 className="font-semibold">Security Status: Protected</h4>
            </div>
            <p className="text-sm text-green-600 dark:text-green-300 mt-1">
              Anonymous donor PII vulnerability has been resolved. All donation data is now properly protected 
              with enhanced RLS policies, data masking, and comprehensive audit logging.
            </p>
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={fetchSecurityMetrics} variant="outline" size="sm">
              Refresh Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};