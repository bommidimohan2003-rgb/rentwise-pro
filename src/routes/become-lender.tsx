import { createFileRoute } from "@tanstack/react-router";
import BecomeLender from "@/pages/BecomeLender";
import { getSeoMetadata } from "@/utils/seo";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

type BecomeLenderSearch = {
  title?: string;
  category?: string;
  price?: string;
  description?: string;
};

export const Route = createFileRoute("/become-lender")({
  head: () =>
    getSeoMetadata({
      title: "Become a Lender | Payent",
      description:
        "List your premium cameras, drones, laptops, and consoles on Payent and start earning passive income today.",
      path: "/become-lender",
    }),
  validateSearch: (search: Record<string, unknown>): BecomeLenderSearch => {
    return {
      title: (search.title as string) ?? undefined,
      category: (search.category as string) ?? undefined,
      price: (search.price as string) ?? undefined,
      description: (search.description as string) ?? undefined,
    };
  },
  component: () => (
    <ProtectedRoute>
      <BecomeLender />
    </ProtectedRoute>
  ),
});
