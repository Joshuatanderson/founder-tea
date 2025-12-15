"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, Loader2, Lock, Unlock } from "lucide-react";

type ValidationGroup = {
  id: string;
  name: string;
};

export function VerifyModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [allGroups, setAllGroups] = useState<ValidationGroup[]>([]);
  const [matchingGroupIds, setMatchingGroupIds] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Extract domain from email
  const getDomain = (email: string) => {
    const parts = email.split("@");
    if (parts.length === 2 && parts[1].includes(".")) {
      return parts[1].toLowerCase();
    }
    return null;
  };

  // Load all available groups when modal opens
  useEffect(() => {
    if (open && allGroups.length === 0) {
      setIsLoadingGroups(true);
      const supabase = createClient();
      supabase
        .from("validation_group")
        .select("id, name")
        .then(({ data, error }) => {
          if (!error && data) {
            setAllGroups(data);
          }
          setIsLoadingGroups(false);
        });
    }
  }, [open, allGroups.length]);

  // Debounced search for matching validation groups
  const searchGroups = useCallback(async (domain: string) => {
    setIsSearching(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("validation_group_member")
        .select(`
          validation_group:validation_group_id (
            id,
            name
          )
        `)
        .eq("domain", domain);

      if (error) {
        console.error("Error searching groups:", error);
        setMatchingGroupIds(new Set());
        return;
      }

      // Extract the validation group IDs from the nested response
      const ids = new Set(
        data
          ?.map((item) => (item.validation_group as unknown as ValidationGroup)?.id)
          .filter(Boolean) || []
      );

      setMatchingGroupIds(ids);
    } catch (err) {
      console.error("Error:", err);
      setMatchingGroupIds(new Set());
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce effect
  useEffect(() => {
    const domain = getDomain(email);

    if (!domain) {
      setMatchingGroupIds(new Set());
      return;
    }

    const timer = setTimeout(() => {
      searchGroups(domain);
    }, 300);

    return () => clearTimeout(timer);
  }, [email, searchGroups]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setEmail("");
      setMatchingGroupIds(new Set());
      setSentCode(null);
      setSendError(null);
    }
  }, [open]);

  // Get the name of the first matched group
  const getMatchedNetworkName = () => {
    const matchedGroup = allGroups.find((g) => matchingGroupIds.has(g.id));
    return matchedGroup?.name || "Unknown";
  };

  const handleSendCode = async () => {
    setIsSending(true);
    setSendError(null);

    try {
      const response = await fetch("/api/verify/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          networkName: getMatchedNetworkName(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send code");
      }

      // Store the code for display (remove in production)
      setSentCode(data.code);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setIsSending(false);
    }
  };

  const hasMatch = matchingGroupIds.size > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" />}>
        <ShieldCheck className="mr-2 h-4 w-4" />
        Verify
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Prove membership, stay anonymous</DialogTitle>
          <DialogDescription>
            Your email verifies your network — then disappears. Only your proof remains.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Available networks */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Supported networks</p>
            {isLoadingGroups ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allGroups.map((group) => {
                  const isMatched = matchingGroupIds.has(group.id);
                  return (
                    <Badge
                      key={group.id}
                      variant={isMatched ? "default" : "outline"}
                      className={
                        isMatched
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground border-muted-foreground/30"
                      }
                    >
                      {isMatched ? (
                        <Unlock className="mr-1 h-3 w-3" />
                      ) : (
                        <Lock className="mr-1 h-3 w-3" />
                      )}
                      {group.name}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Email input */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Your work email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Test: gmail.com (Test Moon), mailinator.com (Test Sun)
            </p>
          </div>

          {/* Status */}
          {isSearching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking domain...
            </div>
          )}

          {!isSearching && email && getDomain(email) && !hasMatch && (
            <p className="text-sm text-muted-foreground">
              No matching accelerators for this domain.
            </p>
          )}

          {/* Error message */}
          {sendError && (
            <p className="text-sm text-destructive">{sendError}</p>
          )}

          {/* Send code button */}
          {hasMatch && !sentCode && (
            <Button onClick={handleSendCode} disabled={isSending} className="w-full">
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send verification code"
              )}
            </Button>
          )}

          {/* Code sent confirmation */}
          {sentCode && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4 text-center">
              <p className="text-sm text-green-500 mb-2">
                Code sent to {email}
              </p>
              <p className="text-xs text-muted-foreground">
                (Dev mode: {sentCode})
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
