import { adminDb } from "@/lib/firebase-admin";
import { deleteMessage } from "@/actions";
import MarkRead from "@/components/admin/MarkRead";

type Message = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: number;
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const snapshot = await adminDb
    .collection("messages")
    .orderBy("createdAt", "desc")
    .get();

  const messages: Message[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Message, "id">),
  }));

  return (
    <div>
      <MarkRead />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-white sm:text-2xl">Notifications</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {messages.length} message{messages.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {messages.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-600">No messages yet.</p>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white">
                      {msg.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{msg.name}</p>
                      <p className="text-xs text-zinc-500">{msg.email}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                    {msg.message}
                  </p>
                  <p className="mt-2 text-xs text-zinc-600">
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
                <form action={deleteMessage.bind(null, msg.id)}>
                  <button
                    type="submit"
                    className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-950/50"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
