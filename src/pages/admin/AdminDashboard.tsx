import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle, EyeOff, Image as ImageIcon, LayoutDashboard, List, Lock, LogOut, Package, Plus, Save, Settings, Tags, Trash2, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { SiteShell } from "@/components/herbal/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { defaultShopConfig, type Category, type Product, type ProductAvailability, type ProductCardStyle, type ProductDisplayMode, type ShopConfig, type Slide, type SliderTransition } from "@/data/herbalShop";
import { useShopConfig } from "@/hooks/useShopConfig";
import { uploadImage } from "@/lib/uploadImage";

const ADMIN_PASSWORD_HASH = "d51c0be63dd8b26280ed70b96a8bc029a8bc0f93bad87c70db36ea5397c92d7b";
const ADMIN_AUTH_KEY = "herbal-admin-authenticated";

type AdminSection = "dashboard" | "products" | "categories" | "slides" | "settings";
type SettingsKey = keyof ShopConfig["settings"];

const nav: { id: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "لوحة المعلومات", icon: LayoutDashboard },
  { id: "products", label: "المنتجات", icon: Package },
  { id: "categories", label: "التصنيفات", icon: Tags },
  { id: "slides", label: "السلايدر", icon: ImageIcon },
  { id: "settings", label: "الإعدادات", icon: Settings },
];

const fonts = ["Tajawal", "Cairo", "Amiri", "Noto Kufi Arabic", "Noto Naskh Arabic", "Readex Pro", "Almarai", "El Messiri"];
const displayModes: { value: ProductDisplayMode; label: string }[] = [
  { value: "grid", label: "شبكة" },
  { value: "list", label: "قائمة" },
  { value: "compact", label: "مختصر" },
];
const cardStyles: { value: ProductCardStyle; label: string }[] = [
  { value: "classic", label: "كلاسيكي" },
  { value: "simple", label: "بسيط" },
  { value: "image-first", label: "صورة أولاً" },
];
const availabilityOptions: { value: ProductAvailability; label: string }[] = [
  { value: "available", label: "متوفر" },
  { value: "limited", label: "كمية محدودة" },
  { value: "unavailable", label: "غير متوفر" },
];
const sliderTransitions: { value: SliderTransition; label: string }[] = [
  { value: "fade", label: "تلاشي (Fade)" },
  { value: "slide", label: "انزلاق (Slide)" },
  { value: "zoom", label: "تكبير (Zoom)" },
];

async function sha256(value: string) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-") || `category-${Date.now()}`;
}

function StatCard({ label, value, Icon }: { label: string; value: number; Icon: typeof Package }) {
  return (
    <div className="rounded-[1.25rem] border border-primary/15 bg-card p-5 shadow-card-soft">
      <div className="flex items-center justify-between text-primary">
        <p className="text-sm text-primary/70">{label}</p>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-2 text-3xl font-extrabold text-primary">{value}</p>
    </div>
  );
}

function Field({ label, value, onChange, multiline, type = "text" }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; type?: string }) {
  return (
    <label className="space-y-2 text-sm font-semibold text-primary">
      <span>{label}</span>
      {multiline ? (
        <Textarea value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && e.shiftKey) { e.stopPropagation(); } }} className="border-primary/20 text-primary" />
      ) : (
        <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="border-primary/20 text-primary" />
      )}
    </label>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-primary/15 p-3 text-sm font-semibold text-primary">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const copy = [...items];
  [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
  return copy;
}

// ============================================================================
//  New Product Dialog (modal popup with Next/Publish workflow)
// ============================================================================
type NewProductStep = 1 | 2;

function NewProductDialog({ open, onOpenChange, categories, onSubmit }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSubmit: (product: Product, publish: boolean) => Promise<void>;
}) {
  const [step, setStep] = useState<NewProductStep>(1);
  const [product, setProduct] = useState<Product>(() => ({
    id: `product-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: "",
    categoryId: "uncategorized",
    description: "",
    price: "",
    weight: "",
    note: "",
    imageData: "",
    published: false,
    availability: "available",
  }));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setProduct({
        id: `product-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: "",
        categoryId: "uncategorized",
        description: "",
        price: "",
        weight: "",
        note: "",
        imageData: "",
        published: false,
        availability: "available",
      });
    }
  }, [open]);

  const update = (changes: Partial<Product>) => setProduct((p) => ({ ...p, ...changes }));

  const handleNext = () => {
    if (!product.name.trim()) {
      toast({ title: "أدخل اسم المنتج أولاً", variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleFinish = async (publish: boolean) => {
    setSubmitting(true);
    try {
      await onSubmit({ ...product, published: publish }, publish);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-primary">{step === 1 ? "منتج جديد — الخطوة 1 من 2" : "منتج جديد — الخطوة 2 من 2"}</DialogTitle>
          <DialogDescription>{step === 1 ? "أدخل البيانات الأساسية" : "أكمل التفاصيل ثم اضغط نشر أو حفظ كمسودة"}</DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="grid gap-3">
            <Field label="اسم المنتج *" value={product.name} onChange={(v) => update({ name: v })} />
            <label className="space-y-2 text-sm font-semibold text-primary">
              <span>التصنيف</span>
              <Select value={product.categoryId} onValueChange={(v) => update({ categoryId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="uncategorized">بدون تصنيف</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </label>
            <label className="space-y-2 text-sm font-semibold text-primary">
              <span>صورة المنتج</span>
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) update({ imageData: await uploadImage(file) });
                }}
              />
              {product.imageData && (
                <img loading="lazy" decoding="async" src={product.imageData} alt="" className="mt-2 h-32 w-32 rounded-xl object-cover" />
              )}
            </label>
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="السعر" value={product.price ?? ""} onChange={(v) => update({ price: v })} />
              <Field label="الوزن / الحجم" value={product.weight ?? ""} onChange={(v) => update({ weight: v })} />
            </div>
            <Field label="ملاحظات" value={product.note ?? ""} onChange={(v) => update({ note: v })} />
            <Field label="الوصف" value={product.description} onChange={(v) => update({ description: v })} multiline />
            <label className="space-y-2 text-sm font-semibold text-primary">
              <span>حالة التوفر</span>
              <Select value={product.availability ?? "available"} onValueChange={(v) => update({ availability: v as ProductAvailability })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{availabilityOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </label>
          </div>
        )}

        <DialogFooter className="flex-row-reverse gap-2 sm:flex-row-reverse">
          {step === 1 ? (
            <>
              <Button type="button" onClick={handleNext}>التالي</Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            </>
          ) : (
            <>
              <Button type="button" disabled={submitting} onClick={() => handleFinish(true)}>نشر</Button>
              <Button type="button" variant="outline" disabled={submitting} onClick={() => handleFinish(false)}>حفظ كمسودة</Button>
              <Button type="button" variant="ghost" disabled={submitting} onClick={() => setStep(1)}>السابق</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
//  Bulk Upload Dialog
// ============================================================================
type BulkItem = { id: string; name: string; imageData: string; categoryId: string };

function BulkUploadDialog({ open, onOpenChange, categories, onSubmit }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSubmit: (products: Product[], publish: boolean) => Promise<void>;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [items, setItems] = useState<BulkItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setItems([]);
    }
  }, [open]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const uploaded = await Promise.all(
      Array.from(files).map(async (file, index) => ({
        id: `bulk-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
        name: file.name.replace(/\.[^.]+$/, ""),
        imageData: await uploadImage(file),
        categoryId: "uncategorized",
      })),
    );
    setItems((prev) => [...uploaded, ...prev]);
  };

  const updateItem = (id: string, changes: Partial<BulkItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...changes } : it)));

  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));

  const handleNext = () => {
    if (!items.length) {
      toast({ title: "ارفع صورة واحدة على الأقل", variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleFinish = async (publish: boolean) => {
    setSubmitting(true);
    try {
      const products: Product[] = items.map((it) => ({
        id: it.id,
        name: it.name || "منتج جديد",
        categoryId: it.categoryId,
        description: "",
        price: "",
        weight: "",
        note: "",
        imageData: it.imageData,
        published: publish,
        availability: "available",
      }));
      await onSubmit(products, publish);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-card sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-primary">{step === 1 ? "رفع جماعي — الخطوة 1 من 2" : "رفع جماعي — الخطوة 2 من 2"}</DialogTitle>
          <DialogDescription>{step === 1 ? "اختر الصور التي تريد إضافتها كمنتجات" : "حرّر اسم وتصنيف كل منتج قبل النشر"}</DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-3">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="border-primary/20"
            />
            {items.length > 0 && (
              <p className="text-sm font-semibold text-primary">{items.length} صورة جاهزة</p>
            )}
            <div className="grid grid-cols-3 gap-2">
              {items.map((it) => (
                <div key={it.id} className="relative">
                  <img loading="lazy" decoding="async" src={it.imageData} alt={it.name} className="aspect-square w-full rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-3 rounded-xl border border-primary/15 p-2">
                <img loading="lazy" decoding="async" src={it.imageData} alt={it.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                <div className="grid flex-1 grid-cols-2 gap-2">
                  <Input
                    value={it.name}
                    onChange={(e) => updateItem(it.id, { name: e.target.value })}
                    placeholder="اسم المنتج"
                    className="border-primary/20 text-sm text-primary"
                  />
                  <Select value={it.categoryId} onValueChange={(v) => updateItem(it.id, { categoryId: v })}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uncategorized">بدون تصنيف</SelectItem>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeItem(it.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="flex-row-reverse gap-2 sm:flex-row-reverse">
          {step === 1 ? (
            <>
              <Button type="button" onClick={handleNext} disabled={!items.length}>التالي</Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            </>
          ) : (
            <>
              <Button type="button" disabled={submitting} onClick={() => handleFinish(true)}>نشر الكل ({items.length})</Button>
              <Button type="button" variant="outline" disabled={submitting} onClick={() => handleFinish(false)}>حفظ كمسودة</Button>
              <Button type="button" variant="ghost" disabled={submitting} onClick={() => setStep(1)}>السابق</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
//  Admin Dashboard
// ============================================================================
export default function AdminDashboard() {
  const { config, saveConfig, resetConfig, refreshConfig, loaded } = useShopConfig();
  const [draft, setDraft] = useState<ShopConfig>(config);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    typeof window !== "undefined" && window.sessionStorage.getItem(ADMIN_AUTH_KEY) === "true"
  );

  // CRITICAL: keep draft in sync with cloud config (initial load + realtime updates).
  // Without this, the admin's stale draft can be saved over the cloud and wipe items
  // that were added on another device or while the admin tab was open.
  useEffect(() => {
    setDraft(config);
  }, [config]);

  const currentStats = useMemo(() => ({
    totalProducts: draft.products.length,
    publishedProducts: draft.products.filter((product) => product.published).length,
    unpublishedProducts: draft.products.filter((product) => !product.published).length,
    totalCategories: draft.categories.length,
    totalSlides: draft.slides.length,
  }), [draft]);

  const productsByCategory = useMemo(() => [
    { id: "uncategorized", name: "بدون تصنيف", count: draft.products.filter((product) => !draft.categories.some((category) => category.id === product.categoryId)).length },
    ...draft.categories.map((category) => ({ id: category.id, name: category.name, count: draft.products.filter((product) => product.categoryId === category.id).length })),
  ], [draft.categories, draft.products]);

  const updateSettings = (key: SettingsKey, value: ShopConfig["settings"][SettingsKey]) => {
    setDraft((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));
  };

  // Persist a structural mutation immediately, after first refreshing from the cloud
  // to avoid overwriting concurrent changes from the public site or other tabs.
  const persistMutation = async (mutate: (prev: ShopConfig) => ShopConfig) => {
    try {
      const latest = await refreshConfig();
      const next = mutate(latest);
      setDraft(next);
      await saveConfig(next);
    } catch (err) {
      console.error(err);
      toast({ title: "تعذّر الحفظ", description: "حدث خطأ أثناء المزامنة مع السحابة.", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    try {
      await saveConfig(draftRef.current);
      toast({ title: "تم حفظ التغييرات" });
    } catch {
      toast({ title: "تعذر الحفظ", description: "قد تكون الصور كثيرة جداً. جرّب تقليل حجم الصور.", variant: "destructive" });
    }
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    const hashedPassword = await sha256(password.trim());
    if (hashedPassword !== ADMIN_PASSWORD_HASH) {
      setPasswordError("كلمة السر غير صحيحة");
      return;
    }
    window.sessionStorage.setItem(ADMIN_AUTH_KEY, "true");
    setIsAuthenticated(true);
    setPasswordError("");
    setPassword("");
    // Pull the latest cloud config when opening admin
    refreshConfig().catch(() => undefined);
  };

  const handleLogout = () => {
    window.sessionStorage.removeItem(ADMIN_AUTH_KEY);
    setIsAuthenticated(false);
  };

  const handleAddProduct = async (product: Product, publish: boolean) => {
    await persistMutation((prev) => ({ ...prev, products: [product, ...prev.products] }));
    toast({ title: publish ? "تم نشر المنتج" : "تم حفظ المنتج كمسودة" });
  };

  const handleBulkSubmit = async (products: Product[], publish: boolean) => {
    await persistMutation((prev) => ({ ...prev, products: [...products, ...prev.products] }));
    toast({ title: `تم إضافة ${products.length} منتج`, description: publish ? "منشور" : "مسودة" });
  };

  const updateProduct = (id: string, changes: Partial<Product>) => setDraft((current) => ({ ...current, products: current.products.map((product) => product.id === id ? { ...product, ...changes } : product) }));
  const updateCategory = (id: string, changes: Partial<Category>) => setDraft((current) => ({ ...current, categories: current.categories.map((category) => category.id === id ? { ...category, ...changes } : category) }));
  const updateSlide = (id: string, changes: Partial<Slide>) => setDraft((current) => ({ ...current, slides: current.slides.map((slide) => slide.id === id ? { ...slide, ...changes } : slide) }));

  const renderDashboard = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">لوحة المعلومات</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="إجمالي المنتجات" value={currentStats.totalProducts} Icon={Package} />
        <StatCard label="منشورة" value={currentStats.publishedProducts} Icon={CheckCircle} />
        <StatCard label="غير منشورة" value={currentStats.unpublishedProducts} Icon={EyeOff} />
        <StatCard label="التصنيفات" value={currentStats.totalCategories} Icon={Tags} />
        <StatCard label="السلايدر" value={currentStats.totalSlides} Icon={ImageIcon} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[1.25rem] border border-primary/15 bg-card p-5 shadow-card-soft">
          <h2 className="mb-4 font-bold text-primary">توزيع المنتجات حسب التصنيف</h2>
          <div className="space-y-3">{productsByCategory.map((item) => <div key={item.id} className="flex justify-between rounded-xl bg-secondary px-4 py-3 text-sm text-primary"><span>{item.name}</span><b>{item.count}</b></div>)}</div>
        </div>
        <div className="rounded-[1.25rem] border border-primary/15 bg-card p-5 shadow-card-soft">
          <h2 className="mb-4 font-bold text-primary">أحدث المنتجات</h2>
          <div className="space-y-3">{draft.products.slice(0, 5).map((product) => <div key={product.id} className="rounded-xl bg-secondary px-4 py-3 text-sm text-primary"><b>{product.name}</b><p className="text-primary/65">{draft.categories.find((c) => c.id === product.categoryId)?.name ?? "بدون تصنيف"}</p></div>)}</div>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-primary">المنتجات</h1>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => setBulkOpen(true)}>
            <Upload className="ml-2 h-4 w-4" />رفع جماعي
          </Button>
          <Button type="button" onClick={() => setNewProductOpen(true)}>
            <Plus className="ml-2 h-4 w-4" />منتج جديد
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        {draft.products.map((product, index) => (
          <div key={product.id} className="rounded-[1.25rem] border border-primary/15 bg-card p-4 shadow-card-soft">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" onClick={() => persistMutation((c) => ({ ...c, products: moveItem(c.products, c.products.findIndex((p) => p.id === product.id), -1) }))}><ArrowUp className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => persistMutation((c) => ({ ...c, products: moveItem(c.products, c.products.findIndex((p) => p.id === product.id), 1) }))}><ArrowDown className="h-4 w-4" /></Button>
                </div>
                <div className="h-20 w-20 overflow-hidden rounded-xl bg-secondary">{product.imageData ? <img loading="lazy" decoding="async" src={product.imageData} alt={product.name} className="h-full w-full object-cover" /> : <ImageIcon className="m-6 h-8 w-8 text-primary/40" />}</div>
                <div><h2 className="font-bold text-primary">{product.name}</h2><p className="text-sm text-primary/60">{draft.categories.find((c) => c.id === product.categoryId)?.name ?? "بدون تصنيف"}</p></div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => persistMutation((c) => ({ ...c, products: c.products.filter((p) => p.id !== product.id) }))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="الاسم" value={product.name} onChange={(value) => updateProduct(product.id, { name: value })} />
              <label className="space-y-2 text-sm font-semibold text-primary"><span>التصنيف</span><Select value={product.categoryId} onValueChange={(value) => updateProduct(product.id, { categoryId: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="uncategorized">بدون تصنيف</SelectItem>{draft.categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select></label>
              <Field label="السعر" value={product.price ?? ""} onChange={(value) => updateProduct(product.id, { price: value })} />
              <Field label="الوزن / الحجم" value={product.weight ?? ""} onChange={(value) => updateProduct(product.id, { weight: value })} />
              <Field label="ملاحظات" value={product.note ?? ""} onChange={(value) => updateProduct(product.id, { note: value })} />
              <label className="space-y-2 text-sm font-semibold text-primary"><span>الصورة</span><Input type="file" accept="image/*" onChange={async (e) => e.target.files?.[0] && updateProduct(product.id, { imageData: await uploadImage(e.target.files[0]) })} /></label>
              <div className="md:col-span-2"><Field label="الوصف" value={product.description} onChange={(value) => updateProduct(product.id, { description: value })} multiline /></div>
              <label className="space-y-2 text-sm font-semibold text-primary"><span>حالة التوفر</span><Select value={product.availability ?? "available"} onValueChange={(value) => updateProduct(product.id, { availability: value as ProductAvailability })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{availabilityOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></label>
              <ToggleField label="منشور" checked={product.published} onChange={(value) => updateProduct(product.id, { published: value })} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCategories = () => (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-primary">التصنيفات</h1>
      <div className="flex gap-2 rounded-[1.25rem] border border-primary/15 bg-card p-4 shadow-card-soft">
        <Input placeholder="اسم تصنيف جديد" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
        <Button onClick={() => {
          if (!newCategoryName.trim()) return;
          const newCat: Category = { id: `cat-${Date.now()}`, name: newCategoryName, slug: slugify(newCategoryName), count: 0 };
          persistMutation((c) => ({ ...c, categories: [...c.categories, newCat] }));
          setNewCategoryName("");
        }}><Plus className="ml-2 h-4 w-4" />إضافة</Button>
      </div>
      {draft.categories.map((category, index) => (
        <div key={category.id} className="grid gap-3 rounded-[1.25rem] border border-primary/15 bg-card p-4 shadow-card-soft md:grid-cols-[1fr_1fr_auto]">
          <Field label="اسم التصنيف" value={category.name} onChange={(value) => updateCategory(category.id, { name: value })} />
          <Field label="الرابط" value={category.slug} onChange={(value) => updateCategory(category.id, { slug: value })} />
          <div className="flex items-end gap-1">
            <Button size="icon" variant="outline" onClick={() => persistMutation((c) => ({ ...c, categories: moveItem(c.categories, c.categories.findIndex((x) => x.id === category.id), -1) }))}><ArrowUp className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" onClick={() => persistMutation((c) => ({ ...c, categories: moveItem(c.categories, c.categories.findIndex((x) => x.id === category.id), 1) }))}><ArrowDown className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" onClick={() => persistMutation((c) => ({ ...c, categories: c.categories.filter((item) => item.id !== category.id) }))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSlides = () => (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-primary">سلايدر الصفحة الرئيسية</h1>
        <Button asChild>
          <label className="cursor-pointer">
            <Upload className="ml-2 h-4 w-4" />رفع صور
            <input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
              if (!e.target.files) return;
              const slides = await Promise.all(Array.from(e.target.files).map(async (file, index) => ({ id: `slide-${Date.now()}-${index}`, title: file.name.replace(/\.[^.]+$/, ""), imageData: await uploadImage(file), published: true })));
              persistMutation((c) => ({ ...c, slides: [...slides, ...c.slides] }));
            }} />
          </label>
        </Button>
      </div>
      <p className="text-sm text-primary/70">ارفع صوراً بنسبة 16:9 لتظهر في السلايدر.</p>
      {draft.slides.map((slide, index) => (
        <div key={slide.id} className="grid gap-3 rounded-[1.25rem] border border-primary/15 bg-card p-4 shadow-card-soft md:grid-cols-[160px_1fr_auto]">
          <div className="aspect-video overflow-hidden rounded-xl bg-secondary">{slide.imageData ? <img loading="lazy" decoding="async" src={slide.imageData} alt={slide.title} className="h-full w-full object-cover" /> : <ImageIcon className="m-8 h-8 w-8 text-primary/40" />}</div>
          <div className="space-y-3">
            <Field label="عنوان السلايد" value={slide.title} onChange={(value) => updateSlide(slide.id, { title: value })} />
            <ToggleField label="منشور" checked={slide.published} onChange={(value) => updateSlide(slide.id, { published: value })} />
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" onClick={() => persistMutation((c) => ({ ...c, slides: moveItem(c.slides, c.slides.findIndex((x) => x.id === slide.id), -1) }))}><ArrowUp className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" onClick={() => persistMutation((c) => ({ ...c, slides: moveItem(c.slides, c.slides.findIndex((x) => x.id === slide.id), 1) }))}><ArrowDown className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" onClick={() => persistMutation((c) => ({ ...c, slides: c.slides.filter((item) => item.id !== slide.id) }))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">الإعدادات</h1>
      <div className="rounded-[1.25rem] border border-primary/15 bg-card p-5 shadow-card-soft"><h2 className="mb-4 font-bold text-primary">الهوية والنصوص العامة</h2><div className="grid gap-4 md:grid-cols-2"><Field label="اسم الموقع" value={draft.settings.siteName} onChange={(v) => updateSettings("siteName", v)} /><Field label="شعار قصير (Tagline)" value={draft.settings.tagline} onChange={(v) => updateSettings("tagline", v)} /><Field label="عبارة الترحيب" value={draft.settings.welcomeText} onChange={(v) => updateSettings("welcomeText", v)} /><Field label="بإدارة" value={draft.settings.manager} onChange={(v) => updateSettings("manager", v)} /><Field label="العنوان" value={draft.settings.address} onChange={(v) => updateSettings("address", v)} multiline /><Field label="عنوان قسم من نحن" value={draft.settings.aboutTitle} onChange={(v) => updateSettings("aboutTitle", v)} /><div className="md:col-span-2"><Field label="نص قسم من نحن" value={draft.settings.aboutText} onChange={(v) => updateSettings("aboutText", v)} multiline /></div></div></div>
      <div className="rounded-[1.25rem] border border-primary/15 bg-card p-5 shadow-card-soft"><h2 className="mb-4 font-bold text-primary">إعدادات واتساب</h2><div className="grid gap-4 md:grid-cols-2"><Field label="رقم واتساب" value={draft.settings.whatsappNumber} onChange={(v) => updateSettings("whatsappNumber", v)} /><Field label="نص زر الطلب" value={draft.settings.whatsappButtonText} onChange={(v) => updateSettings("whatsappButtonText", v)} /><div className="md:col-span-2"><Field label="قالب الرسالة (استخدم {productName})" value={draft.settings.whatsappMessageTemplate} onChange={(v) => updateSettings("whatsappMessageTemplate", v)} multiline /></div><ToggleField label="إظهار زر واتساب العائم في الرئيسية" checked={draft.settings.showFloatingWhatsapp} onChange={(v) => updateSettings("showFloatingWhatsapp", v)} /></div></div>
      <div className="rounded-[1.25rem] border border-primary/15 bg-card p-5 shadow-card-soft"><h2 className="mb-4 font-bold text-primary">الألوان والخطوط</h2><div className="grid gap-4 md:grid-cols-2"><Field label="اللون الأساسي" type="color" value={draft.settings.primaryColor} onChange={(v) => updateSettings("primaryColor", v)} /><Field label="لون الخلفية" type="color" value={draft.settings.backgroundColor} onChange={(v) => updateSettings("backgroundColor", v)} /><Field label="لون التمييز (السعر)" type="color" value={draft.settings.priceColor} onChange={(v) => updateSettings("priceColor", v)} /><label className="space-y-2 text-sm font-semibold text-primary"><span>نوع الخط</span><Select value={draft.settings.fontFamily} onValueChange={(v) => updateSettings("fontFamily", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{fonts.map((font) => <SelectItem key={font} value={font}>{font}</SelectItem>)}</SelectContent></Select></label></div></div>
      <div className="rounded-[1.25rem] border border-primary/15 bg-card p-5 shadow-card-soft"><h2 className="mb-4 font-bold text-primary">السلايدر والتأثيرات</h2><div className="grid gap-4 md:grid-cols-2"><ToggleField label="إظهار السلايدر" checked={draft.settings.showSlider} onChange={(v) => updateSettings("showSlider", v)} /><Field label="مدة عرض كل صورة (مللي ثانية)" value={draft.settings.sliderInterval} onChange={(v) => updateSettings("sliderInterval", v)} /><label className="space-y-2 text-sm font-semibold text-primary"><span>طريقة التنقل بين الصور</span><Select value={draft.settings.sliderTransition ?? "fade"} onValueChange={(v) => updateSettings("sliderTransition", v as SliderTransition)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{sliderTransitions.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></label><Field label="شفافية تظليل السلايد (0-100)" value={draft.settings.slideOverlayOpacity} onChange={(v) => updateSettings("slideOverlayOpacity", v)} /><Field label="زاوية ميل الخط (درجات)" value={draft.settings.waveAngle} onChange={(v) => updateSettings("waveAngle", v)} /><ToggleField label="تأثيرات السكرول" checked={draft.settings.enableScrollEffects} onChange={(v) => updateSettings("enableScrollEffects", v)} /><ToggleField label="تأثيرات Blur" checked={draft.settings.enableBlurEffects} onChange={(v) => updateSettings("enableBlurEffects", v)} /><ToggleField label="إظهار الخط المتموج العلوي" checked={draft.settings.showTopWave} onChange={(v) => updateSettings("showTopWave", v)} /></div></div>
      <div className="rounded-[1.25rem] border border-primary/15 bg-card p-5 shadow-card-soft"><h2 className="mb-4 font-bold text-primary">عرض المنتجات</h2><div className="grid gap-4 md:grid-cols-2"><Field label="عدد المنتجات في الصف (سطح المكتب)" value={draft.settings.desktopProductsPerRow} onChange={(v) => updateSettings("desktopProductsPerRow", v)} /><label className="space-y-2 text-sm font-semibold text-primary"><span>نمط بطاقة المنتج</span><Select value={draft.settings.productCardStyle} onValueChange={(v) => updateSettings("productCardStyle", v as ProductCardStyle)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{cardStyles.map((style) => <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>)}</SelectContent></Select></label><label className="space-y-2 text-sm font-semibold text-primary"><span>شكل عرض الأصناف</span><Select value={draft.productDisplayMode} onValueChange={(v) => setDraft((c) => ({ ...c, productDisplayMode: v as ProductDisplayMode }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{displayModes.map((mode) => <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>)}</SelectContent></Select></label><ToggleField label="إظهار قسم التصنيفات" checked={draft.settings.showCategoriesSection} onChange={(v) => updateSettings("showCategoriesSection", v)} /><Field label="عنوان قسم التصنيفات" value={draft.settings.categoriesTitle} onChange={(v) => updateSettings("categoriesTitle", v)} /><Field label="عنوان قسم المنتجات" value={draft.settings.productsTitle} onChange={(v) => updateSettings("productsTitle", v)} /><div className="md:col-span-2"><Field label="رسالة لا توجد منتجات" value={draft.settings.emptyProductsMessage} onChange={(v) => updateSettings("emptyProductsMessage", v)} /></div></div></div>
      <div className="rounded-[1.25rem] border border-primary/15 bg-card p-5 shadow-card-soft"><h2 className="mb-4 font-bold text-primary">التذييل (الفوتر)</h2><div className="grid gap-4 md:grid-cols-2"><Field label="نص قصير" value={draft.settings.footerText} onChange={(v) => updateSettings("footerText", v)} multiline /><Field label="العنوان" value={draft.settings.footerAddress} onChange={(v) => updateSettings("footerAddress", v)} /><Field label="رقم الهاتف" value={draft.settings.footerPhone} onChange={(v) => updateSettings("footerPhone", v)} /><Field label="البريد الإلكتروني" value={draft.settings.footerEmail} onChange={(v) => updateSettings("footerEmail", v)} /><Field label="رابط Instagram" value={draft.settings.instagramUrl} onChange={(v) => updateSettings("instagramUrl", v)} /><Field label="رابط Facebook" value={draft.settings.facebookUrl} onChange={(v) => updateSettings("facebookUrl", v)} /></div></div>
    </div>
  );

  const renderSection = () => ({ dashboard: renderDashboard, products: renderProducts, categories: renderCategories, slides: renderSlides, settings: renderSettings }[activeSection]());

  if (!isAuthenticated) {
    return <SiteShell settings={draft.settings} bare><div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10"><form onSubmit={handleLogin} className="w-full rounded-[1.25rem] border border-primary/15 bg-card p-6 text-center shadow-card-soft"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary"><Lock className="h-6 w-6" /></div><h1 className="text-2xl font-extrabold text-primary">دخول لوحة التحكم</h1><label className="mt-6 block space-y-2 text-right text-sm font-semibold text-primary"><span>كلمة السر</span><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="border-primary/20 text-primary" autoFocus /></label>{passwordError && <p className="mt-3 text-sm font-semibold text-destructive">{passwordError}</p>}<Button type="submit" className="mt-5 w-full">دخول</Button><Link to="/" className="mt-4 block text-sm text-primary/70 hover:text-primary">العودة للموقع</Link></form></div></SiteShell>;
  }

  return (
    <SiteShell settings={draft.settings} bare>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <aside className="h-fit rounded-[1.25rem] border border-primary/15 bg-card p-4 shadow-card-soft md:sticky md:top-4">
            <p className="mb-4 text-xs font-semibold text-primary/60">الإدارة</p>
            <nav className="flex flex-col gap-1">
              {nav.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setActiveSection(id)} className="flex items-center gap-3 rounded-xl border-r-[3px] border-transparent px-4 py-2.5 text-right text-sm font-medium text-primary transition-all duration-300 data-[active=true]:border-primary data-[active=true]:bg-secondary data-[active=true]:translate-x-[-4px]" data-active={activeSection === id || undefined}><Icon className="h-4 w-4" />{label}</button>)}
              <button type="button" onClick={handleLogout} className="mt-3 flex items-center gap-3 rounded-xl px-4 py-2.5 text-right text-sm font-medium text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" /> تسجيل الخروج</button>
              <Link to="/" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-primary/70 hover:bg-secondary">العودة للموقع</Link>
            </nav>
          </aside>
          <section key={activeSection} className="animate-fade-up pb-24">{renderSection()}</section>
        </div>
      </div>
      <div className="fixed bottom-4 left-4 z-50 flex gap-2 rounded-2xl border border-primary/15 bg-card p-2 shadow-card-soft">
        <Button type="button" onClick={handleSave}><Save className="ml-2 h-4 w-4" />حفظ التغييرات</Button>
        <Button type="button" variant="outline" onClick={() => setResetConfirmOpen(true)}>إعادة ضبط</Button>
      </div>

      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent className="bg-card sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary">تأكيد إعادة الضبط</DialogTitle>
            <DialogDescription>سيتم حذف جميع البيانات والمنتجات والإعدادات بشكل نهائي. هل أنت متأكد؟</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row-reverse gap-2 sm:flex-row-reverse">
            <Button type="button" variant="destructive" onClick={async () => { await resetConfig(); setResetConfirmOpen(false); toast({ title: "تم إعادة الضبط" }); }}>نعم، إعادة الضبط</Button>
            <Button type="button" variant="outline" onClick={() => setResetConfirmOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NewProductDialog
        open={newProductOpen}
        onOpenChange={setNewProductOpen}
        categories={draft.categories}
        onSubmit={handleAddProduct}
      />
      <BulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        categories={draft.categories}
        onSubmit={handleBulkSubmit}
      />
    </SiteShell>
  );
}
