import React, { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

const particleOptions: ISourceOptions = {
  background: {
    color: {
      value: "transparent",
    },
  },
  fpsLimit: 60,
  particles: {
    color: {
      value: "#ffffff",
    },
    number: {
      value: 30,
      density: {
        enable: true,
        area: 800,
      },
    },
    opacity: {
      value: 0.3,
    },
    size: {
      value: { min: 1, max: 3 },
    },
    links: {
      enable: true,
      color: "#ffffff",
      distance: 150,
      opacity: 0.2,
      width: 1,
    },
    move: {
      enable: true,
      speed: 1,
      outModes: {
        default: "out",
      },
    },
  },
  interactivity: {
    events: {
      onHover: {
        enable: false,
      },
      onClick: {
        enable: false,
      },
    },
  },
  detectRetina: true,
};

export function ParticlesBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  if (!init) {
    return null;
  }

  return <Particles id="tsparticles" options={particleOptions} />;
}
