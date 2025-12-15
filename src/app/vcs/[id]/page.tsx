import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { ArrowLeft, Building2, ExternalLink } from "lucide-react";
import { VCReviewSection } from "@/components/vc-review-section";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function VCPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch VC details
  const { data: vc, error: vcError } = await supabase
    .from("vc")
    .select("id, name, website")
    .eq("id", id)
    .single();

  if (vcError || !vc) {
    notFound();
  }

  // Fetch reviews for this VC
  const { data: rawReviews, error: reviewsError } = await supabase
    .from("review")
    .select(`
      id,
      content,
      created_at,
      validation_group:validation_group_id (
        id,
        name
      )
    `)
    .eq("vc_id", id)
    .order("created_at", { ascending: false });

  if (reviewsError) {
    console.error("Error fetching reviews:", reviewsError);
  }

  // Transform reviews to flatten the validation_group relation
  const reviews = rawReviews?.map((review) => ({
    ...review,
    validation_group: review.validation_group as unknown as { id: string; name: string } | null,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link href="/vcs">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to VCs
          </Button>
        </Link>

        {/* VC Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{vc.name}</h1>
            {vc.website && (
              <a
                href={vc.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-1"
              >
                {vc.website.replace(/^https?:\/\//, "")}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {reviews?.length ?? 0} {(reviews?.length ?? 0) === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>

        <VCReviewSection vcId={vc.id} vcName={vc.name} reviews={reviews ?? []} />
      </main>
    </div>
  );
}
