import { createFileRoute } from "@tanstack/react-router";
import Categories from "@/pages/Categories";
import { getSeoMetadata } from "@/utils/seo";

type SearchParams = {
  q?: string;
  cat?: string;
  city?: string;
  start?: string;
  end?: string;
};

export const Route = createFileRoute("/browse")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      q: (search.q as string) || undefined,
      cat: (search.cat as string) || undefined,
      city: (search.city as string) || undefined,
      start: (search.start as string) || undefined,
      end: (search.end as string) || undefined,
    };
  },
  head: () =>
    getSeoMetadata({
      title: "PAYENT — Browse Gear",
      description:
        "Discover professional cameras, drones, laptops, audio gear, lighting and more from the PAYENT marketplace.",
      path: "/browse",
    }),
  component: Categories,
});
