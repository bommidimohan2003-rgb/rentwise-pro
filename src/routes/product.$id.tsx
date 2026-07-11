import { createFileRoute } from "@tanstack/react-router";
import ProductDetails from "@/pages/ProductDetails";
import { getSeoMetadata } from "@/utils/seo";
import { products } from "@/utils/mockData";

export const Route = createFileRoute("/product/$id")({
  head: ({ params }) => {
    const product = products.find((p) => p.id === params.id);
    const title = product ? `${product.title} | Payent` : "Product Details | Payent";
    const description = product ? product.description : "Rent premium tech gear on Payent.";
    const image = product ? product.image : undefined;
    return getSeoMetadata({
      title,
      description,
      path: `/product/${params.id}`,
      image,
      type: "product",
    });
  },
  component: ProductDetails,
});
