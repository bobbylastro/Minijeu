import dynamic from "next/dynamic";

const FoodOriginGame = dynamic(() => import("@/components/FoodOriginGame"), { ssr: false });

export default function FoodPage() {
  return <FoodOriginGame />;
}
