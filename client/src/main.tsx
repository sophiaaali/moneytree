import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App";
import { ClerkProvider } from "@clerk/clerk-react";

declare const VANTA: any;

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

const VantaWrapper: React.FC = () => {
  const vantaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let vantaEffect: any;

    if (vantaRef.current) {
      vantaEffect = VANTA.TOPOLOGY({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 300.0,
        minWidth: 300.0,
        scale: 10.0,
        scaleMobile: 1.0,
        color: 0x31702b,  
        backgroundColor: 0xeef7ee,
      });
    }

    return () => {
      if (vantaEffect) {
        vantaEffect.destroy();
      }
    };
  }, []);

  return (
    <div ref={vantaRef} style={{ height: "100vh", width: "100vw" }}>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <VantaWrapper />
  </React.StrictMode>
);
