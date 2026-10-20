// Ayudante de pruebas de integración: clientes de Supabase "pruebas" y sesiones reales sin
// correo (el enlace mágico se genera con la API de administración y se canjea aquí).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { fetchConReintento } from "@/lib/fetch-con-reintento";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const opciones = { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: fetchConReintento } };

export const servicio = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, opciones);
export const anonimo = createClient(url, anonKey, opciones);

const usuariosCreados: string[] = [];

export async function sesionDe(correo: string): Promise<SupabaseClient> {
  const creado = await servicio.auth.admin.createUser({ email: correo, email_confirm: true });
  if (creado.error) throw creado.error;
  usuariosCreados.push(creado.data.user.id);
  const enlace = await servicio.auth.admin.generateLink({ type: "magiclink", email: correo });
  if (enlace.error) throw enlace.error;
  const cliente = createClient(url, anonKey, opciones);
  const { error } = await cliente.auth.verifyOtp({ token_hash: enlace.data.properties.hashed_token, type: "magiclink" });
  if (error) throw error;
  return cliente;
}

export async function borrarUsuariosCreados() {
  for (const id of usuariosCreados.splice(0)) await servicio.auth.admin.deleteUser(id);
}
