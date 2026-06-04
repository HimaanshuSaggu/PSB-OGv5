"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

/**
 * Cinematic scroll hero.
 * A tall section (250vh) with a pinned 100vh stage. As you scroll:
 *  - fog covering the title parts to the left and right
 *  - the title is revealed
 *  - the marble pillars slide outward and recede (camera pushes past them)
 *  - the temple background slowly scales in
 * Everything is tied to scroll progress, so scrolling UP reverses it all.
 */
export default function CinematicHero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Background temple — slow cinematic push-in
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.12, 1.26]);
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "-6%"]);

  // Back fog (behind title) — thins out
  const backFogOpacity = useTransform(scrollYProgress, [0, 0.6], [0.6, 0.12]);
  const backFogScale = useTransform(scrollYProgress, [0, 0.6], [1, 1.12]);

  // Front fog halves — part to reveal the title (completes while pinned)
  const fogLeftX = useTransform(scrollYProgress, [0, 0.45], ["0%", "-85%"]);
  const fogRightX = useTransform(scrollYProgress, [0, 0.45], ["0%", "85%"]);
  const frontFogOpacity = useTransform(scrollYProgress, [0, 0.42], [1, 0]);

  // Title — emerges from the fog (starts fully hidden so no half-rendered flash)
  const titleOpacity = useTransform(scrollYProgress, [0.12, 0.42], [0, 1]);
  const titleY = useTransform(scrollYProgress, [0, 0.42], [40, 0]);
  const titleScale = useTransform(scrollYProgress, [0, 0.42], [0.94, 1]);

  // Pillars — slide outward + grow + fade (passing the camera)
  const pillarLeftX = useTransform(scrollYProgress, [0, 0.5], ["0%", "-48%"]);
  const pillarRightX = useTransform(scrollYProgress, [0, 0.5], ["0%", "48%"]);
  const pillarScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.18]);
  const pillarOpacity = useTransform(scrollYProgress, [0.1, 0.5], [1, 0.12]);

  // Scroll hint — fades the moment you start
  const hintOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

  // Accessibility: if the user prefers reduced motion, show the revealed
  // state immediately (title visible, fog cleared) and skip the scroll dance.
  const rm = useReducedMotion();

  return (
    <div ref={ref} className="cine-hero">
      <div className="cine-sticky">
        {/* Background */}
        <motion.div className="cine-bg" style={rm ? { scale: 1.16 } : { scale: bgScale, y: bgY }}>
          <Image
            src="/temple-bg.jpeg"
            alt="Ancient Greek temple at golden hour"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
          <div className="cine-bg-veil" />
        </motion.div>

        {/* Back fog */}
        <motion.div
          className="cine-fog cine-fog-back"
          style={rm ? { opacity: 0.18 } : { opacity: backFogOpacity, scale: backFogScale }}
        />

        {/* Title (centered by flex on .cine-sticky) */}
        <motion.div
          className="cine-title-wrap"
          style={rm ? { opacity: 1 } : { opacity: titleOpacity, y: titleY, scale: titleScale }}
        >
          <div className="cine-eyebrow">Vanishing History</div>
          <h1 className="cine-title">Origins Guardian</h1>
          <div className="cine-tagline">
            The watch that does not sleep · the eye that does not blink
          </div>
        </motion.div>

        {/* Front fog halves — these cover the title, then part */}
        <motion.div
          className="cine-fog cine-fog-front cine-fog-left"
          style={rm ? { opacity: 0 } : { x: fogLeftX, opacity: frontFogOpacity }}
        />
        <motion.div
          className="cine-fog cine-fog-front cine-fog-right"
          style={rm ? { opacity: 0 } : { x: fogRightX, opacity: frontFogOpacity }}
        />

        {/* Pillars */}
        <motion.div
          className="cine-pillar cine-pillar-left"
          style={rm ? { opacity: 0.85 } : { x: pillarLeftX, scale: pillarScale, opacity: pillarOpacity }}
        >
          <Image
            src="/pillar.png"
            alt=""
            fill
            sizes="30vw"
            style={{ objectFit: "contain", objectPosition: "bottom" }}
          />
        </motion.div>
        <motion.div
          className="cine-pillar cine-pillar-right"
          style={rm ? { opacity: 0.85 } : { x: pillarRightX, scale: pillarScale, opacity: pillarOpacity }}
        >
          <Image
            src="/pillar-flip.png"
            alt=""
            fill
            sizes="30vw"
            style={{ objectFit: "contain", objectPosition: "bottom" }}
          />
        </motion.div>

        {/* Bottom fade into the obsidian page + scroll hint */}
        <div className="cine-bottom-fade" />
        <motion.div className="cine-hint" style={{ opacity: hintOpacity }}>
          <span>Scroll to enter</span>
          <span className="cine-hint-arrow">↓</span>
        </motion.div>
      </div>
    </div>
  );
}
