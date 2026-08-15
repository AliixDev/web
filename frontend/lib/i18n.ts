// frontend/lib/i18n.ts
//
// Lightweight i18n system. English is the default and only fully-complete
// translation. Other languages provide key UI strings; untranslated keys
// fall back to English automatically.

export type Language = "en" | "de" | "fr" | "es" | "it" | "pt" | "ar" | "tr" | "nl" | "zh" | "ja" | "ko" | "ru";

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "it", label: "Italian", nativeLabel: "Italiano" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية" },
  { code: "tr", label: "Turkish", nativeLabel: "Türkçe" },
  { code: "nl", label: "Dutch", nativeLabel: "Nederlands" },
  { code: "zh", label: "Chinese", nativeLabel: "中文" },
  { code: "ja", label: "Japanese", nativeLabel: "日本語" },
  { code: "ko", label: "Korean", nativeLabel: "한국어" },
  { code: "ru", label: "Russian", nativeLabel: "Русский" },
];

/** Translation keys — only UI chrome, not page content. */
type TranslationKey =
  | "nav.shop"
  | "nav.about"
  | "nav.contact"
  | "nav.faq"
  | "cart.title"
  | "cart.empty"
  | "cart.viewCart"
  | "cart.checkout"
  | "cart.subtotal"
  | "cart.shipping"
  | "cart.total"
  | "product.addToCart"
  | "product.buyNow"
  | "product.inStock"
  | "product.outOfStock"
  | "product.size"
  | "product.quantity"
  | "product.description"
  | "product.details"
  | "product.related"
  | "product.options"
  | "shop.allProducts"
  | "shop.filter"
  | "shop.sort"
  | "shop.clearFilters"
  | "shop.noResults"
  | "footer.about"
  | "footer.privacy"
  | "footer.terms"
  | "footer.returns"
  | "footer.shipping"
  | "footer.cancellations"
  | "footer.cookies"
  | "footer.wholesale"
  | "footer.help"
  | "footer.contact"
  | "footer.sizeGuide"
  | "footer.trackOrder"
  | "footer.paymentMethods"
  | "footer.rights"
  | "auth.signIn"
  | "auth.signOut"
  | "auth.myOrders"
  | "common.home"
  | "common.shop"
  | "common.search"
  | "common.loading";

const translations: Record<Language, Partial<Record<TranslationKey, string>>> = {
  en: {
    "nav.shop": "Shop all",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.faq": "FAQ",
    "cart.title": "Cart",
    "cart.empty": "Your cart is empty",
    "cart.viewCart": "View full cart",
    "cart.checkout": "Checkout",
    "cart.subtotal": "Subtotal",
    "cart.shipping": "Shipping",
    "cart.total": "Total",
    "product.addToCart": "Add to cart",
    "product.buyNow": "Buy now",
    "product.inStock": "in stock",
    "product.outOfStock": "Currently out of stock",
    "product.size": "Size",
    "product.quantity": "Quantity",
    "product.description": "Description",
    "product.details": "Details",
    "product.related": "You may also like",
    "product.options": "options",
    "shop.allProducts": "All products",
    "shop.filter": "Filter",
    "shop.sort": "Sort",
    "shop.clearFilters": "Clear all filters",
    "shop.noResults": "No products found",
    "footer.about": "About",
    "footer.privacy": "Privacy",
    "footer.terms": "Terms",
    "footer.returns": "Returns",
    "footer.shipping": "Shipping",
    "footer.cancellations": "Cancellations",
    "footer.cookies": "Cookies",
    "footer.wholesale": "Wholesale B2B",
    "footer.help": "Help",
    "footer.contact": "Contact us",
    "footer.sizeGuide": "Size guide",
    "footer.trackOrder": "Track order",
    "footer.paymentMethods": "Payment methods",
    "footer.rights": "All rights reserved",
    "auth.signIn": "Sign in",
    "auth.signOut": "Sign out",
    "auth.myOrders": "My orders",
    "common.home": "Home",
    "common.shop": "Shop",
    "common.search": "Search",
    "common.loading": "Loading…",
  },
  de: {
    "nav.shop": "Alle Produkte",
    "cart.title": "Warenkorb",
    "cart.empty": "Ihr Warenkorb ist leer",
    "cart.checkout": "Bestellen",
    "cart.subtotal": "Zwischensumme",
    "cart.total": "Gesamt",
    "product.addToCart": "In den Warenkorb",
    "product.buyNow": "Jetzt kaufen",
    "product.inStock": "auf Lager",
    "product.outOfStock": "Derzeit nicht verfügbar",
    "product.size": "Größe",
    "product.quantity": "Menge",
    "product.description": "Beschreibung",
    "product.details": "Details",
    "product.related": "Das könnte Ihnen gefallen",
    "product.options": "Optionen",
    "shop.allProducts": "Alle Produkte",
    "shop.filter": "Filter",
    "shop.sort": "Sortieren",
    "shop.clearFilters": "Alle Filter löschen",
    "shop.noResults": "Keine Produkte gefunden",
    "footer.about": "Über uns",
    "footer.privacy": "Datenschutz",
    "footer.terms": "AGB",
    "footer.returns": "Rückgabe",
    "footer.shipping": "Versand",
    "footer.help": "Hilfe",
    "footer.contact": "Kontakt",
    "footer.rights": "Alle Rechte vorbehalten",
    "auth.signIn": "Anmelden",
    "auth.signOut": "Abmelden",
    "common.home": "Startseite",
    "common.shop": "Shop",
    "common.search": "Suchen",
  },
  fr: {
    "nav.shop": "Tous les produits",
    "cart.title": "Panier",
    "cart.empty": "Votre panier est vide",
    "cart.checkout": "Passer la commande",
    "cart.subtotal": "Sous-total",
    "cart.total": "Total",
    "product.addToCart": "Ajouter au panier",
    "product.buyNow": "Acheter",
    "product.inStock": "en stock",
    "product.outOfStock": "Actuellement indisponible",
    "product.size": "Taille",
    "product.quantity": "Quantité",
    "product.description": "Description",
    "product.details": "Détails",
    "product.related": "Vous aimerez aussi",
    "product.options": "options",
    "shop.allProducts": "Tous les produits",
    "shop.filter": "Filtrer",
    "shop.sort": "Trier",
    "shop.clearFilters": "Effacer les filtres",
    "shop.noResults": "Aucun produit trouvé",
    "footer.about": "À propos",
    "footer.privacy": "Confidentialité",
    "footer.terms": "Conditions",
    "footer.returns": "Retours",
    "footer.shipping": "Livraison",
    "footer.help": "Aide",
    "footer.contact": "Contact",
    "footer.rights": "Tous droits réservés",
    "auth.signIn": "Connexion",
    "auth.signOut": "Déconnexion",
    "common.home": "Accueil",
    "common.shop": "Boutique",
    "common.search": "Rechercher",
  },
  es: {
    "nav.shop": "Todos los productos",
    "cart.title": "Carrito",
    "cart.empty": "Tu carrito está vacío",
    "cart.checkout": "Pagar",
    "cart.subtotal": "Subtotal",
    "cart.total": "Total",
    "product.addToCart": "Añadir al carrito",
    "product.buyNow": "Comprar ahora",
    "product.inStock": "en stock",
    "product.outOfStock": "Agotado",
    "product.size": "Talla",
    "product.quantity": "Cantidad",
    "product.description": "Descripción",
    "product.details": "Detalles",
    "product.related": "También te puede gustar",
    "shop.allProducts": "Todos los productos",
    "shop.filter": "Filtrar",
    "shop.sort": "Ordenar",
    "footer.about": "Sobre nosotros",
    "footer.privacy": "Privacidad",
    "footer.terms": "Términos",
    "footer.returns": "Devoluciones",
    "footer.shipping": "Envío",
    "footer.help": "Ayuda",
    "footer.contact": "Contacto",
    "footer.rights": "Todos los derechos reservados",
    "auth.signIn": "Iniciar sesión",
    "auth.signOut": "Cerrar sesión",
    "common.home": "Inicio",
    "common.shop": "Tienda",
    "common.search": "Buscar",
  },
  ar: {
    "nav.shop": "جميع المنتجات",
    "cart.title": "سلة التسوق",
    "cart.empty": "سلة التسوق فارغة",
    "cart.checkout": "إتمام الشراء",
    "product.addToCart": "أضف إلى السلة",
    "product.buyNow": "اشترِ الآن",
    "product.inStock": "متوفر",
    "product.outOfStock": "غير متوفر حالياً",
    "product.size": "الحجم",
    "product.quantity": "الكمية",
    "product.description": "الوصف",
    "product.details": "التفاصيل",
    "footer.about": "من نحن",
    "footer.privacy": "الخصوصية",
    "footer.terms": "الشروط",
    "footer.help": "المساعدة",
    "footer.contact": "اتصل بنا",
    "common.home": "الرئيسية",
    "common.shop": "المتجر",
    "common.search": "بحث",
  },
  // Other languages fall back to English for keys not defined here.
  it: {},
  pt: {},
  tr: {},
  nl: {},
  zh: {
    "cart.title": "购物车",
    "cart.checkout": "结账",
    "product.addToCart": "加入购物车",
    "product.buyNow": "立即购买",
    "common.home": "首页",
    "common.shop": "商店",
  },
  ja: {
    "cart.title": "カート",
    "cart.checkout": "購入手続き",
    "product.addToCart": "カートに入れる",
    "product.buyNow": "今すぐ購入",
    "common.home": "ホーム",
    "common.shop": "ショップ",
  },
  ko: {
    "cart.title": "장바구니",
    "cart.checkout": "결제하기",
    "product.addToCart": "장바구니에 추가",
    "product.buyNow": "바로 구매",
    "common.home": "홈",
    "common.shop": "쇼핑",
  },
  ru: {
    "cart.title": "Корзина",
    "cart.checkout": "Оформить заказ",
    "product.addToCart": "В корзину",
    "product.buyNow": "Купить сейчас",
    "common.home": "Главная",
    "common.shop": "Магазин",
  },
};

/**
 * Returns the translated string for the given key and language.
 * Falls back to English if the key is not translated.
 */
export function t(key: TranslationKey, lang: Language = "en"): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}

/** Detect browser language, defaulting to English. */
export function detectLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem("sdbbuy-lang") as Language | null;
  if (stored && LANGUAGES.some((l) => l.code === stored)) return stored;
  const browserLang = navigator.language.split("-")[0] as Language;
  if (LANGUAGES.some((l) => l.code === browserLang)) return browserLang;
  return "en";
}

/** Persist the selected language. */
export function setLanguage(lang: Language): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("sdbbuy-lang", lang);
  }
}
