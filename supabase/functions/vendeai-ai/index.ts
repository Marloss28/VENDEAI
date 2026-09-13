import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://www.vendeai.dev.br",
  "https://vendeai.dev.br",
  "https://vendeai-dun.vercel.app",
]);

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://www.vendeai.dev.br";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });

const baseInstructions = `Você é a IA da VendeAI, especializada em vendas e marketing digital. Responda sempre em português do Brasil, de forma natural, prática, humana e específica para o contexto. Nunca invente resultados, depoimentos, escassez, urgência, garantias ou provas sociais. Não use pressão enganosa. Quando fizer sentido, entregue uma mensagem pronta para copiar.`;

function detectMode(rawMode: string, input: string) {
  const requested = String(rawMode || "").trim().toLowerCase();
  if (["conversation_analysis", "objection", "followup", "content", "assistant"].includes(requested)) return requested;
  const text = input.toLowerCase();
  if (/analise a conversa|conversa analisada|nível de interesse|nivel de interesse|sinais importantes/.test(text)) return "conversation_analysis";
  if (/objeção|objecao|quebrar obje|contornar obje/.test(text)) return "objection";
  if (/follow-up|follow up|retomar a conversa|conversa esfriou/.test(text)) return "followup";
  if (/crie conteúdo|criar conteúdo|conteúdo de marketing|roteiro|legenda|carrossel|reel|post/.test(text)) return "content";
  if (/assistente de vendas|melhor próximo passo|melhor proximo passo/.test(text)) return "assistant";
  return "sales_message";
}

function modeInstructions(mode: string) {
  const map: Record<string, string> = {
    sales_message: `${baseInstructions}\nCrie uma resposta ou mensagem de vendas adequada ao contexto. Seja direto e persuasivo sem soar robótico.`,
    conversation_analysis: `${baseInstructions}\nAnalise a conversa. Informe: nível de interesse do lead, sinais importantes, objeção principal se houver, o que não fazer agora, melhor próximo passo e uma mensagem pronta para enviar.`,
    objection: `${baseInstructions}\nAnalise a objeção. Explique o que ela provavelmente significa, como responder sem pressionar, entregue uma resposta pronta e uma versão curta.`,
    followup: `${baseInstructions}\nCrie um follow-up natural. Informe a melhor abordagem, entregue uma mensagem principal, uma versão mais direta e o que fazer se a pessoa não responder.`,
    content: `${baseInstructions}\nCrie conteúdo de marketing de alta qualidade conforme o contexto. Inclua gancho, conteúdo completo, CTA, legenda quando fizer sentido e 3 ideias de título.`,
    assistant: `${baseInstructions}\nAtue como assistente de vendas. Analise a situação, diga o melhor próximo passo, entregue uma mensagem pronta e um cuidado importante para não perder a venda.`,
  };
  return map[mode] || map.sales_message;
}

function extractText(data: any): string {
  if (typeof data?.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  const parts: string[] = [];
  if (Array.isArray(data?.output)) {
    for (const item of data.output) {
      if (!Array.isArray(item?.content)) continue;
      for (const content of item.content) {
        if (content?.type === "output_text" && typeof content?.text === "string") parts.push(content.text);
      }
    }
  }
  return parts.join("\n").trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "method_not_allowed" }, 405);

  const origin = req.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(req, { error: "origin_not_allowed" }, 403);

  const declaredLength = Number(req.headers.get("content-length") || 0);
  if (declaredLength > 20000) return json(req, { error: "request_too_large" }, 413);

  const supabaseUrl = String(Deno.env.get("SUPABASE_URL") || "").trim();
  const serviceRole = String(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();
  const apiKey = String(Deno.env.get("OPENAI_API_KEY") || "").trim();
  if (!supabaseUrl || !serviceRole || !apiKey) return json(req, { error: "Serviço temporariamente indisponível." }, 503);

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json(req, { error: "Sessão inválida. Entre novamente na sua conta." }, 401);

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) return json(req, { error: "Sua sessão expirou. Entre novamente." }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json(req, { error: "Requisição inválida." }, 400); }

  const input = String(body?.input ?? "").trim();
  if (!input) return json(req, { error: "Escreva um contexto para a IA." }, 400);
  if (input.length > 8000) return json(req, { error: "O texto está muito longo. Reduza um pouco e tente novamente." }, 400);

  const mode = detectMode(String(body?.mode ?? "sales_message"), input);

  const { data: profile, error: profileError } = await admin.from("profiles").select("plan,access_status").eq("id", user.id).single();
  if (profileError || !profile || profile.access_status !== "active") return json(req, { error: "Acesso indisponível." }, 403);
  if (mode !== "sales_message" && profile.plan !== "pro") return json(req, { error: "Este recurso requer o plano PRO.", code: "pro_required" }, 403);

  const { error: resetError } = await admin.rpc("reset_daily_ai_credits", { p_user_id: user.id });
  if (resetError) {
    console.error("credit reset error");
    return json(req, { error: "Não foi possível verificar seus créditos agora." }, 500);
  }

  const { data: beginRows, error: beginError } = await admin.rpc("server_ai_begin", { p_user_id: user.id });
  if (beginError) {
    console.error("credit begin error");
    return json(req, { error: "Não foi possível iniciar a geração agora." }, 500);
  }

  const begin = Array.isArray(beginRows) ? beginRows[0] : beginRows;
  if (!begin?.allowed) {
    const remaining = Number(begin?.credits_remaining ?? 0);
    if (remaining > 0) {
      return json(req, { error: "Muitas gerações em pouco tempo. Aguarde um minuto e tente novamente.", code: "rate_limited", credits_remaining: remaining }, 429);
    }
    return json(req, { error: "Seus créditos de IA acabaram por hoje.", code: "credits_exhausted", credits_remaining: 0, plan: String(begin?.plan ?? "free") }, 402);
  }

  let finished = false;
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        instructions: modeInstructions(mode),
        input,
        max_output_tokens: 900,
        reasoning: { effort: "none" },
      }),
    });

    const raw = await response.text();
    let data: any = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }

    if (!response.ok) {
      console.error("OpenAI API error", response.status);
      await admin.rpc("server_ai_finish", { p_user_id: user.id, p_feature: mode, p_input: input, p_output: "", p_success: false });
      finished = true;
      return json(req, { error: "A IA não conseguiu responder agora.", code: "ai_provider_error" }, 502);
    }

    const text = extractText(data);
    if (!text) {
      await admin.rpc("server_ai_finish", { p_user_id: user.id, p_feature: mode, p_input: input, p_output: "", p_success: false });
      finished = true;
      return json(req, { error: "A IA respondeu sem conteúdo. Tente novamente." }, 502);
    }

    const { data: remaining, error: finishError } = await admin.rpc("server_ai_finish", {
      p_user_id: user.id,
      p_feature: mode,
      p_input: input,
      p_output: text,
      p_success: true,
    });
    if (finishError) console.error("credit/history finish error");
    finished = true;
    return json(req, { text, mode, credits_remaining: Number(remaining ?? begin?.credits_remaining ?? 0) });
  } catch (error) {
    console.error("vendeai-ai internal error");
    if (!finished) {
      try { await admin.rpc("server_ai_finish", { p_user_id: user.id, p_feature: mode, p_input: input, p_output: "", p_success: false }); } catch {}
    }
    return json(req, { error: "Erro interno da VendeAI. Tente novamente em instantes." }, 500);
  }
});
