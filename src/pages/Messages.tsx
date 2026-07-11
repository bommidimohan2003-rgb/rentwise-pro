import { MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/common/Button";
import type { Message } from "@/types";

const conversations: Message[] = [
  {
    id: "m1",
    from: "Alex Morgan",
    avatar: "https://i.pravatar.cc/100?img=12",
    preview: "Sure, pickup at 3pm works!",
    time: "2m",
    unread: true,
  },
  {
    id: "m2",
    from: "Priya Shah",
    avatar: "https://i.pravatar.cc/100?img=32",
    preview: "MacBook is fully charged and ready.",
    time: "1h",
    unread: true,
  },
  {
    id: "m3",
    from: "Leo Chen",
    avatar: "https://i.pravatar.cc/100?img=45",
    preview: "The drone comes with 3 batteries.",
    time: "yesterday",
    unread: false,
  },
];

export default function Messages() {
  const [active, setActive] = useState(conversations[0].id);
  const [input, setInput] = useState("");
  const [thread, setThread] = useState<{ me: boolean; text: string }[]>([
    { me: false, text: "Hi! Interested in your Sony A7 IV" },
    { me: true, text: "Yes it's available this weekend" },
    { me: false, text: "Sure, pickup at 3pm works!" },
  ]);

  const send = () => {
    if (!input.trim()) return;
    setThread((t) => [...t, { me: true, text: input.trim() }]);
    setInput("");
  };

  const current = conversations.find((c) => c.id === active)!;

  return (
    <MainLayout>
      <section className="mx-auto max-w-6xl px-4 md:px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
          <MessageSquare className="h-7 w-7" /> Messages
        </h1>
        <div className="mt-8 grid md:grid-cols-[300px_1fr] gap-4 card-premium overflow-hidden h-[70vh]">
          <div className="border-r border-border overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`w-full flex items-center gap-3 p-4 text-left hover:bg-secondary transition-colors ${active === c.id ? "bg-secondary" : ""}`}
              >
                <img src={c.avatar} alt={c.from} className="h-10 w-10 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <span className="font-medium text-sm">{c.from}</span>
                    <span className="text-xs text-muted-foreground">{c.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.preview}</p>
                </div>
                {c.unread && <span className="h-2 w-2 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
          <div className="flex flex-col">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <img src={current.avatar} className="h-9 w-9 rounded-full" alt="" />
              <span className="font-medium">{current.from}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {thread.map((m, i) => (
                <div key={i} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${m.me ? "btn-gradient" : "bg-secondary"}`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="p-4 border-t border-border flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 h-11 px-4 rounded-xl border border-border bg-card outline-none focus:border-primary"
              />
              <Button type="submit" size="icon" aria-label="Send">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
