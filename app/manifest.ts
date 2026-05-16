import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Amigo do Prédio",
    short_name: "Amigo do Prédio",
    description: "Orientações práticas para o seu condomínio",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f9f5ef",
    theme_color: "#1f3147",
    categories: ["business", "utilities"],
    icons: [
    {
      src: "/icons/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: "/icons/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
  };
}
