"use client";
import { useEffect, useRef, useState } from "react";

interface OGPin {
  id: string;
  lat: number;
  lng: number;
  label: string;
  active: boolean;
}

const PINS: OGPin[] = [
  { id: "OG-1", lat: 40.4842, lng: -88.9937, label: "OG-1 · Bloomington, IL", active: true },
];

// Simple equirectangular projection for CONUS
// Bounds: lng -125 to -66, lat 24 to 50
function project(lat: number, lng: number, w: number, h: number): [number, number] {
  const x = ((lng - (-125)) / ((-66) - (-125))) * w;
  const y = ((50 - lat) / (50 - 24)) * h;
  return [x, y];
}

// Simplified US state paths (SVG path data for all 48 contiguous states)
// Using a compact representation
const US_STATES = [
  { name: "ME", d: "M 842 52 L 858 48 L 868 60 L 860 72 L 848 68 Z" },
  { name: "NH", d: "M 832 60 L 842 52 L 848 68 L 840 80 L 828 72 Z" },
  { name: "VT", d: "M 822 52 L 832 48 L 832 60 L 828 72 L 818 64 Z" },
  { name: "MA", d: "M 828 72 L 840 80 L 848 82 L 845 88 L 820 85 L 818 76 Z" },
  { name: "RI", d: "M 848 80 L 855 78 L 857 86 L 848 88 Z" },
  { name: "CT", d: "M 835 82 L 847 80 L 848 88 L 833 90 Z" },
  { name: "NY", d: "M 780 55 L 822 52 L 818 64 L 828 72 L 818 76 L 780 85 L 768 68 Z" },
  { name: "NJ", d: "M 820 82 L 833 80 L 835 92 L 825 96 L 816 88 Z" },
  { name: "PA", d: "M 768 68 L 818 76 L 820 82 L 816 88 L 762 90 L 754 78 Z" },
  { name: "DE", d: "M 820 88 L 825 96 L 822 102 L 815 98 L 816 88 Z" },
  { name: "MD", d: "M 780 88 L 816 88 L 815 98 L 800 100 L 778 96 Z" },
  { name: "VA", d: "M 754 90 L 800 96 L 795 110 L 775 118 L 750 110 L 744 100 Z" },
  { name: "WV", d: "M 762 78 L 780 88 L 778 96 L 754 90 L 744 84 Z" },
  { name: "NC", d: "M 750 108 L 795 110 L 800 118 L 768 124 L 735 118 L 730 112 Z" },
  { name: "SC", d: "M 768 118 L 800 120 L 798 132 L 778 136 L 762 128 Z" },
  { name: "GA", d: "M 735 118 L 768 124 L 778 136 L 772 148 L 750 150 L 730 138 L 728 124 Z" },
  { name: "FL", d: "M 750 148 L 772 148 L 775 162 L 770 178 L 752 185 L 740 178 L 735 162 L 740 150 Z" },
  { name: "AL", d: "M 720 128 L 735 124 L 730 138 L 750 148 L 740 150 L 718 148 L 715 135 Z" },
  { name: "MS", d: "M 700 128 L 720 128 L 715 135 L 718 148 L 705 152 L 695 140 L 696 130 Z" },
  { name: "TN", d: "M 710 108 L 754 108 L 750 122 L 730 124 L 700 120 L 695 112 Z" },
  { name: "KY", d: "M 710 96 L 754 94 L 754 108 L 710 108 L 695 102 Z" },
  { name: "OH", d: "M 754 78 L 780 82 L 780 96 L 754 96 L 742 88 Z" },
  { name: "IN", d: "M 726 82 L 754 80 L 754 96 L 726 98 L 718 90 Z" },
  { name: "MI", d: "M 718 52 L 740 48 L 748 62 L 735 70 L 718 68 Z" },
  { name: "IL", d: "M 700 78 L 726 78 L 726 100 L 700 104 L 690 92 L 692 80 Z" },
  { name: "WI", d: "M 690 52 L 718 50 L 718 68 L 700 72 L 688 66 Z" },
  { name: "MN", d: "M 640 34 L 680 32 L 690 52 L 688 66 L 660 70 L 635 62 Z" },
  { name: "IA", d: "M 650 78 L 690 76 L 692 92 L 660 96 L 645 88 Z" },
  { name: "MO", d: "M 650 96 L 692 94 L 700 104 L 695 118 L 660 120 L 642 110 L 640 98 Z" },
  { name: "AR", d: "M 650 120 L 695 120 L 696 132 L 678 136 L 645 134 L 640 126 Z" },
  { name: "LA", d: "M 645 134 L 678 136 L 680 148 L 668 155 L 645 152 L 635 142 Z" },
  { name: "ND", d: "M 565 32 L 635 30 L 640 50 L 590 52 L 562 48 Z" },
  { name: "SD", d: "M 562 50 L 635 50 L 640 68 L 592 70 L 560 66 Z" },
  { name: "NE", d: "M 560 68 L 635 68 L 640 84 L 590 86 L 558 84 Z" },
  { name: "KS", d: "M 558 86 L 635 86 L 640 100 L 592 102 L 556 100 Z" },
  { name: "OK", d: "M 556 100 L 635 100 L 640 114 L 600 116 L 555 114 L 550 108 Z" },
  { name: "TX", d: "M 520 108 L 555 108 L 600 116 L 608 140 L 590 158 L 560 168 L 530 160 L 510 140 L 505 120 Z" },
  { name: "MT", d: "M 420 20 L 550 18 L 555 50 L 480 54 L 415 50 Z" },
  { name: "WY", d: "M 455 54 L 555 52 L 558 72 L 458 74 Z" },
  { name: "CO", d: "M 458 74 L 558 72 L 560 90 L 460 92 Z" },
  { name: "NM", d: "M 460 92 L 558 90 L 558 110 L 525 112 L 462 110 Z" },
  { name: "ID", d: "M 380 22 L 420 20 L 415 50 L 400 70 L 375 68 L 368 48 Z" },
  { name: "WA", d: "M 330 10 L 380 8 L 380 28 L 355 32 L 325 28 Z" },
  { name: "OR", d: "M 325 30 L 380 28 L 380 52 L 345 55 L 318 50 Z" },
  { name: "CA", d: "M 318 50 L 345 55 L 355 80 L 340 110 L 315 118 L 295 100 L 298 70 Z" },
  { name: "NV", d: "M 345 55 L 380 52 L 400 70 L 390 100 L 355 105 L 340 80 Z" },
  { name: "UT", d: "M 400 70 L 455 68 L 460 92 L 415 95 L 395 80 Z" },
  { name: "AZ", d: "M 395 95 L 460 92 L 462 115 L 430 118 L 395 115 L 388 105 Z" },
  { name: "AK", d: "M 100 150 L 200 145 L 220 165 L 180 180 L 110 175 Z" },
  { name: "HI", d: "M 280 180 L 295 178 L 298 186 L 285 188 Z" },
];

export default function DeploymentMap() {
  const W = 900, H = 220;
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, tx: 0, ty: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const zoom = (delta: number) => {
    setTransform(t => ({ ...t, scale: Math.max(0.8, Math.min(4, t.scale + delta)) }));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setTransform(t => ({ ...t, x: dragStart.tx + (e.clientX - dragStart.x), y: dragStart.ty + (e.clientY - dragStart.y) }));
  };
  const onMouseUp = () => setDragging(false);

  const pinPos = project(PINS[0].lat, PINS[0].lng, W, H);

  return (
    <div className="deploy-map-wrap">
      <div className="deploy-map-controls">
        <button className="map-zoom-btn" onClick={() => zoom(0.3)}>+</button>
        <button className="map-zoom-btn" onClick={() => zoom(-0.3)}>−</button>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="deploy-map-svg"
        style={{ cursor: dragging ? "grabbing" : "grab" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <defs>
          <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d4a747" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#d4a747" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`} style={{ transformOrigin: `${W/2}px ${H/2}px` }}>
          {/* State fills */}
          {US_STATES.map(s => (
            <path key={s.name} d={s.d} fill="rgba(212,167,71,0.06)" stroke="#d4a747" strokeWidth="0.8" strokeOpacity="0.5" />
          ))}
          {/* OG-1 pin on Bloomington IL */}
          <circle cx={pinPos[0]} cy={pinPos[1]} r={14} fill="url(#pinGlow)" />
          <circle cx={pinPos[0]} cy={pinPos[1]} r={5} fill="#d4a747" filter="url(#glow)" />
          <circle cx={pinPos[0]} cy={pinPos[1]} r={5} fill="none" stroke="#d4a747" strokeWidth="1.5">
            <animate attributeName="r" values="5;12;5" dur="2s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
          </circle>
          <text x={pinPos[0] + 10} y={pinPos[1] - 8} fill="#d4a747" fontSize="7" fontFamily="Cinzel, serif" fontWeight="600">OG-1</text>
          <text x={pinPos[0] + 10} y={pinPos[1] + 2} fill="#ede4cf" fontSize="5.5" fontFamily="Cormorant Garamond, serif" opacity="0.8">Bloomington, IL</text>
        </g>
      </svg>
    </div>
  );
}
