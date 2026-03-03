import { supabase } from "@/integrations/supabase/client";

/**
 * Sends an email notification to the recipient of an in-app message.
 * Fire-and-forget — errors are logged but don't block the caller.
 */
export const notifyMessageByEmail = async ({
  recipientId,
  senderName,
  subject,
  contentPreview,
}: {
  recipientId: string;
  senderName: string;
  subject?: string;
  contentPreview: string;
}) => {
  try {
    await supabase.functions.invoke("notify-message-email", {
      body: { recipientId, senderName, subject, contentPreview },
    });
  } catch (err) {
    console.error("Failed to send message email notification:", err);
  }
};
