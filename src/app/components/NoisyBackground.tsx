"use client";

import React, { CSSProperties, useEffect, useRef } from 'react';

const NoisyBackground = ({ 
  children, 
  style = {},
  backgroundColor = '#1e1f22',
  blob1Color = 'rgba(88, 101, 242, 0.4)',
  blob2Color = 'rgba(114, 137, 218, 0.35)',
  blob3Color = 'rgba(71, 82, 196, 0.3)',
  noiseOpacity = 0.5,
  grainIntensity = 15
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  backgroundColor?: string;
  blob1Color?: string;
  blob2Color?: string;
  blob3Color?: string;
  noiseOpacity?: number;
  grainIntensity?: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;

    if (!parent || !ctx) return;

    const updateCanvasSize = () => {
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
      createNoiseTexture();
    };

    // Créer une texture de bruit/grain
    const createNoiseTexture = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 255;
        data[i] = noise;     // R
        data[i + 1] = noise; // G
        data[i + 2] = noise; // B
        data[i + 3] = grainIntensity;    // A (faible opacité pour effet subtil)
      }

      ctx.putImageData(imageData, 0, 0);
    };

    updateCanvasSize();

    // Observer pour redimensionner si le parent change de taille
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    resizeObserver.observe(parent);

    return () => {
      resizeObserver.disconnect();
    };
  }, [grainIntensity]);

  return (
    <div style={{ ...styles.container, backgroundColor, ...style }} className="super-card">
      {/* Dégradés animés en arrière-plan */}
      <div style={styles.gradientLayer}>
        <div style={{...styles.blob1, background: `radial-gradient(circle, ${blob1Color} 0%, transparent 70%)`}}></div>
        <div style={{...styles.blob2, background: `radial-gradient(circle, ${blob2Color} 0%, transparent 70%)`}}></div>
        <div style={{...styles.blob3, background: `radial-gradient(circle, ${blob3Color} 0%, transparent 70%)`}}></div>
      </div>

      {/* Couche de grain/noise */}
      <canvas 
        ref={canvasRef} 
        style={{...styles.noiseCanvas, opacity: noiseOpacity}}
      />

      {/* Contenu enfant */}
      <div style={styles.content}>
        {children}
      </div>

      <style>
        {`
          @keyframes float1 {
            0%, 100% {
              transform: translate(0%, 0%) scale(1);
            }
            33% {
              transform: translate(30%, -20%) scale(1.1);
            }
            66% {
              transform: translate(-20%, 30%) scale(0.9);
            }
          }

          @keyframes float2 {
            0%, 100% {
              transform: translate(0%, 0%) scale(1);
            }
            33% {
              transform: translate(-30%, 20%) scale(0.9);
            }
            66% {
              transform: translate(20%, -30%) scale(1.1);
            }
          }

          @keyframes float3 {
            0%, 100% {
              transform: translate(0%, 0%) scale(1);
            }
            50% {
              transform: translate(15%, 15%) scale(1.05);
            }
          }
        `}
      </style>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    display: "flex",
    flexDirection: "column",
  },
  gradientLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    top: '-20%',
    left: '-10%',
    width: '60%',
    height: '60%',
    borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
    filter: 'blur(80px)',
    animation: 'float1 20s ease-in-out infinite',
    mixBlendMode: 'screen',
  },
  blob2: {
    position: 'absolute',
    bottom: '-20%',
    right: '-10%',
    width: '70%',
    height: '70%',
    borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
    filter: 'blur(90px)',
    animation: 'float2 25s ease-in-out infinite',
    mixBlendMode: 'screen',
  },
  blob3: {
    position: 'absolute',
    top: '40%',
    left: '30%',
    width: '50%',
    height: '50%',
    borderRadius: '50% 50% 50% 50% / 40% 60% 40% 60%',
    filter: 'blur(100px)',
    animation: 'float3 18s ease-in-out infinite',
    mixBlendMode: 'screen',
  },
  noiseCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    mixBlendMode: 'overlay',
  },
  content: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    height: '100%',
  },
};

export default NoisyBackground;