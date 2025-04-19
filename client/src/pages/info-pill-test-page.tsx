import React from "react";
import { InfoPillShowcase } from "@/components/info-pill-showcase";

export default function InfoPillTestPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">InfoPill Component Test</h1>
      <InfoPillShowcase />
    </div>
  );
}