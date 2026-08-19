import React from "react";
import { PublicTicketTrackingView } from "./PublicTicketTrackingView";

export function generateStaticParams() {
  return [{ code: "preview" }];
}

export default async function PublicTicketTrackingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <PublicTicketTrackingView code={code} />;
}
