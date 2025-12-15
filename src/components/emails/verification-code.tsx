import * as React from "react";

interface VerificationCodeEmailProps {
  code: string;
  networkName: string;
}

export function VerificationCodeEmail({
  code,
  networkName,
}: VerificationCodeEmailProps) {
  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "40px 20px",
        maxWidth: "480px",
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: "24px",
          fontWeight: "600",
          marginBottom: "24px",
          color: "#18181b",
        }}
      >
        Your verification code
      </h1>

      <p
        style={{
          fontSize: "16px",
          color: "#52525b",
          marginBottom: "24px",
          lineHeight: "1.5",
        }}
      >
        Use this code to prove your membership in <strong>{networkName}</strong>.
        It expires in 10 minutes.
      </p>

      <div
        style={{
          background: "#f4f4f5",
          borderRadius: "12px",
          padding: "24px",
          textAlign: "center" as const,
          marginBottom: "24px",
        }}
      >
        <span
          style={{
            fontSize: "32px",
            fontFamily: "monospace",
            fontWeight: "700",
            letterSpacing: "0.25em",
            color: "#18181b",
          }}
        >
          {code}
        </span>
      </div>

      <p
        style={{
          fontSize: "14px",
          color: "#71717a",
          lineHeight: "1.5",
        }}
      >
        This email is only used for verification. We don&apos;t store your email
        address or track your identity.
      </p>

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #e4e4e7",
          margin: "32px 0",
        }}
      />

      <p
        style={{
          fontSize: "12px",
          color: "#a1a1aa",
        }}
      >
        foundertea — Anonymous founder reviews of VCs
      </p>
    </div>
  );
}
