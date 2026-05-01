import { buildWhatsappUrl, settings as defaultSettings } from "@/data/herbalShop";

export function FloatingWhatsapp({ settings = defaultSettings }: { settings?: typeof defaultSettings }) {
  return (
    <a href={buildWhatsappUrl("تواصل عام", settings)} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-whatsapp transition-transform hover:scale-110 active:scale-95 animate-float" aria-label="تواصل عبر واتساب">
      <span className="absolute inset-0 rounded-full bg-whatsapp animate-ping-soft" />
      <svg viewBox="0 0 32 32" className="relative h-7 w-7 fill-current">
        <path d="M16 .396C7.164.396 0 7.56 0 16.396c0 2.876.756 5.683 2.193 8.157L.043 31.604l7.218-2.115a15.93 15.93 0 008.74 2.516h.003c8.836 0 16-7.164 16-16C31.999 7.561 24.835.397 16 .397zm0 29.291a13.31 13.31 0 01-7.22-2.108l-.518-.327-4.286 1.256 1.276-4.182-.337-.529A13.222 13.222 0 012.667 16.396c0-7.348 5.978-13.326 13.333-13.326s13.333 5.978 13.333 13.326c0 7.355-5.978 13.291-13.333 13.291zm7.328-9.961c-.401-.2-2.366-1.167-2.733-1.301-.367-.134-.634-.2-.901.2-.267.401-1.034 1.301-1.268 1.568-.234.267-.467.301-.868.1-.401-.2-1.694-.624-3.226-1.99-1.193-1.064-1.999-2.378-2.233-2.779-.234-.401-.025-.618.176-.818.18-.179.401-.467.601-.701.2-.234.267-.401.401-.668.134-.267.067-.501-.033-.701-.1-.2-.901-2.17-1.235-2.971-.325-.781-.656-.675-.901-.688l-.768-.014c-.267 0-.701.1-1.068.501-.367.401-1.402 1.369-1.402 3.339 0 1.97 1.435 3.873 1.635 4.14.2.267 2.824 4.312 6.842 6.047.956.413 1.702.66 2.284.845.96.305 1.834.262 2.525.159.77-.115 2.366-.968 2.7-1.903.334-.935.334-1.736.234-1.903-.1-.167-.367-.267-.768-.467z" />
      </svg>
    </a>
  );
}
