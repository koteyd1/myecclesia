import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { notifyMessageByEmail } from "@/utils/notifyMessageEmail";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Mail, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SendMessageDialogProps {
  recipientId: string;
  recipientName: string;
  children?: React.ReactNode;
}

export function SendMessageDialog({ recipientId, recipientName, children }: SendMessageDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!content.trim()) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: recipientId,
        subject: subject.trim() || null,
        content: content.trim(),
      });

      if (error) throw error;

      // Fire-and-forget email notification
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();
      notifyMessageByEmail({
        recipientId: recipientId,
        senderName: senderProfile?.full_name || "Someone",
        subject: subject.trim() || undefined,
        contentPreview: content.trim(),
      });

      toast({ title: "Message sent", description: `Your message to ${recipientName} has been sent.` });
      setSubject("");
      setContent("");
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Failed to send message", description: error.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && !user) {
      navigate("/auth");
      return;
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message {recipientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject (optional)"
            />
          </div>
          <div>
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your message..."
              rows={5}
            />
          </div>
          <Button onClick={handleSend} disabled={!content.trim() || isSending} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {isSending ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
