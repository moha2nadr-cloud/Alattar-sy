import { useRef, type CSSProperties, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MapPin, User } from "lucide-react";
import { settings as defaultSettings } from "@/data/herbalShop";
import { FloatingWhatsapp } from "./FloatingWhatsapp";
import { WavyDivider } from "./WavyDivider";
import { Footer } from "./Footer";

type SiteShellProps = {
  children: ReactNode;
  settings?: typeof defaultSettings;
  bare?: boolean;
};

function hexToHsl(hex: string) {
  const value = hex.replace("#", "");
  if (value.length !== 6) return undefined;
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function SiteShell({ children, settings = defaultSettings, bare = false }: SiteShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const clickCount = useRef(0);
  const resetTimer = useRef<number | null>(null);
  const headerTitle = settings.siteName.includes("مركز") ? settings.siteName : `مركز ${settings.siteName}`;

  const handleTitleClick = () => {
    if (resetTimer.current) {
      window.clearTimeout(resetTimer.current);
    }
    clickCount.current += 1;
    resetTimer.current = window.setTimeout(() => {
      clickCount.current = 0;
    }, 1800);

    if (clickCount.current >= 5) {
      clickCount.current = 0;
      navigate("/admin");
    }
  };

  return (
    <div
      dir="rtl"
      lang="ar"
      className="relative flex min-h-screen flex-col overflow-hidden bg-background font-arabic text-foreground"
      style={{
        "--primary": hexToHsl(settings.primaryColor),
        "--background": hexToHsl(settings.backgroundColor),
        "--accent": hexToHsl(settings.priceColor),
        fontFamily: `${settings.fontFamily}, Tajawal, system-ui, sans-serif`,
      } as CSSProperties}
    >
      {!bare && settings.showTopWave && <WavyDivider angle={settings.waveAngle} />}
      {!bare && (
        <header className="relative z-10 px-5 pb-5 pt-7 animate-fade-in">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 text-center">
            <button type="button" onClick={handleTitleClick} className="inline-block rounded-2xl bg-primary px-6 py-3 text-2xl font-extrabold tracking-normal text-primary-foreground shadow-card-soft transition-transform hover:scale-[1.04] md:text-4xl" aria-label="عنوان الموقع">
              {headerTitle}
            </button>
            <div className="flex w-full max-w-5xl items-center justify-center gap-4">
              <span className="h-px flex-1 bg-primary/35" aria-hidden />
              <Link to="/" className="max-w-[78vw] text-lg font-extrabold leading-8 text-primary/90 transition-colors hover:text-primary md:text-3xl">
                {settings.welcomeText}
              </Link>
              <span className="h-px flex-1 bg-primary/35" aria-hidden />
            </div>
            <div className="flex flex-col items-center gap-2 text-sm font-medium text-primary/75 sm:flex-row sm:gap-4">
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{settings.address}</span>
              <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" />{settings.manager}</span>
            </div>
          </div>
        </header>
      )}

      <main className="relative z-10 flex-1">{children}</main>
      {!bare && <Footer settings={settings} />}
      {!bare && location.pathname === "/" && settings.showFloatingWhatsapp && <FloatingWhatsapp settings={settings} />}
    </div>
  );
}
