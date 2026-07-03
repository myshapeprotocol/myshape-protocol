/**
 * HowToJsonLd — Server Component
 *
 * Renders Schema.org HowTo structured data for step-by-step instructions.
 * Google displays HowTo rich results with step previews in SERPs.
 *
 * Usage in page.tsx (Server Component):
 *
 *   <HowToJsonLd
 *     name="Genesis Ritual"
 *     description="Initialize your sovereign Data-Body through motion-signature verification."
 *     steps={[
 *       { name: "Enter your email", text: "Provide your email address to receive a 6-digit OTP." },
 *       { name: "Verify OTP", text: "Enter the verification code sent to your email." },
 *     ]}
 *   />
 */

interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

interface HowToJsonLdProps {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string; // ISO 8601 duration, e.g. "PT5M"
  tool?: string[]; // e.g. ["Webcam", "Modern Browser"]
}

export default function HowToJsonLd({
  name,
  description,
  steps,
  totalTime,
  tool,
}: HowToJsonLdProps) {
  if (steps.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    ...(totalTime && { totalTime }),
    ...(tool && { tool: tool.map((t) => ({ "@type": "HowToTool", name: t })) }),
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
