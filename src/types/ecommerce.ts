export interface Product {
  id: string;
  name: string;
  category: "proteina" | "forca" | "vitaminas" | "emagrecimento" | "foco";
  goal: "massa" | "energia" | "saude" | "emagrecimento" | "foco";
  price: number;
  rating: number;
  reviewCount: number;
  tag?: string;
  image: string;
  accentColor: string;
  description: string;
  benefits: string[];
  howToTake: string;
  nutritionalFacts: {
    portion: string;
    items: { name: string; amount: string; dailyValue?: string }[];
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Coupon {
  code: string;
  discountType: "percentage" | "fixed" | "free_shipping";
  value: number;
  minSubtotal?: number;
}

export interface OrderDetails {
  customerName: string;
  email: string;
  cpf: string;
  cep: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  paymentMethod: "pix" | "card" | "boleto";
  items: CartItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  id: string;
  date: string;
}

export interface AdvisorMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
