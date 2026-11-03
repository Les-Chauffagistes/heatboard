import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://heatboard.chauffagistes-btc.fr", priority: 1 }];
}
