import { Link, useParams } from "react-router-dom";
import { ArrowRight, Image as ImageIcon } from "lucide-react";
import { SiteShell } from "@/components/herbal/SiteShell";
import { Button } from "@/components/ui/button";
import { availabilityLabels, buildWhatsappUrl } from "@/data/herbalShop";
import { useShopConfig } from "@/hooks/useShopConfig";

const availabilityClasses: Record<string, string> = {
  available: "bg-green-500/15 text-green-700 border-green-500/30",
  limited: "bg-yellow-400/20 text-yellow-700 border-yellow-500/30",
  unavailable: "bg-red-500/15 text-red-700 border-red-500/30",
};

export default function ProductDetail() {
  const { id } = useParams();
  const { config } = useShopConfig();
  const { products, settings, categories } = config;
  const product = products.find((p) => p.id === id);

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
            <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-semibold ${availabilityClasses[availability]}`}>
              {availabilityLabels[availability]}
            </span>
            <h1 className="text-3xl font-extrabold leading-tight">{product.name}</h1>
            {categoryName && <p className="text-sm text-primary/65">التصنيف: {categoryName}</p>}
            {(product.price || product.weight) && (
              <p className="text-xl font-bold text-accent">{product.price} {product.weight && `— ${product.weight}`}</p>
            )}
            {product.description && <p className="text-base leading-8 text-primary/80">{product.description}</p>}
            {product.note && <p className="rounded-xl bg-primary/5 p-3 text-sm leading-7 text-primary/75">{product.note}</p>}
            <Button asChild size="lg" className="mt-2 w-full md:w-fit" disabled={availability === "unavailable"}>
              <a href={buildWhatsappUrl(product.name, settings)} target="_blank" rel="noopener noreferrer">{settings.whatsappButtonText}</a>
            </Button>
          </div>
        </article>
      </div>
    </SiteShell>
  );
}
