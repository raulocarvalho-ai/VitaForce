import { GoogleGenAI } from "@google/genai";
import { PRODUCTS } from "../../data/products";

export async function generateRecommendationOnServer(
  messages: { role: string; content: string }[],
  userProfile?: {
    age?: string;
    gender?: string;
    goal?: string;
    diet?: string;
    restrictions?: string;
  },
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      reply:
        "Erro: Chave de API do Gemini (GEMINI_API_KEY) não configurada no servidor. Por favor, adicione-a nas configurações de segredos do AI Studio.",
      error: true,
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    // Prepare context for the prompt
    const serializedProducts = PRODUCTS.map((p) => ({
      id: p.id,
      nome: p.name,
      categoria: p.category,
      objetivo: p.goal,
      preco: `R$ ${p.price.toFixed(2)}`,
      descricao: p.description,
      beneficios: p.benefits.join(", "),
      comoTomar: p.howToTake,
    }));

    const systemInstruction = `Você é um Nutricionista Virtual e Consultor de Suplementos especializado da "VitaForce Suplementos", uma renomada marca brasileira de suplementação de alta performance e saúde.
Seu objetivo é orientar os usuários, de forma empática, profissional, científica e segura, a alcançarem seus objetivos de saúde e fitness utilizando nossa linha de suplementos disponíveis em estoque.

Estes são os PRODUTOS DISPONÍVEIS na VitaForce em tempo real:
${JSON.stringify(serializedProducts, null, 2)}

DIRETRIZES DE ATENDIMENTO:
1. Seja sempre amigável, acolhedor e fale em português do Brasil (PT-BR).
2. Se o usuário informar dados de perfil (como idade, gênero, objetivo, dieta ou restrições de saúde), leve isso em consideração ao montar sua recomendação.
3. SEMPRE recomende suplementos que estão na lista de PRODUTOS DISPONÍVEIS acima. Mencione os nomes exatos do produto e justifique como ele ajudará a sanar o objetivo do cliente.
4. Explique resumidamente o porquê da recomendação, como utilizá-la da melhor maneira (regras de dosagem e horários baseados no campo 'comoTomar' oficial de cada produto) e dê dicas de hábitos saudáveis, hidratação e alimentação equilibrada.
5. Seja ético: faça recomendações seguras. Se o usuário citar condições de saúde sérias ou alergias severas (como lactose), consulte as especificações ou sugira produtos compatíveis (como o nosso Whey Isolado que é zero lactose). Lembre o cliente de consultar um médico ou nutricionista presencial.
6. Mantenha as respostas concisas, escaneáveis (com bullets, negritos e parágrafos curtos) para facilitar a leitura em um painel lateral de chat. Não use termos técnicos excessivos sem explicá-los.`;

    // Convert thread history to Gemini's format
    const genAiContents = messages.map((msg) => ({
      role: msg.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: msg.content }],
    }));

    // If we have a user profile, we inject a prompt showing current context before generating
    let currentPrompt = "";
    if (userProfile && messages.length <= 1) {
      const { age, gender, goal, diet, restrictions } = userProfile;
      currentPrompt = `[Ficha do Cliente]
Idade: ${age || "Não informado"}
Gênero: ${gender || "Não informado"}
Objetivo Principal: ${goal || "Não informado"}
Dieta: ${diet || "Não informado"}
Restrições/Alergias: ${restrictions || "Não informado"}

Por favor, faça uma recomendação inicial e personalizada baseada neste perfil. Diga olá e convide-me a fazer perguntas!`;

      // Append this context request
      genAiContents.push({
        role: "user" as const,
        parts: [{ text: currentPrompt }],
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents:
        genAiContents.length > 0
          ? genAiContents
          : ["Olá! Como você pode me ajudar a melhorar minha performance?"],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return {
      reply:
        response.text ||
        "Desculpe, não consegui formular uma recomendação agora. Tente me perguntar de outra forma!",
      error: false,
    };
  } catch (err) {
    console.error("Gemini API Error in getAIRecommendation:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      reply: `Ocorreu um erro ao processar sua recomendação de IA: ${errorMessage}. Verifique os logs do servidor.`,
      error: true,
    };
  }
}
