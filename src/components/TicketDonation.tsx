import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketDonationProps {
  onDonationChange: (amount: number) => void;
  onGiftAidChange: (enabled: boolean) => void;
  donationAmount: number;
  giftAidEnabled: boolean;
  isFreeEvent?: boolean;
  showDonation: boolean;
  onShowDonationChange: (show: boolean) => void;
}

const PRESET_AMOUNTS = [2, 5, 10];

export const TicketDonation = ({
  onDonationChange,
  onGiftAidChange,
  donationAmount,
  giftAidEnabled,
  isFreeEvent = false,
  showDonation,
  onShowDonationChange,
}: TicketDonationProps) => {
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const handlePresetClick = (amount: number) => {
    if (selectedPreset === amount) {
      setSelectedPreset(null);
      onDonationChange(0);
    } else {
      setSelectedPreset(amount);
      setCustomAmount("");
      onDonationChange(amount);
    }
  };

  const handleCustomChange = (value: string) => {
    const numValue = parseFloat(value);
    setCustomAmount(value);
    setSelectedPreset(null);
    if (!isNaN(numValue) && numValue >= 0) {
      onDonationChange(Math.round(numValue * 100) / 100);
    } else {
      onDonationChange(0);
    }
  };

  if (isFreeEvent && !showDonation) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onShowDonationChange(false)}
          >
            Continue Free
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-primary/30 text-primary hover:bg-primary/5"
            onClick={() => onShowDonationChange(true)}
          >
            <Heart className="h-4 w-4 mr-1" />
            Add a Donation
          </Button>
        </div>
      </div>
    );
  }

  if (isFreeEvent && !showDonation) return null;

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Heart className="h-4 w-4 text-primary" />
          Add a donation to the organiser
        </Label>
        {isFreeEvent && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => {
              onShowDonationChange(false);
              onDonationChange(0);
              onGiftAidChange(false);
            }}
          >
            Remove
          </Button>
        )}
      </div>

      {/* Preset amounts */}
      <div className="flex gap-2">
        {PRESET_AMOUNTS.map((amount) => (
          <Button
            key={amount}
            variant="outline"
            size="sm"
            className={cn(
              "flex-1",
              selectedPreset === amount &&
                "border-primary bg-primary/10 text-primary"
            )}
            onClick={() => handlePresetClick(amount)}
          >
            £{amount}
          </Button>
        ))}
        <div className="flex-1">
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Other"
            value={customAmount}
            onChange={(e) => handleCustomChange(e.target.value)}
            className={cn(
              "h-9 text-sm",
              customAmount && "border-primary"
            )}
          />
        </div>
      </div>

      {donationAmount > 0 && (
        <p className="text-xs text-muted-foreground">
          Donation: £{donationAmount.toFixed(2)} — goes directly to the event organiser
        </p>
      )}

      {/* Gift Aid */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
        <Checkbox
          id="gift-aid"
          checked={giftAidEnabled}
          onCheckedChange={(checked) => onGiftAidChange(checked === true)}
          className="mt-0.5"
        />
        <div className="space-y-1">
          <Label htmlFor="gift-aid" className="flex items-center gap-1.5 text-sm font-medium cursor-pointer">
            <Gift className="h-3.5 w-3.5 text-primary" />
            Add Gift Aid
          </Label>
          <p className="text-xs text-muted-foreground leading-relaxed">
            I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax year, it is my responsibility to pay any difference. The charity can claim 25p for every £1 donated.
          </p>
        </div>
      </div>
    </div>
  );
};
