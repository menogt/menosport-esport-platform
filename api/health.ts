type HealthResponse = {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
};

const isSet = (name: string) => Boolean(process.env[name]);

/**
 * Reports which server-side configuration is present (booleans only, never values) so a
 * misconfigured deployment can be diagnosed from the live domain.
 */
export default function handler(_req: unknown, res: HealthResponse) {
  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.end(
    JSON.stringify({
      ok: true,
      runtime: "vercel-node",
      config: {
        supabaseUrl: isSet("VITE_SUPABASE_URL") || isSet("SUPABASE_URL"),
        supabaseAnonKey: isSet("VITE_SUPABASE_ANON_KEY") || isSet("SUPABASE_ANON_KEY"),
        supabaseServiceRoleKey: isSet("SUPABASE_SERVICE_ROLE_KEY"),
        databaseUrl: isSet("DATABASE_URL"),
      },
    })
  );
}
