"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("caa-theme");
    const prefersLight = stored === "light";
    setLight(prefersLight);
    document.documentElement.classList.toggle("light", prefersLight);
    document.body.classList.toggle("light", prefersLight);
  }, []);

  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    document.body.classList.toggle("light", next);
    window.localStorage.setItem("caa-theme", next ? "light" : "dark");
  };

  return (
    <button
      onClick={toggle}
      aria-label="Cambiar tema"
      className="flex items-center gap-2 rounded-md border border-hairline px-3 py-1.5 font-mono text-xs text-mute transition-colors hover:border-signal hover:text-ink"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${light ? "bg-signal" : "bg-up"}`} />
      {light ? "MODO CLARO" : "MODO OSCURO"}
    </button>
  );
}
