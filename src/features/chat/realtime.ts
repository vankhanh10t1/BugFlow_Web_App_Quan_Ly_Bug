import "server-only";
import * as Ably from "ably";

export type ChatRealtimeEvent = {
  id: string;
  type: "message.created" | "message.updated" | "message.deleted" | "reaction.updated" | "receipt.updated";
  conversationId: string;
  messageId?: string;
  actorId: string;
  occurredAt: string;
};

let rest: Ably.Rest | null | undefined;

function client() {
  if (rest !== undefined) return rest;
  const key = process.env.ABLY_API_KEY;
  rest = key ? new Ably.Rest({ key }) : null;
  return rest;
}

export function chatChannelName(conversationId: string) {
  return `private:chat:${conversationId}`;
}

export function chatPresenceChannelName(conversationId: string) {
  return `private:chat-presence:${conversationId}`;
}

export async function publishChatEvent(event: Omit<ChatRealtimeEvent, "id" | "occurredAt">) {
  const ably = client();
  if (!ably) return false;
  const payload: ChatRealtimeEvent = { ...event, id: crypto.randomUUID(), occurredAt: new Date().toISOString() };
  try {
    await ably.channels.get(chatChannelName(event.conversationId)).publish(event.type, payload);
    return true;
  } catch (error) {
    console.error("[chat-realtime] publish failed", { type: event.type, conversationId: event.conversationId, error: error instanceof Error ? error.message : "unknown" });
    return false;
  }
}

export async function createChatTokenRequest(conversationId: string, userId: string) {
  const ably = client();
  if (!ably) return null;
  const channel = chatChannelName(conversationId);
  const presenceChannel = chatPresenceChannelName(conversationId);
  return ably.auth.createTokenRequest({
    clientId: userId,
    capability: JSON.stringify({ [channel]: ["subscribe"], [presenceChannel]: ["subscribe", "publish", "presence"] }),
    ttl: 60 * 60 * 1000,
  });
}
