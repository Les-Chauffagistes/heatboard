import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/board/", "/start/", "/login", "/logout"],
    },
    sitemap: "https://heatboard.chauffagistes-btc.fr/sitemap.xml",
  };
}
