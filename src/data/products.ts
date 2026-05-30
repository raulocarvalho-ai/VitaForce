import type { Product } from "../types/ecommerce";

export const PRODUCTS: Product[] = [
  {
    id: "whey-isolated",
    name: "100% Whey Protein Isolado Premium",
    category: "proteina",
    goal: "massa",
    price: 189.9,
    rating: 4.9,
    reviewCount: 312,
    tag: "Mais Vendido 🔥",
    image: "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=500&q=80",
    accentColor: "emerald",
    description:
      "Proteína isolada do soro de leite de altíssima pureza, obtida por microfiltração de fluxo cruzado (CFM). Zero lactose, baixo carboidrato e rápida absorção para máxima síntese proteica pós-treino.",
    benefits: [
      "26g de proteína pura por porção",
      "5.8g de BCAAs e 4.5g de Glutamina por dose",
      "Zero adição de açúcares e glúten",
      "Ideal para recuperação muscular e ganho de massa magra",
    ],
    howToTake:
      "Misturar 1 medidor (30g) em 200ml de água gelada ou bebida de sua escolha. Consumir preferencialmente logo após o treino ou conforme orientação profissional.",
    nutritionalFacts: {
      portion: "30g (1 dosador)",
      items: [
        { name: "Valor Energético", amount: "110 kcal", dailyValue: "6%" },
        { name: "Proteínas", amount: "26g", dailyValue: "35%" },
        { name: "Carboidratos", amount: "0.8g", dailyValue: "0%" },
        { name: "Gorduras Totais", amount: "0.2g", dailyValue: "0%" },
        { name: "Sódio", amount: "48mg", dailyValue: "2%" },
        { name: "Cálcio", amount: "135mg", dailyValue: "14%" },
      ],
    },
  },
  {
    id: "creatina-pure",
    name: "Creatina Monohidratada 100% Creapure®",
    category: "forca",
    goal: "energia",
    price: 119.9,
    rating: 4.9,
    reviewCount: 546,
    tag: "Preço Especial ⚡",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&q=80",
    accentColor: "blue",
    description:
      "Creatina monohidratada importada com o selo Creapure® de garantia de qualidade e máxima pureza tecnológica. Aumenta os estoques de fosfocreatina nas células musculares, conferindo força explosiva e aumento de performance.",
    benefits: [
      "Aumento significativo da força muscular",
      "Melhora o desempenho em treinos de alta intensidade",
      "Mais volume muscular e hidratação celular",
      "100% pura, sem misturas ou aditivos",
    ],
    howToTake:
      "Diluir 3g (1 dosador raso) em 150ml de água ou em sua bebida energética favorita. Consumir diariamente, inclusive em dias de descanso, em qualquer horário do dia.",
    nutritionalFacts: {
      portion: "3g (1 medidor)",
      items: [
        { name: "Creatina Monohidratada", amount: "3000mg", dailyValue: "100%" },
        { name: "Valor Energético", amount: "0 kcal", dailyValue: "0%" },
        { name: "Sódio", amount: "0mg", dailyValue: "0%" },
      ],
    },
  },
  {
    // id is pré-treino
    id: "pre-workout",
    name: "Pré-Treino Insanity Shock",
    category: "forca",
    goal: "energia",
    price: 149.9,
    rating: 4.8,
    reviewCount: 224,
    tag: "Energia Extrema 🔥",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&q=80",
    accentColor: "orange",
    description:
      "Formulado para atletas que buscam ir além dos limites. Contém uma dosagem científica de Beta-Alanina para diminuir a fadiga muscular, L-Arginina para um vasodilatação intensa, Cafeína anidra pura para foco insano e Taurina.",
    benefits: [
      "Foco mental aguçado e clareza cognitiva",
      "Pumping muscular intenso (vasodilatação)",
      "Redução drástica da fadiga muscular via Beta-Alanina",
      "200mg de Cafeína por porção para energia instantânea",
    ],
    howToTake:
      "Diluir 10g (2 medidores) em 250ml de água gelada. Consumir cerca de 20 a 30 minutos antes de iniciar a sua rotina de treinamento físico intenso.",
    nutritionalFacts: {
      portion: "10g (2 dosadores)",
      items: [
        { name: "Beta-Alanina", amount: "2000mg", dailyValue: "100%" },
        { name: "Arginina", amount: "1000mg", dailyValue: "100%" },
        { name: "Cafeína Anidra", amount: "200mg", dailyValue: "100%" },
        { name: "Taurina", amount: "1000mg", dailyValue: "100%" },
        { name: "Valor Energético", amount: "15 kcal", dailyValue: "1%" },
      ],
    },
  },
  {
    id: "multivitamin-premium",
    name: "Super Multivitamínico Mineral 30 Ativos",
    category: "vitaminas",
    goal: "saude",
    price: 79.9,
    rating: 4.7,
    reviewCount: 189,
    tag: "Saúde Completa Shield 🛡️",
    image: "https://images.unsplash.com/photo-1616671285410-b9643d410757?w=500&q=80",
    accentColor: "indigo",
    description:
      "Complexo vitamínico e mineral completo ultraconcentrado com 30 macronutrientes, fitoterápicos e antioxidantes essenciais. Projetado de forma balanceada para suprir as lacunas nutricionais da vida moderna e fortalecer o sistema protetor imunológico.",
    benefits: [
      "100% da recomendação diária de mais de 20 micronutrientes",
      "Reforço direto das defesas do sistema imunológico",
      "Favorece a saúde ocular, óssea, cerebral e cardiovascular",
      "Contém extrato de chá verde e semente de uva antioxidantes",
    ],
    howToTake:
      "Consumir 1 cápsula por dia, preferencialmente junto com uma das principais refeições (café da manhã ou almoço) para melhorar a obsorção das vitaminas lipossolúveis.",
    nutritionalFacts: {
      portion: "1 cápsula",
      items: [
        { name: "Vitamina C", amount: "90mg", dailyValue: "100%" },
        { name: "Vitamina D3", amount: "2000 UI", dailyValue: "400%" },
        { name: "Zinco Quelato", amount: "11mg", dailyValue: "100%" },
        { name: "Magnésio", amount: "130mg", dailyValue: "31%" },
        { name: "Vitamina B12", amount: "2.4mcg", dailyValue: "100%" },
        { name: "Vitamina E", amount: "15mg", dailyValue: "100%" },
      ],
    },
  },
  {
    id: "thermo-lipo",
    name: "Termogênico Premium Lipo-Shred",
    category: "emagrecimento",
    goal: "emagrecimento",
    price: 129.9,
    rating: 4.8,
    reviewCount: 167,
    tag: "Queima Ativa 🔥",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80",
    accentColor: "red",
    description:
      "Acelere seu metabolismo e queime gordura de forma localizada. O Lipo-Shred combina cafeína microencapsulada de liberação gradual com extrato de laranja moro, pimenta caiena, cromo e chá verde para máxima ação termogênica.",
    benefits: [
      "Acelera a queima de gordura em repouso",
      "Ação termogênica sem picos de ansiedade (liberação lenta)",
      "Reduz de forma comprovada o apetite por doces (via picolinato de cromo)",
      "Mais foco e resistência cardiovascular para cardio no dia a dia",
    ],
    howToTake:
      "Ingerir 2 cápsulas ao dia. Sendo 1 cápsula pela manhã e a 2ª cápsula de preferência 30 minutos antes do almoço ou treino. Evitar tomar após as 18h para não interferir no sono.",
    nutritionalFacts: {
      portion: "2 cápsulas (1,2g)",
      items: [
        { name: "Extrato de Laranja Moro", amount: "400mg", dailyValue: "**" },
        { name: "Cafeína Anidra", amount: "300mg", dailyValue: "**" },
        { name: "Cromo Picolinato", amount: "250mcg", dailyValue: "714%" },
        { name: "Extrato de Chá Verde", amount: "200mg", dailyValue: "**" },
      ],
    },
  },
  {
    id: "omega3-ultra",
    name: "Ômega 3 Ultra DHA 1000 TG",
    category: "vitaminas",
    goal: "saude",
    price: 99.9,
    rating: 4.9,
    reviewCount: 412,
    tag: "Matéria-Prima Premium 🐟",
    image: "https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=500&q=80",
    accentColor: "amber",
    description:
      "Óleo de peixe de águas profundas de alta qualidade, enriquecido na forma triglicerídica (TG) para melhor absorção biológica. Apresenta alta concentração de EPA e DHA, os ácidos graxos indispensáveis para manter a mente em alta performance.",
    benefits: [
      "Selo MEG-3 de pureza livre de metais pesados",
      "Alta concentração de DHA (500mg) e EPA (400mg) por cápsula",
      "Suporte vital e protetor para a saúde cerebral e foco",
      "Reduz triglicerídeos e previne inflamação celular",
    ],
    howToTake:
      "Tomar 2 cápsulas ao dia, de preferência acompanhadas das suas maiores refeições (como almoço e jantar) para melhorar a tolerabilidade e a digestão do óleo.",
    nutritionalFacts: {
      portion: "2 cápsulas",
      items: [
        { name: "Óleo de Peixe", amount: "2000mg", dailyValue: "**" },
        { name: "EPA (Ácido Eicosapentaenóico)", amount: "800mg", dailyValue: "**" },
        { name: "DHA (Ácido Docosahexaenóico)", amount: "600mg", dailyValue: "**" },
        { name: "Vitamina E", amount: "10mg", dailyValue: "100%" },
      ],
    },
  },
];
