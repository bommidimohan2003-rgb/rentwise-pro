import { createFileRoute } from "@tanstack/react-router";
import Categories from "@/pages/Categories";
import { getSeoMetadata } from "@/utils/seo";

type SearchParams = {
  q?: string;
  cat?: string;
  city?: string;
};

export const Route = createFileRoute("/categories")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      q: (search.q as string) || undefined,
      cat: (search.cat as string) || undefined,
      city: (search.city as string) || undefined,
    };
  },
  head: () =>
    getSeoMetadata({
      title: "Browse Marketplace | Payent",
      description:
        "Rent cameras, drones, laptops, audio gear, and VR headsets. Insured, verified, and delivered fast.",
      path: "/categories",
    }),
  component: Categories,
});
