import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { PRODUCTS } from "@/data/products";
import type { Product, CartItem, OrderDetails, AdvisorMessage } from "@/types/ecommerce";
import { getAIRecommendation } from "@/lib/api/advisor";

// Lucide icons
import {
  ShoppingBag,
  Sparkles,
  Search,
  SlidersHorizontal,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle2,
  Star,
  Zap,
  ShieldCheck,
  Truck,
  Flame,
  MessageSquare,
  ChevronRight,
  ClipboardList,
  CreditCard,
  QrCode,
  Check,
  AlertTriangle,
  RotateCcw,
  User,
  Heart,
  Droplet,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VitaForce Suplementos — Nutrição e Alta Performance" },
      {
        name: "description",
        content:
          "Encontre os melhores suplementos premium: Whey Proteína Isolado, Creatina Creapure, Pré-treino e Vitaminas. Com consultor inteligente de nutrição IA.",
      },
      { property: "og:title", content: "VitaForce Suplementos — Nutrição Premium" },
      {
        property: "og:description",
        content:
          "Sua loja inteligente de suplementos com atendimento personalizado por inteligência artificial.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  // Catalog State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedGoal, setSelectedGoal] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recommended");

  // Shopping Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(
    null,
  );
  const [couponError, setCouponError] = useState("");
  const [shippingCep, setShippingCep] = useState("");
  const [shippingFee, setShippingFee] = useState<number | null>(null);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"info" | "payment" | "success">("info");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | "boleto">("pix");

  // Checkout Form Details
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerCpf, setCustomerCpf] = useState("");
  const [customerCep, setCustomerCep] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [customerNeighborhood, setCustomerNeighborhood] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerState, setCustomerState] = useState("");

  // Card Payment Details
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardInstallments, setCardInstallments] = useState("1");
  const [cardType, setCardType] = useState<"visa" | "mastercard" | "unknown">("unknown");

  // Active Success Order
  const [completedOrder, setCompletedOrder] = useState<OrderDetails | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixTimeRemaining, setPixTimeRemaining] = useState(180); // 3 minutes
  const [pixPaid, setPixPaid] = useState(false);

  // Product Selection Details Modal
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // AI Advisor Screen State
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [messages, setMessages] = useState<AdvisorMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Eu sou o **NutriBot**, o consultor de saúde e suplementação inteligente da VitaForce. 🌿\n\nEstou aqui para ajudar você a turbinar seus treinos, melhorar sua saúde e escolher a suplementação ideal para o seu corpo e estilo de vida.\n\nPara começarmos com o pé direito, me conte um pouco sobre sua rotina, idade e objetivos físicos ou preencha a ficha rápida abaixo para uma recomendação exclusiva!",
      timestamp: "Agora",
    },
  ]);
  const [advisorInput, setAdvisorInput] = useState("");
  const [isAdvisorLoading, setIsAdvisorLoading] = useState(false);

  // AI User Profile Form
  const [userProfile, setUserProfile] = useState({
    age: "",
    gender: "",
    goal: "",
    diet: "",
    restrictions: "",
  });
  const [hasSubmittedProfile, setHasSubmittedProfile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll inside advisor chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAdvisorOpen]);

  // Load cart from localStorage on init
  useEffect(() => {
    const savedCart = localStorage.getItem("vitaforce_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error loading cart", e);
      }
    }
  }, []);

  // Save cart to localStorage
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("vitaforce_cart", JSON.stringify(newCart));
  };

  // Helper payment card detection
  useEffect(() => {
    if (cardNumber.startsWith("4")) {
      setCardType("visa");
    } else if (/^5[1-5]/.test(cardNumber) || cardNumber.startsWith("2")) {
      setCardType("mastercard");
    } else {
      setCardType("unknown");
    }
  }, [cardNumber]);

  // Pix payment success simulation countdown
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isCheckoutOpen && checkoutStep === "payment" && paymentMethod === "pix" && !pixPaid) {
      timer = setInterval(() => {
        setPixTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCheckoutOpen, checkoutStep, paymentMethod, pixPaid]);

  // 5 seconds simulation to automatically approve Pix
  useEffect(() => {
    let approveTimer: ReturnType<typeof setTimeout> | undefined;
    let transitionTimer: ReturnType<typeof setTimeout> | undefined;
    if (isCheckoutOpen && checkoutStep === "payment" && paymentMethod === "pix" && !pixPaid) {
      approveTimer = setTimeout(() => {
        setPixPaid(true);
        // Automatically progress to success
        transitionTimer = setTimeout(() => {
          handleCompleteOrder();
        }, 1500);
      }, 6000); // 6 seconds to feel real
    }
    return () => {
      if (approveTimer) clearTimeout(approveTimer);
      if (transitionTimer) clearTimeout(transitionTimer);
    };
  }, [isCheckoutOpen, checkoutStep, paymentMethod, pixPaid, handleCompleteOrder]);

  // Format money
  const formatBRL = (val: number) => {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  // Cart Functions
  const addToCart = (product: Product, quantity = 1) => {
    const existing = cart.find((item) => item.product.id === product.id);
    let updated: CartItem[];
    if (existing) {
      updated = cart.map((item) =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
      );
    } else {
      updated = [...cart, { product, quantity }];
    }
    saveCart(updated);

    // Smooth toast alert
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      const audioContext = new AudioContextClass();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.setValueAtTime(800, audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.15);
      gain.gain.setValueAtTime(0.05, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      osc.start();
      osc.stop(audioContext.currentTime + 0.15);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const updated = cart
      .map((item) => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: newQty };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);
    saveCart(updated);
  };

  const removeFromCart = (productId: string) => {
    const updated = cart.filter((item) => item.product.id !== productId);
    saveCart(updated);
  };

  const getSubtotal = () => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = getSubtotal();
  const freeShippingThreshold = 199.0;
  const isFreeShipping = subtotal >= freeShippingThreshold;

  const getShippingValue = () => {
    if (cart.length === 0) return 0;
    if (isFreeShipping || (appliedCoupon && appliedCoupon.code === "FRETEGRATIS")) return 0;
    if (shippingFee !== null) return shippingFee;
    return 15.0; // default shipping
  };

  const activeShipping = getShippingValue();

  const getDiscountValue = () => {
    if (!appliedCoupon) return 0;
    return appliedCoupon.discount;
  };

  const discount = getDiscountValue();
  const totalPrice = Math.max(0, subtotal - discount + activeShipping);

  // Apply Coupon Code
  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === "VITA10") {
      const disc = subtotal * 0.1;
      setAppliedCoupon({ code, discount: disc });
      setCouponError("");
    } else if (code === "CREATINA20") {
      // 20% off exclusively
      const disc = subtotal * 0.2;
      setAppliedCoupon({ code, discount: disc });
      setCouponError("");
    } else if (code === "FRETEGRATIS") {
      setAppliedCoupon({ code, discount: 0 }); // free shipping handled dynamically
      setCouponError("");
    } else {
      setCouponError("Cupom inválido ou expirado.");
      setTimeout(() => setCouponError(""), 3000);
    }
  };

  // Autocomplete CEP shipping calculator
  const handleSimulateCep = (cepVal: string) => {
    const cleanCep = cepVal.replace(/\D/g, "");
    if (cleanCep.length >= 8) {
      // Simulate random shipping value or free
      if (subtotal >= freeShippingThreshold) {
        setShippingFee(0);
      } else {
        const hash = [...cleanCep].reduce((acc, char) => acc + parseInt(char, 10), 0);
        const simAmt = (hash % 10) + 10; // R$ 10.00 to R$ 19.00
        setShippingFee(simAmt);
      }
    }
  };

  // Addresses lists simulator
  const fillSampleAddress = () => {
    setCustomerName("Raul Carvalho");
    setCustomerEmail("raul.ocarvalho@gmail.com");
    setCustomerCpf("421.312.549-33");
    setCustomerCep("04571-010");
    setCustomerAddress("Avenida Engenheiro Luís Carlos Berrini");
    setCustomerNumber("105");
    setCustomerNeighborhood("Cidade Monções");
    setCustomerCity("São Paulo");
    setCustomerState("SP");
    // trigger CEP calculate
    setShippingFee(0); // sample standard Berrini free above threshold
  };

  // Checkout Operations
  const handleStartCheckout = () => {
    if (cart.length === 0) return;
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
    setCheckoutStep("info");
  };

  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !customerName ||
      !customerEmail ||
      !customerCpf ||
      !customerCep ||
      !customerAddress ||
      !customerNumber ||
      !customerNeighborhood ||
      !customerCity ||
      !customerState
    ) {
      alert("Por favor, preencha todos os campos obrigatórios para entrega.");
      return;
    }
    setCheckoutStep("payment");
    setPixTimeRemaining(180);
    setPixPaid(false);
  };

  const handleCompleteOrder = useCallback(() => {
    const order: OrderDetails = {
      id: "VF-" + Math.floor(100000 + Math.random() * 900000),
      customerName,
      email: customerEmail,
      cpf: customerCpf,
      cep: customerCep,
      address: `${customerAddress}, ${customerNumber} - ${customerNeighborhood}`,
      number: customerNumber,
      neighborhood: customerNeighborhood,
      city: customerCity,
      state: customerState,
      paymentMethod,
      items: [...cart],
      subtotal,
      discount,
      shippingFee: activeShipping,
      total: totalPrice,
      date: new Date().toLocaleDateString("pt-BR"),
    };

    setCompletedOrder(order);
    setCheckoutStep("success");
    // Clear cart immediately
    saveCart([]);
  }, [
    customerName,
    customerEmail,
    customerCpf,
    customerCep,
    customerAddress,
    customerNumber,
    customerNeighborhood,
    customerCity,
    customerState,
    paymentMethod,
    cart,
    subtotal,
    discount,
    activeShipping,
    totalPrice,
  ]);

  // AI Advisor Functions
  const handleAdvisorMessageSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptText = advisorInput.trim();
    if (!promptText) return;

    // Add user message
    const userMsg: AdvisorMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content: promptText,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setAdvisorInput("");
    setIsAdvisorLoading(true);

    try {
      // Assemble full payload
      const thread = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Call Server function
      const res = await getAIRecommendation({
        data: {
          messages: thread,
          userProfile: hasSubmittedProfile ? userProfile : undefined,
        },
      });

      const assistantMsg: AdvisorMessage = {
        id: "msg-reply-" + Date.now(),
        role: "assistant",
        content: res.reply || "Desculpe, deu um erro temporário na IA.",
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const assistantError: AdvisorMessage = {
        id: "msg-err-" + Date.now(),
        role: "assistant",
        content:
          "Ops! Não consegui conectar com o servidor da IA. Por favor, certifique-se de preencher a sua chave de API do Gemini em 'Secrets' e tente novamente.",
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantError]);
    } finally {
      setIsAdvisorLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmittedProfile(true);
    setIsAdvisorLoading(true);

    const introText = `Ficha do usuário submetida!\n\n**Objetivo**: ${userProfile.goal || "Geral"}\n**Idade**: ${userProfile.age} anos\n**Restrições**: ${userProfile.restrictions || "Nenhuma"}`;

    // Add context to panel as simulated system prompt
    const userMsg: AdvisorMessage = {
      id: "profile-init-" + Date.now(),
      role: "user",
      content:
        `Gostaria de uma recomendação completa baseada no meu perfil:\n` +
        `- Idade: ${userProfile.age} anos\n` +
        `- Gênero: ${userProfile.gender || "Não informado"}\n` +
        `- Objetivo: ${userProfile.goal}\n` +
        `- Dieta: ${userProfile.diet || "Normal"}\n` +
        `- Restrições Alimentares: ${userProfile.restrictions || "Nenhuma"}`,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await getAIRecommendation({
        data: {
          messages: [userMsg],
          userProfile,
        },
      });

      const assistantMsg: AdvisorMessage = {
        id: "profile-reply-" + Date.now(),
        role: "assistant",
        content: res.reply || "Perfil recebido! Como posso ajudar você hoje?",
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdvisorLoading(false);
    }
  };

  // Products filters calculations
  const filteredProducts = PRODUCTS.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesGoal = selectedGoal === "all" || p.goal === selectedGoal;
    return matchesSearch && matchesCategory && matchesGoal;
  }).sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0; // recommended
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* HEADER BANNER OF OFFERS */}
      <div className="bg-emerald-950 text-emerald-100 text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="h-3 w-3 text-emerald-300 animate-pulse" />
        <span>
          Ganha R$ 10 de desconto no seu primeiro pedido com cupom{" "}
          <strong className="text-white bg-emerald-800 px-1.5 py-0.5 rounded">VITA10</strong>
        </span>
        <span className="hidden md:inline">| Frete grátis para compras acima de R$ 199,00! 🚚</span>
      </div>

      {/* NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-xs">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                VitaForce
                <span className="text-emerald-600 text-xs px-2 py-0.5 bg-emerald-50 rounded-full font-semibold">
                  Premium
                </span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase -mt-0.5">
                Nutrição Inteligente
              </p>
            </div>
          </div>

          {/* Search bar Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar Whey Protein, Creatina, Pré-treino, Vitaminas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Core Controls */}
          <div className="flex items-center gap-3">
            {/* AI Advisor Button */}
            <button
              onClick={() => setIsAdvisorOpen(true)}
              className="relative group inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all shadow-xs overflow-hidden"
            >
              <div className="absolute inset-0 bg-linear-to-r from-emerald-100/10 to-emerald-200/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Sparkles className="h-4 w-4 text-emerald-600 animate-bounce" />
              <span>Consultor IA</span>
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 transition-all shadow-xs"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white min-w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center px-1 shadow-xs animate-scale">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE SEARCH BAR */}
      <div className="md:hidden bg-white px-4 py-3 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar suplementos de alta performance..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HERO BANNER SECTION */}
        <div className="bg-slate-900 rounded-2xl relative overflow-hidden shadow-md mb-12 border border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.15),transparent)] rounded-2xl z-0" />
          <div
            className="absolute right-0 bottom-0 top-0 w-1/3 opacity-20 bg-contain bg-right-bottom bg-no-referrer hidden md:block"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&q=80")',
            }}
          />

          <div className="relative z-10 px-6 sm:px-10 py-12 md:py-16 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 animate-pulse">
              <Zap className="h-3 w-3 fill-current" /> Força, Energia & Performance
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Desperte seu Máximo <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 via-teal-300 to-emerald-500">
                Potencial Físico e Mental
              </span>
            </h1>
            <p className="mt-4 text-slate-300/90 text-sm sm:text-base leading-relaxed">
              Desenvolvemos suplementos de grau farmacêutico cientificamente comprovados para
              acelerar a queima de gordura, potencializar o ganho de massa magra e elevar sua
              produtividade diária.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#produtos"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all shadow-md hover:translate-y-[-1px]"
              >
                Explorar Suplementos <ChevronRight className="h-4 w-4" />
              </a>
              <button
                onClick={() => setIsAdvisorOpen(true)}
                className="inline-flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold px-6 py-3 rounded-xl transition-all shadow-xs"
              >
                <Sparkles className="h-4 w-4 text-emerald-400" /> Prescrever com NutriBot IA
              </button>
            </div>
          </div>
        </div>

        {/* CORE TRUST ADVANTAGES Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-100 flex items-start gap-4">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Creapure® e Matéria Primaria Certificada
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Utilizamos apenas ingredientes com laudos de pureza de fabricantes renomados
                mundialmente.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-100 flex items-start gap-4">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Frete Expresso para Todo Brasil</h3>
              <p className="text-xs text-slate-500 mt-1">
                Sua suplementação despachada no mesmo dia em embalagens herméticas ultra-seguras.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-100 flex items-start gap-4">
            <div className="bg-amber-50 text-amber-600 p-3 rounded-lg">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Suporte & Prescrição Inteligente IA
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Nosso especialista de nutrição artificial cria seu cronograma personalizado em
                segundos.
              </p>
            </div>
          </div>
        </section>

        {/* PRODUCT CATALOG PORTAL */}
        <div id="produtos" className="pt-2">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100 mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Category selection */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400 mr-2 uppercase tracking-wider">
                Categorias
              </span>
              {[
                { id: "all", label: "Todos" },
                { id: "proteina", label: "Proteínas" },
                { id: "forca", label: "Força & Treino" },
                { id: "vitaminas", label: "Vitaminas & Saúde" },
                { id: "emagrecimento", label: "Emagrecimento" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === cat.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Filter controls right */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Goal */}
              <div className="flex items-center gap-1.5 h-10 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={selectedGoal}
                  onChange={(e) => setSelectedGoal(e.target.value)}
                  className="bg-transparent font-medium border-0 focus:outline-hidden focus:ring-0 p-0 text-slate-700"
                >
                  <option value="all">Filtrar por Objetivo</option>
                  <option value="massa">Ganho de Massa</option>
                  <option value="energia">Força & Energia</option>
                  <option value="saude">Saúde & Imunidade</option>
                  <option value="emagrecimento">Emagrecimento</option>
                </select>
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-1.5 h-10 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent font-medium border-0 focus:outline-hidden focus:ring-0 p-0 text-slate-700"
                >
                  <option value="recommended">Recomendados</option>
                  <option value="price-asc">Menor Preço</option>
                  <option value="price-desc">Maior Preço</option>
                  <option value="rating">Melhor Avaliação</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid Products */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-xs border border-slate-100 p-12 text-center max-w-lg mx-auto">
              <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 mb-1">Nenhum suplemento encontrado</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Não encontramos correspondência para sua busca "{search}". Experimente buscar por
                "Whey", "Creatina" ou altere as categorias de filtros.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                  setSelectedGoal("all");
                }}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-500"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Limpar filtros e tentar novamente
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-xs border border-slate-100 hover:border-slate-200 group hover:shadow-md transition-all duration-300 flex flex-col"
                >
                  {/* Image Holder */}
                  <div className="relative pt-[70%] bg-slate-50 overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Floating active badges */}
                    {p.tag && (
                      <span className="absolute top-3.5 left-3.5 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider py-1 px-2.5 rounded-lg shadow-xs leading-none">
                        {p.tag}
                      </span>
                    )}

                    {/* Active goal badge identifier */}
                    <span className="absolute top-3.5 right-3.5 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold py-1 px-2 rounded-lg flex items-center gap-1">
                      {p.goal === "massa" && "Massa Muscular"}
                      {p.goal === "energia" && "Energia"}
                      {p.goal === "saude" && "Saúde & Imunidade"}
                      {p.goal === "emagrecimento" && "Definição"}
                    </span>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-1 text-amber-500 mb-2">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="text-xs font-bold text-slate-800">
                        {p.rating.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({p.reviewCount} avaliações)
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-base line-clamp-1 leading-snug">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed flex-1">
                      {p.description}
                    </p>

                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-baseline justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase leading-none">
                          Preço à vista
                        </p>
                        <p className="text-xl font-black text-slate-900 mt-1">
                          {formatBRL(p.price)}
                        </p>
                        <p className="text-[10px] text-slate-500 -mt-0.5">
                          ou 3x de {formatBRL(p.price / 3)} sem juros
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewingProduct(p)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 p-2.5 rounded-xl text-xs font-bold transition-all"
                          title="Ver Ficha Nutricional"
                        >
                          <ClipboardList className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => addToCart(p, 1)}
                          className="bg-emerald-600 hover:bg-emerald-500 hover:translate-y-[-1px] text-white font-bold p-2.5 rounded-xl text-xs transition-all flex items-center justify-center shadow-xs"
                          title="Adicionar ao Carrinho"
                        >
                          <ShoppingBag className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* FOOTER BRANDS */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
                  <Zap className="h-4 w-4 fill-current" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">
                  VitaForce premium
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-3 max-w-sm leading-relaxed">
                VitaForce Suplementos Ltda. Loja licenciada de nutrição voltada para promover ganho
                de performance com o máximo padrão científico de pureza. Nossos produtos não
                substituem o aconselhamento de profissionais de saúde.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <span className="text-white text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-900 px-2.5 py-1 rounded-sm flex items-center gap-1">
                  🔒 100% Amparo à Privacidade
                </span>
                <span className="text-xs text-slate-500">CNPJ: 42.131.254/0001-93</span>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
                Links Úteis
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#produtos" className="hover:text-white transition-colors">
                    Linha de Whey Proteína
                  </a>
                </li>
                <li>
                  <a href="#produtos" className="hover:text-white transition-colors">
                    Creatina Creapure®
                  </a>
                </li>
                <li>
                  <a href="#produtos" className="hover:text-white transition-colors">
                    Termogênicos & Foco
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Central de Segurança
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
                Cupons Ativos
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex justify-between border-b border-slate-800 pb-1">
                  <span>
                    <strong>VITA10</strong>
                  </span>
                  <span className="text-emerald-400">-10% no Primeiro Pedido</span>
                </li>
                <li className="flex justify-between border-b border-slate-800 pb-1">
                  <span>
                    <strong>CREATINA20</strong>
                  </span>
                  <span className="text-emerald-400">-20% Off Especial</span>
                </li>
                <li className="flex justify-between">
                  <span>
                    <strong>FRETEGRATIS</strong>
                  </span>
                  <span className="text-emerald-400">Envio Grátis</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
            <p>
              © 2026 VitaForce Suplementos. Desenvolvido para máxima pureza. Todos os direitos
              reservados.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-400">
                Termos de Uso
              </a>
              <a href="#" className="hover:text-slate-400">
                Política de Cookies
              </a>
              <a href="#" className="hover:text-slate-400">
                Suporte Técnico
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================== */}
      {/* 1. PRODUCT DETAILS & NUTRITIONAL SHEET DIALOG */}
      {/* ========================================================== */}
      {viewingProduct && (
        <div className="fixed inset-0 min-h-screen z-50 flex items-center justify-center px-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl overflow-hidden shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-scale relative border border-slate-100">
            <button
              onClick={() => setViewingProduct(null)}
              className="absolute top-4 right-4 z-10 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full p-1.5 transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="overflow-y-auto p-6 md:p-8 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visual Block */}
                <div>
                  <div className="relative pt-[100%] bg-slate-50 rounded-xl overflow-hidden shadow-xs border border-slate-100">
                    <img
                      src={viewingProduct.image}
                      alt={viewingProduct.name}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>

                  {/* Rating summary */}
                  <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100/50">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-current" />{" "}
                      {viewingProduct.rating} / 5.0 Excelente
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Garantia absoluta de satisfação ou reembolso em 15 dias.
                    </p>
                  </div>
                </div>

                {/* Info block */}
                <div className="flex flex-col">
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-sm w-fit uppercase tracking-wider mb-2">
                    {viewingProduct.category === "proteina" && "Proteína Natural"}
                    {viewingProduct.category === "forca" && "Aumento de Performance"}
                    {viewingProduct.category === "vitaminas" && "Vitaminas & Imunidade"}
                    {viewingProduct.category === "emagrecimento" && "Metabolismo"}
                  </span>

                  <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                    {viewingProduct.name}
                  </h2>
                  <p className="text-lg font-black text-emerald-700 mt-1">
                    {formatBRL(viewingProduct.price)}
                  </p>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {viewingProduct.description}
                  </p>

                  <div className="mt-4 space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-900">Benefícios Principais:</h4>
                    {viewingProduct.benefits.map((ben, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{ben}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-slate-900">Como Consumir:</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1 bg-slate-50 p-2.5 rounded-md border-l-2 border-emerald-500">
                      {viewingProduct.howToTake}
                    </p>
                  </div>
                </div>
              </div>

              {/* NUTRITIONAL LABEL GRID CARD */}
              <div className="mt-8 border-t border-slate-100 pt-6">
                <div className="bg-white border border-slate-800 p-4 max-w-sm mx-auto shadow-xs font-mono text-xs text-slate-900">
                  <h3 className="text-center font-black text-sm uppercase border-b-4 border-slate-900 pb-1 mb-1">
                    Informação Nutricional
                  </h3>
                  <p className="text-xs text-center border-b-2 border-slate-900 pb-1 mb-2">
                    Porção de {viewingProduct.nutritionalFacts.portion}
                  </p>

                  <div className="grid grid-cols-3 font-semibold pb-1 mb-1.5 border-b border-slate-900 text-[10px]">
                    <span className="col-span-2">Quantidade por porção</span>
                    <span className="text-right">%VD (*)</span>
                  </div>

                  <div className="space-y-1">
                    {viewingProduct.nutritionalFacts.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-3 border-b border-slate-300 pb-1 last:border-0"
                      >
                        <span className="col-span-2 capitalize font-medium">{it.name}</span>
                        <div className="flex justify-between">
                          <span>{it.amount}</span>
                          <span className="font-bold">{it.dailyValue || "-"}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[9px] text-slate-500 mt-4 leading-normal font-sans pt-1 border-t-2 border-slate-900">
                    * % Valores Diários de referência com base em uma dieta de 2.000 kcal ou 8.400
                    kJ. Seus valores diários podem ser maiores ou menores dependendo de suas
                    necessidades energéticas.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Add button */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Total a pagar</p>
                <p className="text-lg font-black text-slate-900">
                  {formatBRL(viewingProduct.price)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    addToCart(viewingProduct, 1);
                    setViewingProduct(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5"
                >
                  <ShoppingBag className="h-4 w-4" /> Adicionar e fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. SHOPPING CART DRAWER (SLIDE-OVER PANEL) */}
      {/* ========================================================== */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs opacity-100 transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-xl flex flex-col h-full transform transition-transform duration-300">
              {/* Cart Drawer Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-emerald-600" />
                  <span className="text-base font-bold text-slate-900">Seu Carrinho VitaForce</span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-sm transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                    <ShoppingBag className="h-10 w-10 text-slate-300 mb-3" />
                    <h3 className="font-bold text-slate-700 text-sm">Seu carrinho está vazio</h3>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Explore os produtos e comece a adicionar o combustível ideal para sua rotina
                      de treinamento!
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold py-2.5 px-5 rounded-lg transition-colors border border-emerald-100"
                    >
                      Continuar Comprando
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Free shipping progress tracker */}
                    <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-slate-500 font-medium">
                          {isFreeShipping ? (
                            <strong className="text-emerald-700">
                              Parabéns! Você ganhou Frete Grátis
                            </strong>
                          ) : (
                            <span>
                              Faltam <strong>{formatBRL(freeShippingThreshold - subtotal)}</strong>{" "}
                              para ganhar Frete Grátis!
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {formatBRL(subtotal)} / {formatBRL(freeShippingThreshold)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex gap-4 border-b border-slate-50 pb-4"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-lg border border-slate-100 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-xs font-bold text-slate-900 mt-1">
                            {formatBRL(item.product.price)}
                          </p>

                          <div className="flex items-center justify-between mt-2.5">
                            <div className="flex items-center border border-slate-100 rounded-md bg-slate-50/50">
                              <button
                                onClick={() => updateQuantity(item.product.id, -1)}
                                className="p-1 text-slate-500 hover:text-slate-800"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="text-xs font-bold px-2 w-6 text-center text-slate-800">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.product.id, 1)}
                                className="p-1 text-slate-500 hover:text-slate-800"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-rose-500 hover:text-rose-600 p-1 rounded-sm"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Bottom calculations & Checkout */}
              {cart.length > 0 && (
                <div className="p-5 border-t border-slate-100 bg-slate-50">
                  {/* Coupon Area */}
                  <div className="mb-4">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      Cupom de Desconto
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ex: VITA10 ou CREATINA20"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-slate-300 uppercase font-mono"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-slate-800 transition-colors"
                      >
                        Aplicar
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[10px] text-rose-500 mt-1 font-bold">{couponError}</p>
                    )}
                    {appliedCoupon && (
                      <p className="text-[10px] text-emerald-600 mt-1 font-bold flex items-center gap-1">
                        <Check className="h-3 w-3" /> Cupom de {appliedCoupon.code} aplicado (-
                        {formatBRL(appliedCoupon.discount)})
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs mb-4">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>{formatBRL(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Desconto</span>
                        <span>-{formatBRL(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500">
                      <span>Entrega Estimada</span>
                      <span>{activeShipping === 0 ? "Grátis" : formatBRL(activeShipping)}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-200">
                      <span>Total Geral</span>
                      <span>{formatBRL(totalPrice)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleStartCheckout}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 hover:translate-y-[-1px] text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    Prosseguir para o Checkout <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 3. STEP-BY-STEP CHECKOUT SYSTEM MODAL */}
      {/* ========================================================== */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 z-[100] flex items-center justify-center px-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col animate-scale relative border border-slate-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Checkout Seguro VitaForce</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Finalizar sua suplementação de alta performance
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Stepper bar */}
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between gap-2 text-[10px] font-bold text-slate-400">
              <span
                className={`pb-1 ${checkoutStep === "info" ? "text-emerald-600 border-b-2 border-emerald-500" : ""}`}
              >
                1. Dados De Entrega
              </span>
              <span
                className={`pb-1 ${checkoutStep === "payment" ? "text-emerald-600 border-b-2 border-emerald-500" : ""}`}
              >
                2. Pagamento Direto
              </span>
              <span
                className={`pb-1 ${checkoutStep === "success" ? "text-emerald-600 border-b-2 border-emerald-500" : ""}`}
              >
                3. Confirmação
              </span>
            </div>

            {/* Body Form scrollarea */}
            <div className="overflow-y-auto p-5 flex-1 space-y-4">
              {/* STEP 1: SHIPPINGS CONFIGS FORMS */}
              {checkoutStep === "info" && (
                <form id="checkout-form" onSubmit={handleNextToPayment} className="space-y-4">
                  {/* Speed Simulation CTA */}
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-emerald-800">
                        Preenchimento Rápido
                      </h4>
                      <p className="text-[10px] text-emerald-600">
                        Autopreencher com dados fictícios para testes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={fillSampleAddress}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold transition-all"
                    >
                      Preencher Raul
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-600 font-bold block">
                      Nome do Comprador *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Raul Carvalho"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-600 font-bold block">
                        E-mail de Notificações *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="Ex: raul@gmail.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-600 font-bold block">
                        CPF do Titular *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="000.000.000-00"
                        value={customerCpf}
                        onChange={(e) => setCustomerCpf(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1 col-span-1">
                      <label className="text-[10px] text-slate-600 font-bold block">CEP *</label>
                      <input
                        type="text"
                        required
                        placeholder="04571-010"
                        value={customerCep}
                        onChange={(e) => {
                          setCustomerCep(e.target.value);
                          handleSimulateCep(e.target.value);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-mono"
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] text-slate-600 font-bold block">
                        Endereço de Entrega *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Avenida / Rua..."
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-600 font-bold block">Número *</label>
                      <input
                        type="text"
                        required
                        placeholder="1600"
                        value={customerNumber}
                        onChange={(e) => setCustomerNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] text-slate-600 font-bold block">
                        Bairro de Entrega *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Bairro"
                        value={customerNeighborhood}
                        onChange={(e) => setCustomerNeighborhood(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-600 font-bold block">Cidade *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: São Paulo"
                        value={customerCity}
                        onChange={(e) => setCustomerCity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-600 font-bold block">
                        Estado (Sigla) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={2}
                        placeholder="SP"
                        value={customerState}
                        onChange={(e) => setCustomerState(e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden uppercase font-semibold"
                      />
                    </div>
                  </div>
                </form>
              )}

              {/* STEP 2: PAYMENT METHOD DIRECT SELECTS */}
              {checkoutStep === "payment" && (
                <div className="space-y-4">
                  {/* Select Payment Method Tabs */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "pix" as const, label: "Pix Rápido", icon: QrCode },
                      { id: "card" as const, label: "Cartão", icon: CreditCard },
                      {
                        id: "boleto" as const,
                        label: "Boleto",
                        icon: ClipboardList,
                      },
                    ].map((m) => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setPaymentMethod(m.id)}
                          className={`p-3 rounded-lg flex flex-col items-center justify-center border text-xs gap-1 transition-all ${
                            paymentMethod === m.id
                              ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold"
                              : "border-slate-200 hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* PIX SCREEN */}
                  {paymentMethod === "pix" && (
                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col items-center text-center">
                      <p className="text-xs font-bold text-slate-950">
                        Seu QR Code de Testes gerado
                      </p>

                      {/* Fake QR code visual box */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 my-4 shadow-xs relative">
                        <div className="h-32 w-32 flex items-center justify-center bg-slate-100 rounded-md">
                          <QrCode className="h-28 w-28 text-slate-800" />
                        </div>
                        {pixPaid && (
                          <div className="absolute inset-0 bg-emerald-500/90 flex flex-col items-center justify-center text-white p-2 text-center rounded-xl animate-fade">
                            <CheckCircle2 className="h-10 w-10 text-white animate-bounce" />
                            <span className="font-bold text-xs mt-1">Pix Aprovado!</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 w-full">
                        <p className="text-[11px] text-slate-500 leading-normal max-w-xs mx-auto">
                          O pagamento via Pix possui confirmação automática em 5 segundos. Copie o
                          código abaixo de teste.
                        </p>

                        {/* Copy Code */}
                        <div className="flex bg-white border border-slate-200 rounded-lg p-2 items-center justify-between w-full mt-2">
                          <span className="text-[10px] text-slate-400 font-mono truncate mr-2">
                            00020126580014BR.GOV.BCB.PIX0136vitaforce@pix.com.br5204000053039865405
                            {totalPrice.toFixed(2)}
                          </span>
                          <button
                            onClick={() => {
                              setPixCopied(true);
                              setTimeout(() => setPixCopied(false), 2000);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] py-1 px-2.5 rounded-md font-bold transition-all flex-shrink-0"
                          >
                            {pixCopied ? "Copiado!" : "Copiar Código"}
                          </button>
                        </div>

                        {!pixPaid ? (
                          <div className="bg-amber-50 text-amber-800 border border-amber-100 p-2.5 rounded-lg text-[10px] font-bold mt-4 flex items-center gap-1.5 justify-center">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            <span>
                              Aguardando aprovação bancária... Expira em{" "}
                              {Math.floor(pixTimeRemaining / 60)}:
                              {(pixTimeRemaining % 60).toString().padStart(2, "0")}
                            </span>
                          </div>
                        ) : (
                          <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2.5 rounded-lg text-[10px] font-bold mt-4 flex items-center gap-1.5 justify-center">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Transação concluída com sucesso! Redirecionando...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CREDIT CARD SCREEN WITH FLIPPABLE PREVIEW */}
                  {paymentMethod === "card" && (
                    <div className="space-y-3">
                      {/* Virtual flippable Card widget */}
                      <div className="bg-linear-to-br from-slate-900 via-slate-850 to-slate-950 text-white p-5 rounded-2xl shadow-md min-h-36 flex flex-col justify-between font-mono relative border border-slate-800">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-semibold tracking-wider uppercase">
                            VitaForce card
                          </span>
                          <span className="text-right text-xs uppercase font-extrabold text-emerald-400">
                            {cardType === "visa" && "Visa"}
                            {cardType === "mastercard" && "Mastercard"}
                            {cardType === "unknown" && "Crédito"}
                          </span>
                        </div>

                        <div className="text-center font-bold tracking-widest text-sm my-4 text-slate-100">
                          {cardNumber || "•••• •••• •••• ••••"}
                        </div>

                        <div className="flex justify-between items-end text-[10px]">
                          <div>
                            <span className="text-slate-500 block uppercase text-[8px] tracking-wider leading-none">
                              Nome no Cartão
                            </span>
                            <span className="font-bold tracking-wide truncate max-w-[150px] block mt-0.5">
                              {cardName.toUpperCase() || "RAUL CARVALHO"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block uppercase text-[8px] tracking-wider leading-none">
                              Validade
                            </span>
                            <span className="font-bold block mt-0.5">{cardExpiry || "MM/AA"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card fields */}
                      <div className="space-y-3 mt-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-600 font-bold block">
                            Número do Cartão *
                          </label>
                          <input
                            type="text"
                            placeholder="4000 1234 5678 9010"
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-600 font-bold block">
                            Nome Completo do Titular *
                          </label>
                          <input
                            type="text"
                            placeholder="Como gravado no cartão"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden uppercase"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-600 font-bold block">
                              Expiração (MM/AA) *
                            </label>
                            <input
                              type="text"
                              maxLength={5}
                              placeholder="12/28"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-600 font-bold block">
                              CVV *
                            </label>
                            <input
                              type="password"
                              maxLength={3}
                              placeholder="•••"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-600 font-bold block font-semibold">
                            Selecione Parcelamento
                          </label>
                          <select
                            value={cardInstallments}
                            onChange={(e) => setCardInstallments(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden"
                          >
                            <option value="1">1x sem juros de {formatBRL(totalPrice)}</option>
                            <option value="2">2x sem juros de {formatBRL(totalPrice / 2)}</option>
                            <option value="3">3x sem juros de {formatBRL(totalPrice / 3)}</option>
                            <option value="4">
                              4x com juros de {formatBRL((totalPrice * 1.05) / 4)}
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BOLETO BAMCARIO */}
                  {paymentMethod === "boleto" && (
                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl text-center space-y-3">
                      <ClipboardList className="h-10 w-10 text-slate-700 mx-auto" />
                      <h4 className="font-bold text-xs text-slate-950">Boleto Bancário Faturado</h4>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-normal">
                        Ao finalizar, será gerado o PDF oficial do boleto para pagamento em qualquer
                        lotérica ou aplicativo bancário. Vencimento em 3 dias úteis.
                      </p>

                      <div className="bg-white border border-slate-200 p-3 rounded-lg text-left text-xs font-mono select-all">
                        34191.79001 01043.513184 91020.150008 7 968700000{Math.floor(totalPrice)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: CONGRATS SUCCESS CONFIRMATION RECEIPT */}
              {checkoutStep === "success" && completedOrder && (
                <div className="text-center py-6 space-y-6">
                  {/* Visual success splash */}
                  <div className="space-y-2">
                    <div className="bg-emerald-100 text-emerald-700 p-3 rounded-full w-fit mx-auto shadow-xs animate-bounce">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 leading-none">
                      Pedindo Confirmado com Sucesso!
                    </h2>
                    <p className="text-xs text-emerald-600 font-semibold">
                      Parabéns, {completedOrder.customerName}. Seu pagamento foi aprovado!
                    </p>
                  </div>

                  {/* General order specs invoice */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                      <span className="text-slate-400 font-bold">Código do Pedido</span>
                      <span className="font-extrabold text-slate-900">{completedOrder.id}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                      <span className="text-slate-400 font-bold">Método Pagamento</span>
                      <span className="font-bold text-slate-900 uppercase">
                        {completedOrder.paymentMethod}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                      <span className="text-slate-400 font-bold">Entrega no Endereço</span>
                      <span
                        className="font-medium text-slate-900 truncate max-w-[200px]"
                        title={completedOrder.address}
                      >
                        {completedOrder.address}, {completedOrder.city} - {completedOrder.state}{" "}
                        (CEP: {completedOrder.cep})
                      </span>
                    </div>

                    <div className="pt-2">
                      <p className="text-[10px] text-slate-400 font-bold">itens do pedido:</p>
                      <ul className="space-y-1 mt-1">
                        {completedOrder.items.map((it, idx) => (
                          <li
                            key={idx}
                            className="flex justify-between text-[11px] text-slate-700 font-medium"
                          >
                            <span>
                              x{it.quantity} {it.product.name}
                            </span>
                            <span>{formatBRL(it.product.price * it.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 flex justify-between font-extrabold text-slate-900">
                      <span>Total Faturado</span>
                      <span>{formatBRL(completedOrder.total)}</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3.5 rounded-lg text-xs leading-relaxed flex items-start gap-3">
                    <Truck className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold">Estimativa para o envio expresso:</h4>
                      <p className="text-[11px] mt-0.5">
                        Sua encomenda já está sendo separada. O código de rastreio de envio chegará
                        em até 24h no e-mail: <strong>{completedOrder.email}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions based on step */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4 rounded-b-2xl">
              {checkoutStep === "info" && (
                <>
                  <button
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      setIsCartOpen(true);
                    }}
                    className="text-slate-600 hover:text-slate-900 text-xs font-bold"
                  >
                    Voltar ao Carrinho
                  </button>
                  <button
                    type="submit"
                    form="checkout-form"
                    className="bg-emerald-600 hover:bg-emerald-500 font-bold px-5 py-2.5 rounded-xl text-xs text-white transition-all shadow-xs flex items-center gap-1"
                  >
                    Continuar Pagamento <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {checkoutStep === "payment" && (
                <>
                  <button
                    onClick={() => setCheckoutStep("info")}
                    className="text-slate-600 hover:text-slate-900 text-xs font-bold"
                  >
                    Voltar para Entrega
                  </button>
                  {paymentMethod !== "pix" && (
                    <button
                      onClick={handleCompleteOrder}
                      className="bg-emerald-600 hover:bg-emerald-500 font-bold px-6 py-2.5 rounded-xl text-xs text-white transition-all shadow-xs"
                    >
                      Finalizar Pedido
                    </button>
                  )}
                </>
              )}

              {checkoutStep === "success" && (
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition-all text-center"
                >
                  Fechar e Continuar Comprando
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 4. AI NUTRITION & SUPPLEMENT ADVISOR SIDE DRAWER */}
      {/* ========================================================== */}
      {isAdvisorOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-xl flex flex-col h-full transform transition-transform duration-300">
          {/* Header Advisor */}
          <div className="p-4 bg-emerald-950 text-emerald-100 border-b border-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-800/80 p-2 rounded-xl border border-emerald-700">
                <Sparkles className="h-4 w-4 text-emerald-300 animate-pulse animate-bounce" />
              </div>
              <div>
                <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  NutriBot IA
                  <span className="text-[9px] font-black bg-emerald-800 px-1.5 py-0.5 rounded uppercase text-emerald-300">
                    Membro Oficial
                  </span>
                </span>
                <p className="text-[10px] text-emerald-400">
                  Seu nutricionista e orientador inteligente
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAdvisorOpen(false)}
              className="text-emerald-300 hover:text-white p-1.5 rounded-lg transition-colors bg-emerald-900/50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Core Screen Body of Advisor */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {/* User Profile Form Initializer if not submitted yet */}
            {!hasSubmittedProfile && (
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-emerald-600" />
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Ficha de Foco Personalizada (Opcional)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 mb-4 leading-normal">
                  Preencha para receber um plano de recomendação e dieta ideal gerada pelo Gemini
                  conforme seus dados corporais.
                </p>

                <form onSubmit={handleProfileSubmit} className="space-y-3 text-xs text-slate-700">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 block font-semibold">
                        Idade (Anos)
                      </label>
                      <input
                        type="number"
                        placeholder="Ex: 25"
                        value={userProfile.age}
                        onChange={(e) => setUserProfile({ ...userProfile, age: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 block font-semibold">
                        Gênero
                      </label>
                      <select
                        value={userProfile.gender}
                        onChange={(e) => setUserProfile({ ...userProfile, gender: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden"
                      >
                        <option value="">Selecione...</option>
                        <option value="male">Masculino</option>
                        <option value="female">Feminino</option>
                        <option value="other">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 block font-semibold">
                      Objetivo Principal Físico
                    </label>
                    <select
                      value={userProfile.goal}
                      onChange={(e) => setUserProfile({ ...userProfile, goal: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden"
                    >
                      <option value="">Selecione um objetivo...</option>
                      <option value="Ganho de Massa Muscular e Hipertrofia">
                        Ganho de Massa (Hipertrofia)
                      </option>
                      <option value="Queima de Gordura e Emagrecimento">
                        Queima de Gordura (Emagrecimento)
                      </option>
                      <option value="Aumento de Força Físico e Resistência Aeróbica">
                        Força & Resistência
                      </option>
                      <option value="Melhorar a Imunidade e Saúde do Corpo">
                        Saúde & Bem-Estar
                      </option>
                      <option value="Aumento de Foco Mental e Qualidade do Sono">
                        Mental, Foco & Sono
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 block font-semibold">
                      Restrições Alimentares ou Condições
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: intolerante à lactose, hipertenso, nula"
                      value={userProfile.restrictions}
                      onChange={(e) =>
                        setUserProfile({ ...userProfile, restrictions: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-xs"
                  >
                    Confirmar Perfil e Prescrever
                  </button>
                </form>
              </div>
            )}

            {/* Chat Messages */}
            <div className="space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs whitespace-pre-line ${
                      m.role === "user"
                        ? "bg-emerald-600 text-white rounded-br-none"
                        : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
                    }`}
                  >
                    {m.content}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
                </div>
              ))}

              {isAdvisorLoading && (
                <div className="flex items-start gap-2">
                  <div className="bg-slate-100 border border-slate-200/60 p-3 rounded-2xl max-w-[80%] rounded-bl-none shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                      <span className="text-[10px] text-slate-400 ml-1">
                        Analisando base e formulando recomendações...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick FAQ / Prompt Suggestions bottom */}
          <div className="p-3 border-t border-slate-100 bg-slate-50 flex gap-2 overflow-x-auto whitespace-nowrap text-[10px] scrollbar-none font-medium">
            {[
              "Qual melhor Whey para quem tem intolerância?",
              "Quero perder gordura, qual produto me ajuda?",
              "Como tomar Creatina?",
              "Por que tomar Laranja Moro?",
            ].map((suggest, i) => (
              <button
                key={i}
                onClick={() => {
                  setAdvisorInput(suggest);
                }}
                className="bg-white border border-slate-200 rounded-lg py-1 px-2.5 hover:bg-slate-100 active:bg-slate-200 transition-colors text-slate-600"
              >
                {suggest}
              </button>
            ))}
          </div>

          {/* Form typing area */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <form onSubmit={handleAdvisorMessageSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Pergunte ao NutriBot sobre dosagens, objetivos..."
                value={advisorInput}
                onChange={(e) => setAdvisorInput(e.target.value)}
                disabled={isAdvisorLoading}
                className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:outline-hidden disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isAdvisorLoading || !advisorInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs flex items-center justify-center"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
