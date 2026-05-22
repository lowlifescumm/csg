import { getReadingById } from "@/lib/db";
import { notFound } from "next/navigation";
import ReadingView from "./ReadingView";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const reading = await getReadingById(id);

  if (!reading) {
    return {
      title: "Reading Not Found | Cosmic Spirit Guide",
    };
  }

  const result = reading.result || {};
  const cards = result.cards || [];
  const cardNames = cards.map((c) => c.name).join(", ");
  const snippet = result.interpretation
    ? result.interpretation.replace(/[#*`]/g, "").slice(0, 200)
    : "A tarot reading from Cosmic Spirit Guide";

  const title = reading.question
    ? `Tarot Reading: "${reading.question.slice(0, 60)}" | Cosmic Spirit Guide`
    : `Tarot Reading: ${cardNames || "Shared Reading"} | Cosmic Spirit Guide`;

  const description = `Cards: ${cardNames || "Tarot"} — ${snippet}...`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "Cosmic Spirit Guide",
      images: [
        {
          url: "/logos/csg-logo-og.jpg",
          width: 1200,
          height: 630,
          alt: "Cosmic Spirit Guide — Tarot Reading",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/logos/csg-logo-og.jpg"],
    },
  };
}

export default async function SharedReadingPage({ params }) {
  const { id } = await params;
  const reading = await getReadingById(id);

  if (!reading) {
    notFound();
  }

  return <ReadingView reading={reading} />;
}
