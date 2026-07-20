import { requirePageUser } from "@/lib/auth";
import { ChatWorkspace } from "@/components/chat/chat-workspace";

export const metadata = { title: "Trò chuyện" };
export default async function ChatPage({ searchParams }: { searchParams: Promise<{ conversation?: string }> }) {
  const user = await requirePageUser();
  const { conversation } = await searchParams;
  return <div><div className="mb-6"><p className="text-sm font-medium text-blue-600">Trao đổi nội bộ</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Chat</h1><p className="mt-2 text-slate-600">Chat dự án, trao đổi trực tiếp với đồng nghiệp hoặc mở kênh hỗ trợ Admin.</p></div><ChatWorkspace currentUserId={user.id} initialConversationId={conversation} /></div>;
}
