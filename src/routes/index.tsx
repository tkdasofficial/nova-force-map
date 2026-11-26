import { createFileRoute } from "@tanstack/react-router";
import SciFiMap from "../../map/SciFiMap";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sector-07 · Sci-Fi 3D Map" },
      { name: "description", content: "A 50×50 m sci-fi arena with marble floor, containers, ramps, stairs and towers." },
      { property: "og:title", content: "Sector-07 · Sci-Fi 3D Map" },
      { property: "og:description", content: "A 50×50 m sci-fi arena built from geometric shapes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SciFiMap,
});
