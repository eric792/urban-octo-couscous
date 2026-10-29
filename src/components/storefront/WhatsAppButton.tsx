import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { whatsappLink } from "@/lib/utils";

export function WhatsAppButton({ number }: { number: string | null }) {
  if (!number) return null;
  return (
    <a
      href={whatsappLink(number, "Hi Zen Amour, I have a question about ")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat to us on WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-black/40 transition hover:scale-105"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
