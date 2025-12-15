"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

type Review = {
  id: string;
  content: string;
  created_at: string;
  validation_group: {
    id: string;
    name: string;
  } | null;
};

type Props = {
  reviews: Review[];
};

export function ReviewList({ reviews }: Props) {
  if (reviews.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        No reviews yet. Be the first to share your experience.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-3">
              <Badge variant="secondary" className="text-xs">
                <ShieldCheck className="mr-1 h-3 w-3 text-green-500" />
                {review.validation_group?.name ? `${review.validation_group.name} founder` : "Verified founder"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <p className="text-sm leading-relaxed">{review.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
