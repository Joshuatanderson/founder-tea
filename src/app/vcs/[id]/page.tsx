import Link from "next/link";
import { notFound } from "next/navigation";
import { sql, isUuid } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { ArrowLeft, Building2, ExternalLink, Linkedin } from "lucide-react";
import { VCReviewSection } from "@/components/vc-review-section";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function VCPage({ params }: Props) {
  const { id } = await params;
  if (!isUuid(id)) {
    notFound();
  }

  // Fetch VC details
  const [vc] = await sql<{
    id: string;
    name: string;
    website: string | null;
    linkedin: string | null;
  }>`select id, name, website, linkedin from vc where id = ${id}`;

  if (!vc) {
    notFound();
  }

  // Fetch reviews for this VC
  const rawReviews = await sql<{
    id: string;
    content: string;
    created_at: Date;
    group_id: string;
    group_name: string;
  }>`
    select review.id, review.content, review.created_at,
           g.id as group_id, g.name as group_name
    from review
    join validation_group g on g.id = review.validation_group_id
    where review.vc_id = ${id}
    order by review.created_at desc`;

  const reviews = rawReviews.map((review) => ({
    id: review.id,
    content: review.content,
    created_at: new Date(review.created_at).toISOString(),
    validation_group: { id: review.group_id, name: review.group_name },
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
            <div className="flex items-center gap-3 mt-1">
              {vc.website && (
                <a
                  href={vc.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  {vc.website.replace(/^https?:\/\//, "")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {vc.linkedin && (
                <a
                  href={vc.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
            </div>
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
