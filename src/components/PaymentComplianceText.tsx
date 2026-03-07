import { Shield } from 'lucide-react';

interface PaymentComplianceTextProps {
  compact?: boolean;
}

export function PaymentComplianceText({ compact = false }: PaymentComplianceTextProps) {
  if (compact) {
    return (
      <p className="text-xs text-muted-foreground text-center mt-3">
        <Shield className="h-3 w-3 inline mr-1" />
        Payments securely processed by Stripe. MyEcclesia does not store card or bank details.
      </p>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Shield className="h-4 w-4" />
        Payment Information
      </div>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
        <li>Card payments and bank payouts are processed by Stripe Connect.</li>
        <li>PayPal payments are processed via PayPal.</li>
        <li>MyEcclesia does not store card or bank details.</li>
        <li>Event organisers receive funds directly from the payment provider.</li>
      </ul>
    </div>
  );
}
