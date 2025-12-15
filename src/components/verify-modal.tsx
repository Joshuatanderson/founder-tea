"use client";

import { useState, useEffect, useCallback } from "react";
import { Identity } from "@semaphore-protocol/identity";
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
import { ShieldCheck, Loader2, Lock, Unlock, CheckCircle, ArrowLeft } from "lucide-react";

type ValidationGroup = {
  id: string;
  name: string;
};

type Step = "email" | "code" | "select-group" | "success";

export function VerifyModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("email");

  // Email step state
  const [email, setEmail] = useState("");
  const [allGroups, setAllGroups] = useState<ValidationGroup[]>([]);
  const [matchingGroupIds, setMatchingGroupIds] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // Code step state
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [eligibleGroups, setEligibleGroups] = useState<ValidationGroup[]>([]);
  const [verificationCode, setVerificationCode] = useState("");

  // Group selection step state
  const [selectedGroup, setSelectedGroup] = useState<ValidationGroup | null>(null);

  // Loading/error state
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setStep("email");
      setEmail("");
      setMatchingGroupIds(new Set());
      setToken(null);
      setExpiresAt(null);
      setEligibleGroups([]);
      setVerificationCode("");
      setSelectedGroup(null);
      setError(null);
    }
  }, [open]);

  const handleSendCode = async () => {
    if (!hasMatch) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/verify/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send code");
      }

      // Store token and eligible groups
      setToken(data.token);
      setExpiresAt(data.expiresAt);
      setEligibleGroups(data.eligibleGroups || []);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!token) return;

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch("/api/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify code");
      }

      // Move to group selection step
      setStep("select-group");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify code");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegisterCommitment = async (group: ValidationGroup) => {
    if (!token) return;

    setIsRegistering(true);
    setError(null);
    setSelectedGroup(group);

    try {
      // Generate fresh Semaphore identity
      const identity = new Identity();
      const commitment = identity.commitment.toString();

      console.log("[verify-modal] Generated identity commitment:", commitment.slice(0, 20) + "...");

      const response = await fetch("/api/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          code: verificationCode,
          groupId: group.id,
          commitment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to register commitment");
      }

      // Save identity to localStorage for future proof generation
      // The identity's privateKey can be used to recreate it later
      const storageKey = `semaphore-identity-${group.id}`;
      localStorage.setItem(storageKey, identity.export());
      console.log("[verify-modal] Identity saved to localStorage");

      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
      setSelectedGroup(null);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleBack = () => {
    if (step === "select-group") {
      setStep("code");
      setSelectedGroup(null);
      setError(null);
    } else {
      setStep("email");
      setToken(null);
      setExpiresAt(null);
      setEligibleGroups([]);
      setVerificationCode("");
      setError(null);
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
          {/* Step 1: Email */}
          {step === "email" && (
            <>
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
              {error && <p className="text-sm text-destructive">{error}</p>}

              {/* Send code button */}
              {hasMatch && (
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
            </>
          )}

          {/* Step 2: Verify Code */}
          {step === "code" && (
            <>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  Code sent to <span className="text-foreground font-medium">{email}</span>
                </p>
                {eligibleGroups.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Eligible for{" "}
                    <span className="text-primary font-medium">
                      {eligibleGroups.map(g => g.name).join(", ")}
                    </span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                  Verification code
                </label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-widest font-mono"
                />
                {expiresAt && (
                  <p className="text-xs text-muted-foreground text-center">
                    Code expires in {Math.max(0, Math.ceil((expiresAt - Date.now()) / 60000))} minutes
                  </p>
                )}
              </div>

              {/* Error message */}
              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleVerifyCode}
                  disabled={isVerifying || verificationCode.length !== 6}
                  className="flex-1"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Select Group */}
          {step === "select-group" && (
            <>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  Email verified. Now select which network to join.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Select your network</p>
                <div className="grid gap-2">
                  {eligibleGroups.map((group) => (
                    <Button
                      key={group.id}
                      variant="outline"
                      className="justify-start h-auto py-3 px-4"
                      disabled={isRegistering}
                      onClick={() => handleRegisterCommitment(group)}
                    >
                      {isRegistering && selectedGroup?.id === group.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Unlock className="mr-2 h-4 w-4 text-primary" />
                      )}
                      <span className="font-medium">{group.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Error message */}
              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button variant="ghost" onClick={handleBack} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">Verified!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You&apos;ve joined{" "}
                <span className="text-primary font-medium">
                  {selectedGroup?.name}
                </span>
                {" "}anonymously.
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Your identity commitment has been registered. You can now post anonymous reviews.
              </p>
              <Button onClick={() => setOpen(false)} className="w-full">
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
