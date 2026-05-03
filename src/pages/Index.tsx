import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, Search, X, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import { SiteShell } from "@/components/herbal/SiteShell";
import { availabilityLabels } from "@/data/herbalShop";
import { useShopConfig } from "@/hooks/useShopConfig";

const gridCols: Record<string, string> = {
  "2": "grid-cols-2",
  "3": "grid-cols-2 md:grid-cols-3",
  "4": "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  "5": "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  "6": "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
};

const availabilityClasses: Record<string, string> = {
  available: "bg-green-500/15 text-green-700 border-green-500/30",
  limited: "bg-yellow-400/20 text-yellow-700 border-yellow-500/30",
  unavailable: "bg-red-500/15 text-red-700 border-red-500/30",
};

export default function Index() {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [availFilter, setAvailFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("default");
  const [showFilter, setShowFilter] = useState(false);
  const { config, loaded } = useShopConfig();
  const { categories, products, slides, settings, productDisplayMode } = config;
  const publishedProducts = products.filter((product) => product.published);
  const visibleSlides = slides.filter((slide) => slide.published && slide.imageData);

  const filtered = useMemo(() => {
    let list = publishedProducts.filter((p) => {
      const matchCat = !activeCat || p.categoryId === activeCat;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q);
      const matchAvail = availFilter === "all" || (p.availability ?? "available") === availFilter;
      return matchCat && matchSearch && matchAvail;
    });
    if (sortOrder === "alpha") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "ar"));
    if (sortOrder === "alpha-desc") list = [...list].sort((a, b) => b.name.localeCompare(a.name, "ar"));
    return list;
  }, [activeCat, publishedProducts, searchQuery, availFilter, sortOrder]);

  const productLayoutClass = productDisplayMode === "list" ? "grid grid-cols-1 gap-3" : productDisplayMode === "compact" ? "grid grid-cols-2 gap-2 md:grid-cols-5" : `grid gap-4 md:gap-5 ${gridCols[settings.desktopProductsPerRow] ?? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}`;
  const intervalMs = Math.max(1000, Number(settings.sliderInterval) || 3000);
  const transition = settings.sliderTransition ?? "fade";

  useEffect(() => {
    if (visibleSlides.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % visibleSlides.length);
    }, intervalMs);
    return () => window.clearInterval(interval);
  }, [visibleSlides.length, intervalMs]);

  return (
    <SiteShell settings={settings}>
      <div className="mx-auto max-w-6xl px-6 pb-16">
        <div className="botanical-sprig botanical-sprig-left" aria-hidden />
        <div className="botanical-sprig botanical-sprig-right" aria-hidden />

        {settings.showSlider && (
          <section className="mt-3 overflow-hidden rounded-[1.5rem] border border-primary/15 bg-primary/5 shadow-card-soft animate-scale-in">
            {visibleSlides.length ? (
              <div className="relative aspect-video overflow-hidden">
                {visibleSlides.map((slide, index) => {
                  const isActive = index === activeSlide;
                  const baseClass = "absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-in-out";
                  let dynamicClass = "";
                  if (transition === "fade") dynamicClass = isActive ? "opacity-100" : "opacity-0";
                  else if (transition === "slide") dynamicClass = isActive ? "translate-x-0 opacity-100" : "translate-x-full opacity-0";
                  else dynamicClass = isActive ? "scale-100 opacity-100" : "scale-110 opacity-0";
                  return <img loading="lazy" decoding="async" key={slide.id} src={slide.imageData} alt="" className={`${baseClass} ${dynamicClass}`} />;
                })}
                <div className="absolute inset-0 bg-primary pointer-events-none" style={{ opacity: Number(settings.slideOverlayOpacity || 0) / 100 }} />
              </div>
            ) : (
              <div className="aspect-video bg-primary/5" aria-label="السلايدر" />
            )}
          </section>
        )}

        {loaded && settings.aboutText && (
          <section className="mt-10 text-center text-primary animate-fade-up">
            <h2 className="text-xl font-extrabold">{settings.aboutTitle}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-primary/75">{settings.aboutText}</p>
          </section>
        )}
        {!loaded && (
          <section className="mt-10 text-center text-primary animate-fade-up">
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-primary/75">إذا لم تظهر المنتجات، قم بتحديث الصفحة — الانترنت الخاص بك ضعيف</p>
          </section>
        )}

        {/* شريط البحث + أيقونة الفلتر */}
        <section className="mt-10 animate-fade-up" style={{position:"relative", zIndex: 100}}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/50 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن منتج..."
                dir="rtl"
                className="w-full rounded-2xl border border-primary/20 bg-primary/5 py-3 pr-12 pl-10 text-sm text-primary placeholder:text-primary/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowFilter((v) => !v)}
                className={`rounded-2xl border px-4 py-3 flex items-center gap-2 text-sm font-semibold transition-all ${showFilter || availFilter !== "all" || sortOrder !== "default" ? "bg-primary text-white border-primary" : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"}`}
              >
                <ArrowUpDown className="h-4 w-4" />
                تصفية
              </button>
              {showFilter && (
                <>
                  <div className="fixed inset-0" style={{zIndex:98}} onClick={() => setShowFilter(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-primary/15 shadow-2xl p-4" dir="rtl" style={{background:"#ffffff", zIndex:99}}>
                    <p className="text-xs font-bold text-primary/50 mb-2">حسب التوفر</p>
                    <div className="flex flex-col gap-1 mb-4">
                      {[["all","الكل"],["available","متوفر فقط"],["limited","كمية محدودة"]].map(([val, label]) => (
                        <button key={val} type="button" onClick={() => { setAvailFilter(val); setShowFilter(false); }}
                          className={`rounded-xl px-3 py-2.5 text-sm text-right font-medium transition-all ${availFilter === val ? "bg-primary text-white" : "text-primary hover:bg-primary/10"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs font-bold text-primary/50 mb-2">الترتيب</p>
                    <div className="flex flex-col gap-1 mb-4">
                      {[["default","الافتراضي"],["alpha","أ — ي"],["alpha-desc","ي — أ"]].map(([val, label]) => (
                        <button key={val} type="button" onClick={() => { setSortOrder(val); setShowFilter(false); }}
                          className={`rounded-xl px-3 py-2.5 text-sm text-right font-medium transition-all ${sortOrder === val ? "bg-primary text-white" : "text-primary hover:bg-primary/10"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => setShowFilter(false)}
                      className="w-full rounded-xl bg-primary py-2 text-sm font-bold text-white">
                      تم
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>



        {settings.showCategoriesSection && (
          <section className="mt-6 animate-fade-up">
            <h2 className="mb-5 text-2xl font-bold text-primary">{settings.categoriesTitle}</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button type="button" onClick={() => setActiveCat(null)} className="shrink-0 rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary/10 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground" data-active={activeCat === null}>
                الكل <span className="mr-1 opacity-60">({publishedProducts.length})</span>
              </button>
              {categories.map((category) => {
                const count = publishedProducts.filter((p) => p.categoryId === category.id).length;
                if (count === 0) return null;
                return (
                  <button key={category.id} type="button" onClick={() => setActiveCat(category.id)} className="shrink-0 rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary/10 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground" data-active={activeCat === category.id}>
                    {category.name} <span className="mr-1 opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="mb-6 text-2xl font-bold text-primary">{settings.productsTitle}</h2>
          {filtered.length === 0 ? (
            <div className="rounded-[1.5rem] border-2 border-dashed border-primary/20 px-6 py-12 text-center text-lg text-primary">
              {searchQuery ? `لا توجد نتائج لـ "${searchQuery}"` : "قم بتحديث الصفحة — الانترنت الخاص بك ضعيف"}
            </div>
          ) : (
            <div className={productLayoutClass}>
              {filtered.map((product) => {
                const availability = product.availability ?? "available";
                return (
                  <Link to={`/product/${product.id}`} key={product.id} className="group block overflow-hidden rounded-[1rem] border border-primary/15 shadow-card-soft transition-all hover:-translate-y-1 hover:shadow-card-hover data-[mode=list]:flex data-[mode=list]:items-center" style={{background:"#ffffff", isolation:"isolate"}} data-mode={productDisplayMode}>
                    <div className="flex aspect-[4/3] w-full items-center justify-center bg-primary/10 text-primary data-[mode=list]:h-24 data-[mode=list]:w-28 data-[mode=list]:shrink-0 data-[mode=compact]:hidden" data-mode={productDisplayMode}>
                      {product.imageData ? <img loading="lazy" decoding="async" src={product.imageData} alt={product.name} className="h-full w-full object-cover" /> : <ImageIcon className="h-8 w-8 opacity-40" />}
                    </div>
                    <div className="p-4 text-primary">
                      <h3 className="text-lg font-bold leading-tight">{product.name}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-primary/70">{product.description}</p>
                      {(product.price || product.weight) && <p className="mt-2 text-sm font-bold text-accent">{product.price} {product.weight && `— ${product.weight}`}</p>}
                      <span className={`mt-3 inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-bold backdrop-blur-sm data-[mode=compact]:hidden ${availabilityClasses[availability]}`} data-mode={productDisplayMode}>
                        {availabilityLabels[availability]}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* زر العودة للأعلى */}
    </SiteShell>
  );
}
