"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

/** Copies the investigation link. */
export function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — nothing useful to do in the preview.
    }
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={copy}>
      {copied ? <Check className="h-3.5 w-3.5 text-confirmed-600" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? "Link copied" : "Share"}
    </Button>
  );
}
