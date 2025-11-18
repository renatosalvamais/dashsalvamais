// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const admin = createClient(supabaseUrl, serviceKey);

function digitsOnly(v: string): string {
  return (v || "").replace(/\D/g, "");
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  // Supabase Admin API doesn't provide direct filter by email, so we paginate and search.
  const perPage = 200;
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found.id;
    if (!data || (data.users?.length ?? 0) < perPage) break;
  }
  return null;
}

async function upsertRole(userId: string, cnpjDigits: string) {
  // Evita 400 quando não há restrição única de user_id: verifica e atualiza/insere manualmente
  const { data: existing, error: selErr } = await admin
    .from("user_roles")
    .select("id, user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing?.id) {
    const { error: updErr } = await admin
      .from("user_roles")
      .update({ role: "rh", cnpj: cnpjDigits })
      .eq("id", existing.id);
    if (updErr) throw updErr;
  } else {
    const { error: insErr } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role: "rh", cnpj: cnpjDigits });
    if (insErr) throw insErr;
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  } as Record<string, string>;
}

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { status: 200, headers: corsHeaders() });
    }
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders() });
    }

    const body = await req.json().catch(() => ({}));
    const rawCnpj: string = String(body.cnpj || "");
    const nome: string | undefined = body.nome ? String(body.nome) : undefined;
    const cnpjDigits = digitsOnly(rawCnpj);
    if (cnpjDigits.length !== 14) {
      return new Response(JSON.stringify({ error: "CNPJ inválido: informe 14 dígitos" }), { status: 400, headers: corsHeaders() });
    }

    const email = `${cnpjDigits}@empresa.com`;
    const password = cnpjDigits; // senha padrão = próprio CNPJ

    // Tenta criar usuário
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: nome ? { nome_empresa: nome } : undefined,
    });

    let userId: string | null = null;
    if (error) {
      // Se já existe, tenta localizar e seguir
      if (String(error.message).toLowerCase().includes("already registered")) {
        userId = await findUserIdByEmail(email);
        if (!userId) {
          return new Response(JSON.stringify({ error: "Usuário já existe mas não foi possível localizar o ID" }), { status: 400, headers: corsHeaders() });
        }
      } else {
        return new Response(JSON.stringify({ error: error.message || "Falha ao criar usuário" }), { status: 400, headers: corsHeaders() });
      }
    } else {
      userId = data?.user?.id ?? null;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "ID do usuário não encontrado" }), { status: 400, headers: corsHeaders() });
    }

    // Upsert role
    await upsertRole(userId, cnpjDigits);

    return new Response(JSON.stringify({ ok: true, user_id: userId, email }), {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || String(err) }), { status: 500, headers: corsHeaders() });
  }
}

// Deno serve
// @ts-ignore: Deno global
if (typeof Deno !== "undefined") {
  // @ts-ignore
  Deno.serve(handler);
}