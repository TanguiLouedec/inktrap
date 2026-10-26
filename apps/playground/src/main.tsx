import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Home } from "./Home";
import { Stress } from "./Stress";
import { WaterfallPage } from "./WaterfallPage";
import "./styles.css";

const useHash = () => {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const onChange = () => setHash(location.hash);
    addEventListener("hashchange", onChange);
    return () => removeEventListener("hashchange", onChange);
  }, []);
  return hash;
};

function App() {
  const hash = useHash();
  return (
    <>
      <nav>
        <a href="#specimens">Specimens</a>
        <a href="#waterfall">Waterfall</a>
        <a href="#stress">200 specimens / 3 fonts</a>
      </nav>
      <main>{hash === "#stress" ? <Stress /> : hash === "#waterfall" ? <WaterfallPage /> : <Home />}</main>
    </>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
