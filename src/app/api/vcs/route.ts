import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, website, linkedin } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return Response.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const { data: vc, error } = await supabase
      .from("vc")
      .insert({
        name: name.trim(),
        website: website || null,
        linkedin: linkedin || null,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return Response.json(
          { error: "A VC with this name already exists" },
          { status: 409 }
        );
      }
      console.error("[vcs] Insert error:", error);
      return Response.json(
        { error: "Failed to add VC" },
        { status: 500 }
      );
    }

    return Response.json({ success: true, vcId: vc.id });
  } catch (error) {
    console.error("[vcs] API error:", error);
    return Response.json(
      { error: "Failed to add VC" },
      { status: 500 }
    );
  }
}
