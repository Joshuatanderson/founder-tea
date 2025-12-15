"use client";

import { useState, useEffect } from "react";
import { Identity } from "@semaphore-protocol/identity";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ShieldX, Send } from "lucide-react";
import { IDENTITY_STORAGE_PREFIX, getGroupIdFromStorageKey, getIdentityStorageKey } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

type VerifiedGroup = {
  id: string;
  name: string;
};

type Props = {
  vcId: string;
  vcName: string;
};

export function ReviewForm({ vcId, vcName }: Props) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [verifiedGroups, setVerifiedGroups] = useState<VerifiedGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load verified groups on mount
  useEffect(() => {
    const loadVerifiedGroups = async () => {
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
    };

    loadVerifiedGroups();
  }, []);

  const handleSubmit = async () => {
    if (!content.trim() || verifiedGroups.length === 0) return;

    setIsSubmitting(true);
    setError(null);

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
      // Using a simple approach: convert to string and hash
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
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      setSuccess(true);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="flex items-center gap-3">
            <ShieldX className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Verification required</p>
              <p className="text-sm text-muted-foreground">
                You need to verify your founder status before you can leave a review.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-3 text-green-500">
            <ShieldCheck className="h-5 w-5" />
            <div>
              <p className="font-medium">Review submitted!</p>
              <p className="text-sm text-muted-foreground">
                Your anonymous review has been posted.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            {verifiedGroups[0].name}
          </Badge>
        </div>

        <Textarea
          placeholder={`Share your experience with ${vcName}...`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !content.trim()}
          className="w-full"
        >
          {isSubmitting ? (
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
}
