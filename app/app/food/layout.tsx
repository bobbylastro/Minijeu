import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Food Origins – Ultimate Playground",
  description: "A dish appears — click on the world map to find its country of origin. Test your food geography knowledge!",
};

export default function FoodLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
