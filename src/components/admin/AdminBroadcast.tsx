import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Megaphone, Edit, Trash2, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface BroadcastMessage {
  id: string;
  subject: string | null;
  content: string;
  created_at: string;
  recipient_count?: number;
}

export function AdminBroadcast() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // New broadcast form
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  // Edit state
  const [editingBroadcast, setEditingBroadcast] = useState<BroadcastMessage | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const fetchBroadcasts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, subject, content, created_at")
        .eq("is_admin_broadcast", true)
        .eq("sender_id", user?.id ?? "")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by created_at (broadcasts sent at the same time are the same broadcast)
      const grouped = new Map<string, BroadcastMessage>();
      (data || []).forEach((msg) => {
        // Use subject+content+created_at rounded to minute as key
        const key = `${msg.subject}|${msg.content}|${msg.created_at.substring(0, 16)}`;
        const existing = grouped.get(key);
        if (existing) {
          existing.recipient_count = (existing.recipient_count || 1) + 1;
        } else {
          grouped.set(key, { ...msg, recipient_count: 1 });
        }
      });

      setBroadcasts(Array.from(grouped.values()));
    } catch (error) {
      console.error("Error fetching broadcasts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendBroadcast = async () => {
    if (!content.trim() || !user) return;
    setIsSending(true);

    try {
      // Get all user profiles (except the admin sending)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id")
        .neq("user_id", user.id);

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        toast({ title: "No users to broadcast to", variant: "destructive" });
        setIsSending(false);
        return;
      }

      // Create a message for each user
      const messages = profiles.map((p) => ({
        sender_id: user.id,
        recipient_id: p.user_id,
        subject: subject.trim() || "Announcement",
        content: content.trim(),
        is_admin_broadcast: true,
      }));

      const { error } = await supabase.from("messages").insert(messages);
      if (error) throw error;

      toast({
        title: "Broadcast sent",
        description: `Sent to ${profiles.length} users.`,
      });

      setSubject("");
      setContent("");
      fetchBroadcasts();
    } catch (error: any) {
      toast({
        title: "Failed to send broadcast",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const openEdit = (broadcast: BroadcastMessage) => {
    setEditingBroadcast(broadcast);
    setEditSubject(broadcast.subject || "");
    setEditContent(broadcast.content);
  };

  const updateBroadcast = async () => {
    if (!editingBroadcast || !editContent.trim()) return;
    setIsUpdating(true);

    try {
      // Update all messages that match this broadcast's original content and timestamp
      const { error } = await supabase
        .from("messages")
        .update({
          subject: editSubject.trim() || "Announcement",
          content: editContent.trim(),
        })
        .eq("is_admin_broadcast", true)
        .eq("content", editingBroadcast.content)
        .eq("sender_id", user?.id ?? "");

      if (error) throw error;

      toast({ title: "Broadcast updated" });
      setEditingBroadcast(null);
      fetchBroadcasts();
    } catch (error: any) {
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteBroadcast = async () => {
    if (!deletingId) return;
    setIsDeleting(true);

    try {
      const broadcast = broadcasts.find((b) => b.id === deletingId);
      if (!broadcast) return;

      // Delete all messages that match this broadcast
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("is_admin_broadcast", true)
        .eq("content", broadcast.content)
        .eq("sender_id", user?.id ?? "");

      if (error) throw error;

      toast({ title: "Broadcast deleted" });
      setDeletingId(null);
      fetchBroadcasts();
    } catch (error: any) {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Compose Broadcast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            New Broadcast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Subject (optional)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <Textarea
            placeholder="Write your announcement message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
          />
          <Button onClick={sendBroadcast} disabled={!content.trim() || isSending}>
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isSending ? "Sending..." : "Send Broadcast"}
          </Button>
        </CardContent>
      </Card>

      {/* Previous Broadcasts */}
      <Card>
        <CardHeader>
          <CardTitle>Previous Broadcasts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : broadcasts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No broadcasts sent yet.
            </p>
          ) : (
            <div className="space-y-3">
              {broadcasts.map((b) => (
                <div
                  key={b.id}
                  className="border rounded-lg p-4 flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {b.subject || "Announcement"}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {b.recipient_count} recipients
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {b.content}
                    </p>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {format(new Date(b.created_at), "dd MMM yyyy, HH:mm")}
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(b)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingId(b.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingBroadcast}
        onOpenChange={(open) => !open && setEditingBroadcast(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Broadcast</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Subject"
              value={editSubject}
              onChange={(e) => setEditSubject(e.target.value)}
            />
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingBroadcast(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={updateBroadcast}
              disabled={!editContent.trim() || isUpdating}
            >
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Broadcast?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the broadcast from all recipients' inboxes. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteBroadcast}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
