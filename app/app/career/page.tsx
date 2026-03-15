import type { Metadata } from "next";
import CareerOrderGame from "@/components/CareerOrderGame";
import RelatedGames from "@/components/RelatedGames";

export const metadata: Metadata = {
  title: "Football career quiz: put clubs in order | CareerOrder",
  description:
    "Test your football knowledge with CareerOrder. Drag and drop clubs into the correct order of a player's career. Quick, fun and challenging.",
};

export default function CareerPage() {
  return (
    <>
      <CareerOrderGame />
      <section className="game-seo-section">
        <div className="game-seo-section__inner">
          <h1 className="game-seo-section__h1">
            CareerOrder: put a player&apos;s clubs in the right order
          </h1>

          <h2>A football career memory challenge</h2>
          <p>
            CareerOrder tests how well you really know football careers. In each round, a player
            is shown along with the clubs they played for. Your goal is simple: place each club in
            the correct chronological order. Sounds easy, but it quickly becomes a real challenge.
          </p>

          <h2>Simple gameplay, real challenge</h2>
          <p>
            Using a smooth drag-and-drop system, you can freely move club badges into position.
            The interface is intuitive, but getting the correct order requires solid knowledge and
            attention to detail. One mistake can cost you valuable points.
          </p>

          <h2>Short and addictive rounds</h2>
          <p>
            Each game is made up of a few quick rounds, making it perfect for short sessions.
            Despite its simplicity, CareerOrder keeps you engaged with increasing difficulty and a
            strong competitive feel.
          </p>

          <h2>Built for true football fans</h2>
          <p>
            Some careers are obvious, others are much harder to reconstruct. CareerOrder is
            designed for players who enjoy testing their football knowledge and improving with
            every game. The more you play, the sharper your memory becomes.
          </p>
        </div>
      </section>
      <RelatedGames currentSlug="/career" />
    </>
  );
}
