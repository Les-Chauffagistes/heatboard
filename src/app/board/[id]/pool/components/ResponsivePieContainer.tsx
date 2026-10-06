import { useEffect, useRef, useState } from "react";
import RepartitionPie from "./RepartitionPie";
import { components } from "@chauffagistes/cmn";

export default function ResponsivePieContainer({ weights, isFake }: Readonly<{
    weights: components["schemas"]["PoolDistributionElement"][],
    isFake: boolean
}>) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(300);

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setSize(Math.min(w, 400)); // 400 = limite haute desktop
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  if (isFake) {
    weights = [
      {
        "part": 0.3,
        "workername": "worker1",
        "diff_sum": 0,
        "shares_ok": 0,
        "shares_ko": 0
      },
      {
        "part": 0.2,
        "workername": "worker2",
        "diff_sum": 0,
        "shares_ok": 0,
        "shares_ko": 0
      },
      {
        "part": 0.15,
        "workername": "worker3",
        "diff_sum": 0,
        "shares_ok": 0,
        "shares_ko": 0
      },
      {
        "part": 0.10,
        "workername": "worker5",
        "diff_sum": 0,
        "shares_ok": 0,
        "shares_ko": 0
      },
      {
        "part": 0.07,
        "workername": "worker5",
        "diff_sum": 0,
        "shares_ok": 0,
        "shares_ko": 0
      },
    ]
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 400,
        margin: "0 auto",
      }}
    >
      <div
        ref={ref}
        style={{
          width: "100%",
          filter: isFake ? "blur(8px)" : "none",
          pointerEvents: isFake ? "none" : "auto",
          opacity: isFake ? 0.6 : 1,
          transition: "filter 0.2s ease, opacity 0.2s ease",
        }}
      >
        <RepartitionPie weights={weights} size={size} />
      </div>
      {isFake && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "auto",
            zIndex: 10,
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: "white",
              padding: "12px 20px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              whiteSpace: "nowrap",
            }}
          >
            Disponible en mode communautaire
          </div>
        </div>
      )}
    </div>
  );
}
