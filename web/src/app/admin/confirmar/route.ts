// Destino del enlace mágico: canjea el código por la sesión (cookies) y entra a /admin.
import { NextResponse, type NextRequest } from "next/server";
import { clienteConSesion } from "@/lib/acceso-supabase";

export async function GET(peticion: NextRequest) {
  const codigo = peticion.nextUrl.searchParams.get("code");
  if (codigo) {
    const supabase = await clienteConSesion();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) return NextResponse.redirect(new URL("/admin", peticion.url));
  }
  return NextResponse.redirect(new URL("/admin/entrar?error=enlace", peticion.url));
}
