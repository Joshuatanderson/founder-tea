import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, ExternalLink } from "lucide-react";

export default async function VCsPage() {
  const supabase = await createClient();

  // Fetch all VCs with review counts
  const { data: vcs, error } = await supabase
    .from("vc")
    .select(`
      id,
      name,
      website,
      review:review(count)
    `)
    .order("name");

  if (error) {
    console.error("Error fetching VCs:", error);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            founder<span className="text-primary">tea</span> 🍵
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Find a VC</h1>
          <p className="mt-2 text-muted-foreground">
            Browse VCs and read anonymous reviews from verified founders.
          </p>
        </div>

        {/* VC Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vcs?.map((vc) => {
            const reviewCount = (vc.review as { count: number }[])?.[0]?.count ?? 0;

            return (
              <Link key={vc.id} href={`/vcs/${vc.id}`}>
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium">{vc.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                          </p>
                        </div>
                      </div>
                      {vc.website && (
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {(!vcs || vcs.length === 0) && (
          <p className="text-center text-muted-foreground py-12">
            No VCs found.
          </p>
        )}
      </main>
    </div>
  );
}
