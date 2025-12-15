"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Identity } from "@semaphore-protocol/identity";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ShieldX, Send, CheckCircle, AlertCircle, RotateCcw, ArrowLeft } from "lucide-react";
import { IDENTITY_STORAGE_PREFIX, getGroupIdFromStorageKey, getIdentityStorageKey, IDENTITY_CHANGED_EVENT, OPTIMISTIC_SUBMISSION_STATE, OptimisticSubmissionState } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { VerifyModal } from "@/components/verify-modal";
import { ReviewList } from "@/components/review-list";

type VerifiedGroup = {
  id: string;
  name: string;
};

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
  vcId: string;
  vcName: string;
  reviews: Review[];
};

export function VCReviewSection({ vcId, vcName, reviews }: Props) {
  const [content, setContent] = useState("");
  const [submitStatus, setSubmitStatus] = useState<OptimisticSubmissionState>(OPTIMISTIC_SUBMISSION_STATE.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [submittedReview, setSubmittedReview] = useState<string | null>(null);
  const [verifiedGroups, setVerifiedGroups] = useState<VerifiedGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load verified groups
  const loadVerifiedGroups = useCallback(async () => {
    const groupIds: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(IDENTITY_STORAGE_PREFIX)) {
        const groupId = getGroupIdFromStorageKey(key);
        if (groupId) {
          groupIds.push(groupId);
        }
      }
    }

    if (groupIds.length === 0) {
      setVerifiedGroups([]);
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("validation_group")
      .select("id, name")
      .in("id", groupIds);

    if (!error && data) {
      setVerifiedGroups(data);
    }
    setIsLoading(false);
  }, []);

  // Load on mount and listen for identity changes
  useEffect(() => {
    loadVerifiedGroups();

    window.addEventListener(IDENTITY_CHANGED_EVENT, loadVerifiedGroups);
    return () => {
      window.removeEventListener(IDENTITY_CHANGED_EVENT, loadVerifiedGroups);
    };
  }, [loadVerifiedGroups]);

  const handleSubmit = async (retryContent?: string) => {
    const reviewContent = retryContent || content.trim();
    if (!reviewContent || verifiedGroups.length === 0) return;

    setSubmittedReview(reviewContent);
    setSubmitStatus(OPTIMISTIC_SUBMISSION_STATE.SUBMITTING);
    setError(null);
    if (!retryContent) setContent("");

    try {
      // Get the first verified group's identity
      const group = verifiedGroups[0];
      const savedIdentity = localStorage.getItem(getIdentityStorageKey(group.id));

      if (!savedIdentity) {
        throw new Error("Identity not found");
      }

      // Recreate identity and generate nullifier
      const identity = new Identity(savedIdentity);

      // Generate nullifier: hash of (identity secret + vcId)
      const nullifierData = `${identity.export()}-${vcId}`;
      const nullifierHash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(nullifierData)
      );
      const nullifier = Array.from(new Uint8Array(nullifierHash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vcId,
          validationGroupId: group.id,
          nullifier,
          content: reviewContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      setSubmitStatus(OPTIMISTIC_SUBMISSION_STATE.SUCCESS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
      setSubmitStatus(OPTIMISTIC_SUBMISSION_STATE.ERROR);
    }
  };

  // Render the form section (or success state)
  const renderFormSection = () => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </div>
          </CardContent>
        </Card>
      );
    }

    if (verifiedGroups.length === 0) {
      return (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldX className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Verification required</p>
                  <p className="text-sm text-muted-foreground">
                    Verify your founder status to leave a review.
                  </p>
                </div>
              </div>
              <VerifyModal
                trigger={
                  <Button size="sm">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Verify
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>
      );
    }

    // Show success state with back button
    if (submitStatus === OPTIMISTIC_SUBMISSION_STATE.SUCCESS) {
      return (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Review submitted</p>
                  <p className="text-sm text-muted-foreground">
                    Thanks for sharing your experience with {vcName}.
                  </p>
                </div>
              </div>
              <Link href="/vcs">
                <Button size="sm" variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to VCs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Show the form
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-4 w-4" />
            Write a Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Posting as:</span>
            <Badge variant="secondary" className="text-xs">
              <ShieldCheck className="mr-1 h-3 w-3 text-green-500" />
              {verifiedGroups[0].name} founder
            </Badge>
          </div>

          <Textarea
            placeholder={`Share your experience with ${vcName}...`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />

          <Button
            onClick={() => handleSubmit()}
            disabled={submitStatus === OPTIMISTIC_SUBMISSION_STATE.SUBMITTING || !content.trim()}
            className="w-full"
          >
            {submitStatus === OPTIMISTIC_SUBMISSION_STATE.SUBMITTING ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Anonymous Review
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Your identity is protected by zero-knowledge cryptography.
          </p>
        </CardContent>
      </Card>
    );
  };

  // Render the optimistic review card
  const renderOptimisticReview = () => {
    if (!submittedReview) return null;

    return (
      <Card className={submitStatus === OPTIMISTIC_SUBMISSION_STATE.SUBMITTING ? "opacity-70" : ""}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-3">
            <Badge variant="secondary" className="text-xs">
              <ShieldCheck className="mr-1 h-3 w-3 text-green-500" />
              {verifiedGroups[0]?.name} founder
            </Badge>
            <div className="flex items-center gap-2">
              {submitStatus === OPTIMISTIC_SUBMISSION_STATE.SUBMITTING && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Posting...</span>
                </>
              )}
              {submitStatus === OPTIMISTIC_SUBMISSION_STATE.SUCCESS && (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Just now</span>
                </>
              )}
              {submitStatus === OPTIMISTIC_SUBMISSION_STATE.ERROR && (
                <>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleSubmit(submittedReview)}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Try again
                  </Button>
                </>
              )}
            </div>
          </div>
          <p className="text-sm leading-relaxed">{submittedReview}</p>
          {submitStatus === OPTIMISTIC_SUBMISSION_STATE.ERROR && error && (
            <p className="text-xs text-destructive mt-2">{error}</p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {/* Review Form */}
      <div className="mb-8">
        {renderFormSection()}
      </div>

      {/* Reviews List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Reviews</h2>
        <div className="space-y-4">
          {renderOptimisticReview()}
          <ReviewList reviews={reviews} />
        </div>
      </div>
    </>
  );
}
