export type Category = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

export type ProductAvailability = "available" | "limited" | "unavailable";

export type Product = {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  price?: string;
  weight?: string;
  note?: string;
  imageData?: string;
  published: boolean;
  availability?: ProductAvailability;
};

export type Slide = {
  id: string;
  title: string;
  imageData?: string;
  published: boolean;
};

export type ProductDisplayMode = "grid" | "list" | "compact";
export type ProductCardStyle = "classic" | "simple" | "image-first";
export type SliderTransition = "fade" | "slide" | "zoom";

export const settings = {
  siteName: "الطب الإسلامي البديل",
  welcomeText: "أهلاً بكم في مركز الطب الإسلامي البديل",
  tagline: "منتجات طبيعية مختارة بعناية",
  aboutTitle: "من نحن",
  aboutText: "مركز متخصص في الأصناف الطبيعية والمنتجات المختارة بعناية.",
  address: "عفرين — شارع السياسية، مقابل مسجد أبي بكر الصديق",
  manager: "بإدارة أبو المهند",
  whatsappNumber: "905000000000",
  whatsappButtonText: "اطلب عبر واتساب",
  whatsappMessageTemplate: "السلام عليكم، أريد الاستفسار عن: {productName}",
  showFloatingWhatsapp: true,
  primaryColor: "#1f4d35",
  backgroundColor: "#ffffff",
  priceColor: "#1b5e3a",
  fontFamily: "Tajawal",
  showSlider: true,
  sliderInterval: "3000",
  sliderTransition: "fade" as SliderTransition,
  slideOverlayOpacity: "20",
  enableScrollEffects: true,
  enableBlurEffects: true,
  showTopWave: true,
  waveAngle: "60",
  desktopProductsPerRow: "4",
  productCardStyle: "classic" as ProductCardStyle,
  showCategoriesSection: true,
  categoriesTitle: "التصنيفات",
  productsTitle: "الأصناف",
  emptyProductsMessage: "لا توجد أصناف حالياً، عد قريباً",
  footerText: "اختيارات عشبية موثوقة ومنسقة بعناية.",
  footerAddress: "عفرين — شارع السياسية",
  footerPhone: "+90 500 000 00 00",
  footerEmail: "info@example.com",
  instagramUrl: "",
  facebookUrl: "",
};

export const categories: Category[] = [
  { id: "herbs", name: "أعشاب", slug: "aashab", count: 0 },
  { id: "spices", name: "توابل وبهارات", slug: "tawabel", count: 0 },
  { id: "honey", name: "عسل", slug: "asal", count: 0 },
  { id: "nuts", name: "مكسرات", slug: "mukasarat", count: 0 },
  { id: "mixes", name: "خلطات", slug: "khaltat", count: 0 },
];

export const products: Product[] = [];

export const slides: Slide[] = [];
export const productDisplayMode: ProductDisplayMode = "grid";

export type ShopConfig = {
  settings: typeof settings;
  categories: Category[];
  products: Product[];
  slides: Slide[];
  productDisplayMode: ProductDisplayMode;
};

export const defaultShopConfig: ShopConfig = {
  settings,
  categories,
  products,
  slides,
  productDisplayMode,
};

export const stats = {
  totalProducts: products.length,
  publishedProducts: products.filter((p) => p.published).length,
  unpublishedProducts: products.filter((p) => !p.published).length,
  totalCategories: categories.length,
  totalSlides: slides.length,
  productsByCategory: categories.map((category) => ({
    categoryId: category.id,
    categoryName: category.name,
    count: products.filter((product) => product.categoryId === category.id).length,
  })),
  recentProducts: products.slice(0, 5),
};

export function buildWhatsappUrl(productName: string, siteSettings = settings) {
  const cleanNumber = siteSettings.whatsappNumber.replace(/[^0-9]/g, "");
  const message = siteSettings.whatsappMessageTemplate.replace(/\{productName\}/g, productName);
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export const availabilityLabels: Record<ProductAvailability, string> = {
  available: "متوفر",
  limited: "محدود",
  unavailable: "غير متوفر",
};
