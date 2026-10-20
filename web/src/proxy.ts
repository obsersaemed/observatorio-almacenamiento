// Proxy de /admin: renueva la sesión de Supabase (cookies), como recomienda @supabase/ssr,
// y decide el acceso antes de renderizar (RF-07). RLS sigue protegiendo los datos.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { decidirAcceso, destinoProxy } from "@/lib/acceso";
import { fetchConReintento } from "@/lib/fetch-con-reintento";

export async function proxy(peticion: NextRequest) {
  let respuesta = NextResponse.next({ request: peticion });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { fetch: fetchConReintento },
    cookies: {
      getAll: () => peticion.cookies.getAll(),
      setAll: (lista) => {
        for (const { name, value } of lista) peticion.cookies.set(name, value);
        respuesta = NextResponse.next({ request: peticion });
        for (const { name, value, options } of lista) respuesta.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const correo = data.user?.email ?? null;
  const esEditor = correo ? (await supabase.rpc("es_editor")).data === true : false;
  const destino = destinoProxy(peticion.nextUrl.pathname, decidirAcceso({ correo, esEditor }));
  if (!destino) return respuesta;

  const redireccion = NextResponse.redirect(new URL(destino, peticion.url));
  for (const cookie of respuesta.cookies.getAll()) redireccion.cookies.set(cookie);
  return redireccion;
}

export const config = { matcher: ["/admin/:path*"] };
