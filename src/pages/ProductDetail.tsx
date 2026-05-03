import { Link, useParams } from "react-router-dom";
import { ArrowRight, Image as ImageIcon, Share2 } from "lucide-react";
import { SiteShell } from "@/components/herbal/SiteShell";
import { Button } from "@/components/ui/button";
import { availabilityLabels, buildWhatsappUrl } from "@/data/herbalShop";
import { useShopConfig } from "@/hooks/useShopConfig";
import { Image as ImageIcon } from "lucide-react";

const availabilityClasses: Record<string, string> = {
  available: "bg-green-500/15 text-green-700 border-green-500/30",
  limited: "bg-yellow-400/20 text-yellow-700 border-yellow-500/30",
  unavailable: "bg-red-500/15 text-red-700 border-red-500/30",
};

export default function ProductDetail() {
  const { id } = useParams();
  const { config, loaded } = useShopConfig();
  const { products, settings, categories } = config;
  const product = products.find((p) => p.id === id);
  const suggested = products.filter((p) => p.published && p.id !== id && p.categoryId === product?.categoryId).slice(0, 4);

  if (!loaded) {
    return (
      <SiteShell settings={settings}>
        <div className="mx-auto max-w-5xl px-5 pb-16 pt-2">
          <div className="h-6 w-32 rounded-xl bg-primary/10 animate-pulse mb-6" />
          <div className="grid gap-6 rounded-[1.5rem] border border-primary/10 bg-white p-5 md:grid-cols-2">
            <div className="aspect-square w-full rounded-2xl bg-primary/10 animate-pulse" />
            <div className="flex flex-col gap-4">
              <div className="h-5 w-24 rounded-xl bg-primary/10 animate-pulse" />
              <div className="h-10 w-3/4 rounded-xl bg-primary/10 animate-pulse" />
              <div className="h-4 w-1/2 rounded-xl bg-primary/10 animate-pulse" />
              <div className="space-y-2 mt-2">
                <div className="h-3 w-full rounded-xl bg-primary/10 animate-pulse" />
                <div className="h-3 w-full rounded-xl bg-primary/10 animate-pulse" />
                <div className="h-3 w-2/3 rounded-xl bg-primary/10 animate-pulse" />
              </div>
              <div className="h-12 w-full rounded-2xl bg-primary/10 animate-pulse mt-4" />
            </div>
          </div>
        </div>
      </SiteShell>
    );
  }

  if (!product) {
    return (
      <SiteShell settings={settings}>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-primary">المنتج غير موجود</h1>
          <Button asChild className="mt-6"><Link to="/">العودة للرئيسية</Link></Button>
        </div>
      </SiteShell>
    );
  }

  const availability = product.availability ?? "available";
  const categoryName = categories.find((c) => c.id === product.categoryId)?.name;

  const handleShare = async () => {
    const url = window.location.href;
    const text = `${product.name} - ${settings.siteName}`;
    if (navigator.share) {
      await navigator.share({ title: text, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert("تم نسخ رابط المنتج");
    }
  };

  return (
    <SiteShell settings={settings}>
      <div className="mx-auto max-w-5xl px-5 pb-16 pt-2">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary/80 hover:text-primary">
          <ArrowRight className="h-4 w-4" /> العودة للأصناف
        </Link>
        <article className="grid gap-6 rounded-[1.5rem] border border-primary/15 bg-card p-5 shadow-card-soft md:grid-cols-2 md:p-8">
          <div className="aspect-square w-full overflow-hidden rounded-2xl bg-primary/10">
            {product.imageData ? (
              <img loading="lazy" decoding="async" src={product.imageData} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-primary/40"><ImageIcon className="h-16 w-16" /></div>
            )}
          </div>
          <div className="flex flex-col gap-4 text-primary">
            <div className="flex items-center justify-between">
              <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-semibold ${availabilityClasses[availability]}`}>
                {availabilityLabels[availability]}
              </span>
              <button type="button" onClick={handleShare} className="flex items-center gap-2 rounded-xl border border-primary/20 px-3 py-1.5 text-sm text-primary/70 hover:bg-primary/5 transition-all">
                <Share2 className="h-4 w-4" />
                مشاركة
              </button>
            </div>
            <h1 className="text-3xl font-extrabold leading-tight">{product.name}</h1>
            {categoryName && <p className="text-sm text-primary/65">التصنيف: {categoryName}</p>}
            {(product.price || product.weight) && (
              <p className="text-xl font-bold text-accent">{product.price} {product.weight && `— ${product.weight}`}</p>
            )}
            {product.description && (
              <div className="text-base text-primary/80" style={{lineHeight: "2"}} dangerouslySetInnerHTML={{__html: product.description.replace(/\r?\n/g, "<br />")}} />
            )}
            {product.note && <p className="rounded-xl bg-primary/5 p-3 text-sm leading-7 text-primary/75">{product.note}</p>}
            <Button asChild size="lg" className="mt-2 w-full md:w-fit" disabled={availability === "unavailable"}>
              <a href={buildWhatsappUrl(product.name, settings)} target="_blank" rel="noopener noreferrer">{settings.whatsappButtonText}</a>
            </Button>
          </div>
        </article>
      </div>

      {/* منتجات مقترحة */}
      {suggested.length > 0 && (
        <div className="mx-auto max-w-5xl px-5 pb-16 mt-2">
          <h2 className="text-xl font-bold text-primary mb-4">منتجات من نفس التصنيف</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {suggested.map((p) => (
              <Link to={`/product/${p.id}`} key={p.id} className="block overflow-hidden rounded-[1rem] border border-primary/15 shadow-card-soft transition-all hover:-translate-y-1" style={{background:"#ffffff"}}>
                <div className="aspect-square w-full overflow-hidden bg-primary/10 flex items-center justify-center">
                  {p.imageData ? <img loading="lazy" decoding="async" src={p.imageData} alt={p.name} className="h-full w-full object-cover" /> : <ImageIcon className="h-8 w-8 text-primary/30" />}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-bold text-primary leading-tight line-clamp-2">{p.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </SiteShell>
  );
}
