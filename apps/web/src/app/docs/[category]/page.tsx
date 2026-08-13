import { DocsCategoryClient } from "./DocsCategoryClient";

export function generateStaticParams() {
  return [
    { category: "all" },
    { category: "network" },
    { category: "sops" },
    { category: "manuals" },
  ];
}

export default async function DocsCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const resolvedParams = await params;
  const categoryParam = typeof resolvedParams?.category === "string" ? resolvedParams.category.toLowerCase() : "all";
  return <DocsCategoryClient categoryParam={categoryParam} />;
}