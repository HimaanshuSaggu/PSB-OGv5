"use client";

import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "react-simple-maps";
import { geoCentroid } from "d3-geo";

const COUNTRIES = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const STATES = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const BLOOMINGTON: [number, number] = [-88.9937, 40.4842];

const geoStyle = (fill: string, stroke: string) => ({
  default: { fill, stroke, strokeWidth: 0.5, outline: "none", vectorEffect: "non-scaling-stroke" as const },
  hover: { fill: "rgba(212,167,71,0.14)", stroke, strokeWidth: 0.7, outline: "none", vectorEffect: "non-scaling-stroke" as const },
  pressed: { fill, stroke, outline: "none", vectorEffect: "non-scaling-stroke" as const },
});

export default function DeploymentMap() {
  const [center, setCenter] = useState<[number, number]>([-95, 39]);
  const [zoom, setZoom] = useState(2.4);

  const clamp = (z: number) => Math.max(1, Math.min(20, z));
  const zoomIn = () => setZoom((z) => clamp(z * 1.4));
  const zoomOut = () => setZoom((z) => clamp(z / 1.4));

  return (
    <div className="map-wrap">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 320, center: [-95, 39] }}
        width={800}
        height={520}
        style={{ width: "100%", height: "auto" }}
      >
        <ZoomableGroup
          center={center}
          zoom={zoom}
          minZoom={1}
          maxZoom={20}
          onMoveEnd={({ coordinates, zoom }) => {
            setCenter(coordinates as [number, number]);
            setZoom(zoom);
          }}
        >
          {/* Neighbouring countries */}
          <Geographies geography={COUNTRIES}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={geoStyle("rgba(212,167,71,0.03)", "rgba(212,167,71,0.22)")}
                />
              ))
            }
          </Geographies>

          {/* US states + labels */}
          <Geographies geography={STATES}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const centroid = geoCentroid(geo);
                const name = (geo.properties && geo.properties.name) as string;
                return (
                  <g key={geo.rsmKey}>
                    <Geography geography={geo} style={geoStyle("rgba(212,167,71,0.05)", "rgba(212,167,71,0.7)")} />
                    {zoom >= 3 && centroid[0] && (
                      <Marker coordinates={centroid as [number, number]}>
                        <text
                          textAnchor="middle"
                          y={2}
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fill: "rgba(237,228,207,0.5)",
                            fontSize: 11 / zoom,
                            pointerEvents: "none",
                          }}
                        >
                          {name}
                        </text>
                      </Marker>
                    )}
                  </g>
                );
              })
            }
          </Geographies>

          {/* OG-1 — Bloomington, IL */}
          <Marker coordinates={BLOOMINGTON}>
            <circle r={8 / zoom} fill="none" stroke="#f0c869" strokeWidth={0.8 / zoom} opacity={0.5} />
            <circle r={4 / zoom} fill="#f0c869" stroke="#0a0a0c" strokeWidth={1 / zoom} />
            <text
              textAnchor="middle"
              y={-11 / zoom}
              style={{ fontFamily: "'Cinzel', serif", fill: "#f0c869", fontSize: 13 / zoom, fontWeight: 700 }}
            >
              OG-1
            </text>
          </Marker>
        </ZoomableGroup>
      </ComposableMap>

      <div className="map-zoom">
        <button type="button" onClick={zoomIn} aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={zoomOut} aria-label="Zoom out">
          −
        </button>
      </div>

      <div className="map-legend">
        <span className="globe-pin" />
        OG-1 · Bloomington, IL · <strong>ACTIVE</strong>
      </div>
      <div className="map-hint">Drag to pan · scroll or ± to zoom</div>
    </div>
  );
}
