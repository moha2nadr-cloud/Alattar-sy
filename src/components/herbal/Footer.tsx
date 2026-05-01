import { Instagram, Mail, MapPin, Phone, Facebook } from "lucide-react";
import { settings as defaultSettings } from "@/data/herbalShop";

export function Footer({ settings = defaultSettings }: { settings?: typeof defaultSettings }) {
  return (
    <footer className="relative z-10 mt-20 border-t border-primary/15 px-6 py-10 text-primary">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
        <div>
          <h3 className="mb-2 text-lg font-bold">{settings.siteName}</h3>
          <p className="text-sm text-primary/80">{settings.footerText}</p>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /><span>{settings.footerAddress}</span></div>
          <div className="flex items-center gap-2"><Phone className="h-4 w-4" /><span dir="ltr">{settings.footerPhone}</span></div>
          <div className="flex items-center gap-2"><Mail className="h-4 w-4" /><a href={`mailto:${settings.footerEmail}`} dir="ltr">{settings.footerEmail}</a></div>
        </div>
        <div className="flex flex-col gap-3 text-sm text-primary/70">
          <span>© {new Date().getFullYear()} {settings.siteName}</span>
          <div className="flex gap-3">
            {settings.instagramUrl && <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram className="h-5 w-5" /></a>}
            {settings.facebookUrl && <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook className="h-5 w-5" /></a>}
          </div>
        </div>
      </div>
    </footer>
  );
}
