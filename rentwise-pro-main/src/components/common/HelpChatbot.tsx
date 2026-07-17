import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, Sparkles, AlertCircle } from "lucide-react";
import { products, categories } from "@/utils/mockData";
import { Button } from "@/components/common/Button";

interface Message {
  sender: "bot" | "user";
  text: string;
  timestamp: Date;
}

export function HelpChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Namaste! I am your Payent Assistant. Ask me anything about our rental products, category offerings, owner earnings, or insurance protection!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-payent-help-chat", handleOpen);
    return () => window.removeEventListener("open-payent-help-chat", handleOpen);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    // User message
    const userMsg: Message = {
      sender: "user",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate thinking delay
    setTimeout(() => {
      const response = generateBotResponse(text);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: response,
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }, 1000);
  };

  const generateBotResponse = (query: string): string => {
    const q = query.toLowerCase().trim();

    // Check if query is related to payent rentals
    const isPayentRelated =
      /payent|rent|lend|price|rate|cost|gear|deposit|insur|deliver|city|cities|owner|earn|product|list|item/i.test(
        q,
      ) ||
      categories.some((cat) => q.includes(cat.id) || q.includes(cat.name.toLowerCase())) ||
      products.some((p) => q.includes(p.title.toLowerCase()) || q.includes(p.category));

    if (!isPayentRelated && !/hi|hello|hey|namaste|help/i.test(q)) {
      return "I am the Payent AI Assistant, trained specifically to assist with peer-to-peer rentals on the Payent platform. I can only answer questions related to our gear listings, daily rental rates, owner earnings, platform cities, and insurance coverage. How can I help you with your rental today?";
    }

    // 1. Bikes & Rides
    if (
      q.includes("bike") ||
      q.includes("scooter") ||
      q.includes("ride") ||
      q.includes("cycle") ||
      q.includes("enfield") ||
      q.includes("ktm") ||
      q.includes("activa")
    ) {
      const bikes = products.filter((p) => p.category === "bikes");
      let bikeListText = "We have multiple premium rides available for rent on Payent:\n";
      bikes.forEach((b) => {
        bikeListText += `• *${b.title}* - ₹${b.price}/day (${b.description.slice(0, 60)}...)\n`;
      });
      return bikeListText + "\nSelect any ride to book it directly on Payent!";
    }

    // 2. Drilling machines & tools
    if (
      q.includes("drill") ||
      q.includes("machine") ||
      q.includes("tool") ||
      q.includes("saw") ||
      q.includes("grinder") ||
      q.includes("bosch") ||
      q.includes("dewalt") ||
      q.includes("makita")
    ) {
      const tools = products.filter((p) => p.category === "tools");
      let toolListText =
        "Yes! We list heavy-duty electric tools for home projects and contract work:\n";
      tools.forEach((t) => {
        toolListText += `• *${t.title}* - ₹${t.price}/day (Perfect for drilling, grinding, or sawing)\n`;
      });
      return (
        toolListText + "\nAll tools include standard handles, cables, and basic safety accessories."
      );
    }

    // 3. Power banks
    if (
      q.includes("power") ||
      q.includes("bank") ||
      q.includes("anker") ||
      q.includes("ambrane") ||
      q.includes("charger") ||
      q.includes("battery")
    ) {
      const powerbanks = products.filter((p) => p.category === "powerbanks");
      let pbListText = "We have high-capacity power banks perfect for outdoor shoots or trips:\n";
      powerbanks.forEach((pb) => {
        pbListText += `• *${pb.title}* - ₹${pb.price}/day\n`;
      });
      return pbListText + "\nKeep your cameras, drones, or laptops charged on the go!";
    }

    // 4. Cameras
    if (
      q.includes("camera") ||
      q.includes("sony") ||
      q.includes("lens") ||
      q.includes("mirrorless")
    ) {
      const camera = products.find((p) => p.category === "cameras");
      return camera
        ? `We have professional cameras like the *${camera.title}* for rent at just ₹${camera.price}/day. It includes a lens, additional batteries, and a carrying case.`
        : "We rent professional full-frame mirrorless cameras, lenses, and accessories at competitive daily rates.";
    }

    // 5. Laptops & Drones
    if (q.includes("laptop") || q.includes("macbook")) {
      const macbook = products.find((p) => p.category === "laptops");
      return macbook
        ? `You can rent the high-end *${macbook.title}* for editing or development work at ₹${macbook.price}/day.`
        : "Need power on the go? Rent premium editing and coding laptops by the day.";
    }

    if (q.includes("drone") || q.includes("dji") || q.includes("mavic")) {
      const drone = products.find((p) => p.category === "drones");
      return drone
        ? `Fly in style! Rent the *${drone.title}* with triple-cameras and additional flight batteries for ₹${drone.price}/day.`
        : "We offer professional DJI camera drones for cinematic aerial videography.";
    }

    // 6. Insurance & Security
    if (
      q.includes("deposit") ||
      q.includes("security") ||
      q.includes("insur") ||
      q.includes("safe") ||
      q.includes("damage") ||
      q.includes("protect")
    ) {
      return "Payent offers ₹5 Lakhs damage protection coverage on every single rental. To ensure a seamless P2P experience, verified renters do not need to pay security deposits. If any damage occurs, our insurance system covers verified claims.";
    }

    // 7. Becoming a lender & earnings
    if (
      q.includes("earn") ||
      q.includes("lend") ||
      q.includes("list") ||
      q.includes("become lender") ||
      q.includes("income")
    ) {
      return "Becoming a Payent Lender is extremely easy! You can list your unused tech gear, tools, or rides in under 2 minutes. High-demand items like cameras, laptops, and bikes can help you earn up to ₹1 Lakh/month in passive income.";
    }

    // 8. Locations / Cities
    if (
      q.includes("city") ||
      q.includes("cities") ||
      q.includes("locat") ||
      q.includes("where") ||
      q.includes("deliver")
    ) {
      return "Payent operates in over 40+ major Indian cities (including Bengaluru, Mumbai, Delhi-NCR, Pune, Hyderabad, and Chennai). We offer direct same-day delivery or easy local pickup options for all rental bookings.";
    }

    // Greetings
    if (/hi|hello|hey|namaste/i.test(q)) {
      return "Hello! How can I help you today? Ask me about our rental bikes, electric drills, power banks, pricing, or lending requirements.";
    }

    // Default payent general response
    return "Payent is India's premium peer-to-peer tech gear and utility rental marketplace. You can search our marketplace for Cameras, Laptops, Drones, Bikes, Electric Tools, and Power Banks. All items are fully insured up to ₹5 Lakhs, and verified users pay zero security deposit. Let me know what specific gear you are looking to rent!";
  };

  const quickQuestions = [
    "What bikes are available for rent?",
    "Do you have drilling machines or electric tools?",
    "Show me available Power Banks & rates",
    "How does the ₹5 Lakhs damage protection work?",
    "How can I list my gear and earn passive income?",
  ];

  return (
    <>
      {/* Floating launcher button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full btn-gradient shadow-lg flex items-center justify-center text-white"
        aria-label="Payent Support Chatbot"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative"
            >
              <MessageSquare className="h-6 w-6" />
              <span className="absolute -top-1.5 -right-1.5 h-3 w-3 bg-rose-500 border border-white rounded-full animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-8rem)] rounded-2xl glass border border-border shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 btn-gradient text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-white/20 grid place-items-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-none flex items-center gap-1.5">
                    Payent AI Assistant
                    <Sparkles className="h-3 w-3 text-yellow-300 animate-pulse" />
                  </h4>
                  <span className="text-[11px] text-white/80">Support Online</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                aria-label="Minimize Chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Warning bar for platform limitations */}
            <div className="bg-amber-500/10 dark:bg-amber-500/5 border-b border-amber-500/10 px-3 py-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Answers are limited strictly to Payent rental topics.</span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50 scrollbar-thin">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      m.sender === "user"
                        ? "btn-gradient text-white rounded-tr-none"
                        : "bg-secondary/70 border border-border text-foreground rounded-tl-none whitespace-pre-line"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-secondary/70 border border-border text-foreground rounded-2xl rounded-tl-none px-4 py-2.5 flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />

              {/* Suggestions */}
              {messages.length === 1 && (
                <div className="pt-2 space-y-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Suggested Questions
                  </span>
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      className="w-full text-left p-2.5 text-xs rounded-xl bg-card border border-border hover:border-primary hover:bg-secondary transition-colors font-medium text-foreground/80 hover:text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="p-3 border-t border-border bg-card flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Payent rentals..."
                className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isTyping}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
