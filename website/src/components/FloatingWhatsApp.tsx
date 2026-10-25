import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { business } from "@/lib/business";
import "@/floating-whatsapp.css";

export function FloatingWhatsApp() {
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const welcome = (event: Event) => {
      setWelcomeOpen(Boolean((event as CustomEvent<{ open: boolean }>).detail?.open));
    };
    const chat = (event: Event) => {
      setChatOpen(Boolean((event as CustomEvent<{ open: boolean }>).detail?.open));
    };
    window.addEventListener("luxe:welcome-visibility", welcome);
    window.addEventListener("luxe:chat-visibility", chat);
    return () => {
      window.removeEventListener("luxe:welcome-visibility", welcome);
      window.removeEventListener("luxe:chat-visibility", chat);
    };
  }, []);

  if (welcomeOpen || chatOpen) return null;
  return (
    <a
      className="luxe-whatsapp-float"
      href={business.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with LuxeInfra on WhatsApp (opens in a new tab)"
    >
      <MessageCircle size={23} aria-hidden="true" />
      <span>WhatsApp</span>
    </a>
  );
}
