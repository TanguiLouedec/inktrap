import { FontPreload, Specimen } from "@inktrap/react";
import { fraunces, frauncesItalic, literata, spaceGrotesk } from "./fonts";

export function Home() {
  return (
    <>
      <FontPreload src={fraunces.src as string} />
      <section>
        <h2>Fraunces</h2>
        <Specimen
          font={fraunces}
          size={72}
          fallback='"Fraunces Fallback", Georgia, serif'
          text="Handgloves"
        />
        <Specimen font={frauncesItalic} size={40} fallback="Georgia, serif" className="muted" />
      </section>
      <section>
        <h2>Space Grotesk</h2>
        <Specimen
          font={spaceGrotesk}
          size={48}
          fallback="system-ui, sans-serif"
          text="Hamburgefonstiv 0123456789"
        />
      </section>
      <section>
        <h2>Literata</h2>
        <Specimen
          font={literata}
          size={20}
          fallback="Georgia, serif"
          style={{ maxWidth: "40ch", lineHeight: 1.5 }}
          text="Typography is the craft of endowing human language with a durable visual form. Self-host your fonts and show them off without a paid CDN."
        />
      </section>
    </>
  );
}
