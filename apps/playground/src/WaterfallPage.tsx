import { Waterfall } from "@inktrapjs/react";
import { fraunces, literata, spaceGrotesk } from "./fonts";

export function WaterfallPage() {
  return (
    <>
      <section>
        <h2>Fraunces, default sizes</h2>
        <Waterfall font={fraunces} fallback='"Fraunces Fallback", Georgia, serif' className="waterfall" />
      </section>
      <section>
        <h2>Space Grotesk, custom sizes</h2>
        <Waterfall
          font={spaceGrotesk}
          sizes={[10, 13, 18, "2rem", "3.5rem"]}
          text="Hamburgefonstiv 0123456789"
          fallback="system-ui, sans-serif"
          className="waterfall"
        />
      </section>
      <section>
        <h2>Literata, text sizes</h2>
        <Waterfall
          font={literata}
          sizes={[12, 14, 16, 18, 20]}
          text="Typography is the craft of endowing human language with a durable visual form."
          fallback="Georgia, serif"
          className="waterfall"
        />
      </section>
    </>
  );
}
