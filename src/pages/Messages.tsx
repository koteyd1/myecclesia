import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Mail, Send, Inbox, ArrowLeft, Trash2, Reply } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  content: string;
  is_read: boolean;
  is_admin_broadcast: boolean;
  parent_message_id: string | null;
  created_at: string;
  sender_name?: string;
  recipient_name?: string;
}

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchMessages();
  }, [user]);

  const fetchMessages = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Fetch received messages
      const { data: received, error: recError } = await supabase
        .from("messages")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false });

      if (recError) throw recError;

      // Fetch sent messages
      const { data: sent, error: sentError } = await supabase
        .from("messages")
        .select("*")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false });

      if (sentError) throw sentError;

      // Get unique user IDs to fetch names
      const userIds = new Set<string>();
      [...(received || []), ...(sent || [])].forEach((m) => {
        userIds.add(m.sender_id);
        userIds.add(m.recipient_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", Array.from(userIds));

      const nameMap: Record<string, string> = {};
      profiles?.forEach((p) => {
        nameMap[p.user_id] = p.full_name || p.email || "Unknown User";
      });

      const enrichMessages = (msgs: any[]) =>
        msgs.map((m) => ({
          ...m,
          sender_name: nameMap[m.sender_id] || "Unknown User",
          recipient_name: nameMap[m.recipient_id] || "Unknown User",
        }));

      setMessages(enrichMessages(received || []));
      setSentMessages(enrichMessages(sent || []));
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("id", messageId);
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, is_read: true } : m))
    );
  };

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read && message.recipient_id === user?.id) {
      markAsRead(message.id);
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyContent.trim() || !user) return;
    setIsSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: selectedMessage.sender_id,
        subject: `Re: ${selectedMessage.subject || "No Subject"}`,
        content: replyContent.trim(),
        parent_message_id: selectedMessage.id,
      });

      if (error) throw error;

      toast({ title: "Reply sent successfully" });
      setReplyContent("");
      fetchMessages();
    } catch (error: any) {
      toast({
        title: "Failed to send reply",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;
      toast({ title: "Message deleted" });
      setSelectedMessage(null);
      fetchMessages();
    } catch (error: any) {
      toast({
        title: "Failed to delete message",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  if (!user) return null;

  const MessageList = ({
    messageList,
    type,
  }: {
    messageList: Message[];
    type: "inbox" | "sent";
  }) => (
    <div className="space-y-2">
      {messageList.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No {type === "inbox" ? "received" : "sent"} messages
        </p>
      ) : (
        messageList.map((message) => (
          <button
            key={message.id}
            onClick={() => handleSelectMessage(message)}
            className={`w-full text-left p-4 rounded-lg border transition-colors hover:bg-accent/50 ${
              !message.is_read && type === "inbox"
                ? "bg-primary/5 border-primary/20 font-medium"
                : "bg-background border-border"
            } ${selectedMessage?.id === message.id ? "ring-2 ring-primary" : ""}`}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 mt-0.5">
                <AvatarFallback className="text-xs">
                  {(type === "inbox"
                    ? message.sender_name
                    : message.recipient_name
                  )
                    ?.charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate">
                    {type === "inbox"
                      ? message.sender_name
                      : message.recipient_name}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(message.created_at), "dd MMM")}
                  </span>
                </div>
                <p className="text-sm font-medium truncate">
                  {message.subject || "No Subject"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {message.content}
                </p>
              </div>
              {!message.is_read && type === "inbox" && (
                <Badge variant="default" className="text-xs shrink-0">
                  New
                </Badge>
              )}
              {message.is_admin_broadcast && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  Announcement
                </Badge>
              )}
            </div>
          </button>
        ))
      )}
    </div>
  );

  return (
    <>
      <SEOHead
        title="Messages | MyEcclesia"
        description="View and manage your messages on MyEcclesia."
      />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List */}
          <div className="lg:col-span-1">
            <Tabs defaultValue="inbox">
              <TabsList className="w-full">
                <TabsTrigger value="inbox" className="flex-1 gap-1">
                  <Inbox className="h-4 w-4" />
                  Inbox
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs ml-1">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex-1 gap-1">
                  <Send className="h-4 w-4" />
                  Sent
                </TabsTrigger>
              </TabsList>
              <TabsContent value="inbox" className="mt-4">
                <MessageList messageList={messages} type="inbox" />
              </TabsContent>
              <TabsContent value="sent" className="mt-4">
                <MessageList messageList={sentMessages} type="sent" />
              </TabsContent>
            </Tabs>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="lg:hidden"
                        onClick={() => setSelectedMessage(null)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <CardTitle className="text-lg">
                        {selectedMessage.subject || "No Subject"}
                      </CardTitle>
                    </div>
                    {selectedMessage.sender_id === user.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(selectedMessage.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      From: <strong>{selectedMessage.sender_name}</strong>
                    </span>
                    <span>→</span>
                    <span>
                      To: <strong>{selectedMessage.recipient_name}</strong>
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(
                      new Date(selectedMessage.created_at),
                      "dd MMM yyyy, HH:mm"
                    )}
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">
                    {selectedMessage.content}
                  </p>

                  {/* Reply section - only if received */}
                  {selectedMessage.recipient_id === user.id && (
                    <>
                      <Separator className="my-6" />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Reply className="h-4 w-4" />
                          Reply
                        </div>
                        <Textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Type your reply..."
                          rows={4}
                        />
                        <Button
                          onClick={handleReply}
                          disabled={!replyContent.trim() || isSending}
                          size="sm"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {isSending ? "Sending..." : "Send Reply"}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Mail className="h-12 w-12 mb-4 opacity-50" />
                  <p>Select a message to view</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
