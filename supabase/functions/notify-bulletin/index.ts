import { serve } from "https://deno.land/std/http/server.ts";

serve(async () => {
  const tokensRes = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/rest/v1/push_tokens?select=token`,
    {
      headers: {
        apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
    }
  );

  const tokens = await tokensRes.json();

  const messages = tokens.map((t: any) => ({
    to: t.token,
    sound: "default",
    title: "New Bulletin",
    body: "A new bulletin has been posted",
  }));

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });

  return new Response("ok");
});