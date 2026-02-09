# Davidson & Co London -- GSAP Luxury Animation Skill

## Purpose

This document is a comprehensive GSAP animation skill designed to be injected into the Davidson AI bot's system prompt. It provides complete, copy-paste-ready animation patterns that the AI must use when creating pages. The goal is to ensure every page created rivals high-end agency work with smooth, sophisticated animations.

---

## TABLE OF CONTENTS

1. [Research Summary](#1-research-summary)
2. [Problem Diagnosis](#2-problem-diagnosis)
3. [Required Libraries Block](#3-required-libraries-block)
4. [Animation Patterns Library (15 Patterns)](#4-animation-patterns-library)
5. [Easing & Timing Guidelines](#5-easing--timing-guidelines)
6. [Complete Page Template](#6-complete-page-template)
7. [System Prompt Integration Plan](#7-system-prompt-integration-plan)
8. [Accessibility & Performance](#8-accessibility--performance)

---

## 1. Research Summary

### Key Findings from GSAP Documentation

**GSAP 3 Core Concepts:**
- `gsap.to()` animates FROM current state TO specified values
- `gsap.from()` animates FROM specified values TO current state
- `gsap.fromTo()` explicitly defines both start and end states
- `gsap.timeline()` sequences multiple animations with precise timing control
- `gsap.registerPlugin()` must be called before using any plugins

**ScrollTrigger Plugin:**
- Links animations to scroll position for on-demand reveals
- Key properties: `trigger`, `start`, `end`, `scrub`, `pin`, `toggleActions`
- `toggleActions` format: "onEnter onLeave onEnterBack onLeaveBack" with values play/pause/resume/restart/reverse/complete/reset/none
- `scrub: true` links directly to scrollbar; `scrub: 1` adds 1-second smoothing
- Performance: pre-calculates trigger points rather than constant viewport checks
- Supports `markers: true` for debugging (remove in production)

**TextPlugin:**
- Animates text content with typing effect: `gsap.to(el, { text: "new text", duration: 2 })`
- Works with any element that has text content
- Free plugin included with GSAP core

**Stagger Animations:**
- Simple: `stagger: 0.1` (0.1s between each element)
- Advanced: `stagger: { each: 0.1, from: "center", ease: "power2.inOut" }`
- Grid support: `stagger: { grid: "auto", from: "center", each: 0.08 }`
- Negative values reverse the sequence

**Performance Best Practices:**
- Only animate `transform` and `opacity` (GPU-accelerated, skip Layout/Paint)
- Never animate width, height, margin, padding, top, left (trigger expensive Layout recalculations)
- Use `will-change: transform, opacity` sparingly on animated elements
- Batch similar animations with `gsap.utils.toArray()`
- Use `gsap.ticker.lagSmoothing(1000, 16)` to handle CPU lag gracefully
- Kill ScrollTriggers when no longer needed in SPAs

**Luxury Website Animation Patterns (from Awwwards/premium sites):**
- Hero cinematic reveals with layered text and masking
- Parallax depth with multi-layer scroll speeds
- Staggered card reveals with offset timing
- Gold line draw/expansion animations
- Text typing effects for taglines
- Smooth section transitions
- Pinned sections with scrub-linked timelines
- Number counter animations for stats
- Image mask reveals (clip-path animations)
- Micro-interactions on hover states

**Easing for Luxury Feel:**
- `power2.out` -- smooth deceleration, feels natural and elegant
- `power3.inOut` -- sophisticated entrance/exit, good for reveals
- `power4.out` -- dramatic deceleration, cinematic feel
- `expo.out` -- extreme deceleration, very premium for hero elements
- `"none"` -- linear, used only for text typing effects
- Avoid `bounce` and `elastic` -- too playful for luxury brands
- `back.out(1.2)` -- subtle overshoot, good for button/card entrances

---

## 2. Problem Diagnosis

### Why AI-Generated Pages Lack Animations

After analyzing the existing codebase, the problem is clear:

**Homepage (index.html) -- EXCELLENT:**
- 10+ distinct GSAP animations
- Complex timeline with vault door reveal
- ScrollTrigger-pinned sections with scrub
- Horizontal scroll section
- Text typing effects
- Parallax layers
- Gold path SVG drawing
- Custom scroll indicator

**Who We Are page -- POOR:**
- Only 1 GSAP animation (a single `gsap.from` on headings)
- No scroll-triggered reveals
- No parallax effects
- No gold line animations
- No text typing
- Static, bland appearance

**Contact page -- ZERO ANIMATIONS:**
- No GSAP scripts at all
- Missing GSAP library imports entirely
- No ScrollTrigger imported
- Completely static page

**Sponsorship page -- BASIC:**
- Simple opacity tweens only (opacity: 0 to opacity: 1)
- No y-movement, no stagger timing variation
- No parallax, no line draws, no text effects
- No visual richness

### Root Cause

The system prompt tells the AI to use GSAP but provides only 5 simple examples. The AI treats these as the entire repertoire rather than a minimum baseline. The examples lack:
1. **Timelines** -- no sequential animation orchestration
2. **Advanced ScrollTrigger** -- no scrub, pin, or snap examples
3. **Visual richness** -- no parallax, mask reveals, or SVG draws
4. **Proper initial states** -- elements set to `opacity-0` in HTML but not given proper y/scale transforms
5. **No complete working template** -- the AI must mentally assemble pieces

### The Fix

Replace the current 5 simple examples with a comprehensive animation system that includes complete, production-ready patterns the AI can directly use. The patterns must be organized by section type (hero, content, cards, stats, CTA) so the AI knows exactly which animation to apply where.

---

## 3. Required Libraries Block

This exact block must appear in the `<head>` of every page:

```html
<!-- GSAP Animation Suite - ALL FOUR REQUIRED -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/TextPlugin.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/MotionPathPlugin.min.js"></script>
```

And this initialization must appear at the top of the page's `<script>`:

```javascript
document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger, TextPlugin, MotionPathPlugin);

  // Respect reduced motion preference
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    gsap.globalTimeline.timeScale(100); // Instantly complete all animations
  }

  // --- ALL ANIMATIONS BELOW ---
});
```

---

## 4. Animation Patterns Library

### Pattern 1: Hero Title Cinematic Reveal

**When to use:** Every page hero section. This is the first thing visitors see.

**HTML:**
```html
<section id="hero" class="relative h-screen flex items-center justify-center overflow-hidden bg-brand-black">
  <div class="relative z-10 text-center max-w-4xl px-8">
    <div class="w-[1px] h-24 bg-brand-gold mx-auto mb-8 origin-top" id="hero-line"></div>
    <h1 class="text-5xl md:text-8xl font-serif font-bold tracking-tighter mb-6" id="hero-title">
      Page Title <span class="text-gold-gradient">Accent</span>
    </h1>
    <p class="font-sans font-light text-lg md:text-xl text-gray-400 max-w-2xl mx-auto" id="hero-subtitle"></p>
    <div class="mt-12" id="hero-cta">
      <a href="#next-section" class="px-8 py-3 border border-brand-gold/30 text-xs tracking-widest hover:bg-brand-gold hover:text-brand-black transition-all duration-500">DISCOVER MORE</a>
    </div>
  </div>
</section>
```

**JavaScript:**
```javascript
// Hero Cinematic Timeline
const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

heroTl
  .from("#hero-line", {
    scaleY: 0,
    duration: 1.2,
    ease: "power2.inOut"
  })
  .from("#hero-title", {
    opacity: 0,
    y: 60,
    duration: 1.4,
    ease: "power4.out"
  }, "-=0.6")
  .to("#hero-subtitle", {
    text: "Your tagline text goes here -- typed character by character",
    duration: 2,
    ease: "none"
  }, "-=0.4")
  .from("#hero-cta", {
    opacity: 0,
    y: 30,
    duration: 1,
    ease: "power2.out"
  }, "-=0.8");
```

**Why this works for luxury:** The sequential reveal (line draws down, title fades up, tagline types, CTA appears) creates a choreographed unveiling that feels intentional and premium. The `power4.out` easing on the title gives dramatic deceleration.

---

### Pattern 2: Scroll-Triggered Section Reveal with Gold Line

**When to use:** Every content section with a heading. This is the workhorse pattern.

**HTML:**
```html
<section id="section-name" class="py-24 md:py-32 bg-brand-stone relative overflow-hidden">
  <div class="max-w-6xl mx-auto px-8">
    <div class="text-center mb-16">
      <div class="w-0 h-[2px] bg-brand-gold mx-auto mb-8" id="section-gold-line"></div>
      <span class="text-brand-gold text-xs tracking-[0.3em] uppercase block mb-4 opacity-0 section-fade">Our Values</span>
      <h2 class="text-4xl md:text-5xl font-serif opacity-0 section-fade">Section <span class="text-gold-gradient">Heading</span></h2>
    </div>
    <div class="section-content opacity-0">
      <!-- Content here -->
    </div>
  </div>
</section>
```

**JavaScript:**
```javascript
// Section Reveal with Gold Line
const sectionTl = gsap.timeline({
  scrollTrigger: {
    trigger: "#section-name",
    start: "top 75%",
    toggleActions: "play none none reverse"
  }
});

sectionTl
  .to("#section-gold-line", {
    width: "120px",
    duration: 1,
    ease: "power2.inOut"
  })
  .from(".section-fade", {
    opacity: 0,
    y: 40,
    stagger: 0.2,
    duration: 1,
    ease: "power3.out"
  }, "-=0.5")
  .from(".section-content", {
    opacity: 0,
    y: 30,
    duration: 1,
    ease: "power2.out"
  }, "-=0.6");
```

---

### Pattern 3: Stagger Cards / Grid Items

**When to use:** Service cards, team members, value propositions, any grid layout.

**HTML:**
```html
<div class="grid grid-cols-1 md:grid-cols-3 gap-8" id="cards-container">
  <div class="card-item border border-white/10 p-10 hover:border-brand-gold/30 transition-all duration-500 group">
    <span class="text-brand-gold text-xs tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">01</span>
    <h3 class="text-2xl font-serif mt-4 mb-3">Card Title</h3>
    <p class="text-sm text-gray-400 font-sans leading-relaxed">Description text here.</p>
  </div>
  <!-- More cards... -->
</div>
```

**JavaScript:**
```javascript
// Stagger Cards Reveal
gsap.from(".card-item", {
  opacity: 0,
  y: 60,
  scale: 0.95,
  stagger: {
    each: 0.15,
    ease: "power2.out"
  },
  duration: 0.8,
  ease: "power3.out",
  scrollTrigger: {
    trigger: "#cards-container",
    start: "top 75%",
    toggleActions: "play none none reverse"
  }
});
```

**Why this works:** The stagger creates a wave effect across cards. The subtle `scale: 0.95` starting point adds depth. The `0.15s` delay between each card is fast enough to feel connected but slow enough to be perceived.

---

### Pattern 4: Parallax Background Image

**When to use:** Any section with a background image -- creates depth and luxury feel.

**HTML:**
```html
<section id="parallax-section" class="relative h-[80vh] overflow-hidden flex items-center justify-center">
  <!-- Parallax Background -->
  <div class="absolute inset-0 scale-110" id="parallax-bg">
    <img src="IMAGE_URL" alt="" class="w-full h-full object-cover opacity-30 grayscale">
  </div>

  <!-- Foreground Content -->
  <div class="relative z-10 text-center max-w-2xl px-8" id="parallax-content">
    <h2 class="text-4xl md:text-6xl font-serif mb-6">Heading</h2>
    <p class="font-sans text-gray-400 text-lg leading-relaxed">Body text.</p>
  </div>
</section>
```

**JavaScript:**
```javascript
// Parallax Background Effect
gsap.to("#parallax-bg", {
  yPercent: 25,
  ease: "none",
  scrollTrigger: {
    trigger: "#parallax-section",
    start: "top bottom",
    end: "bottom top",
    scrub: true
  }
});

// Content moves at different speed for depth
gsap.to("#parallax-content", {
  yPercent: -15,
  ease: "none",
  scrollTrigger: {
    trigger: "#parallax-section",
    start: "top bottom",
    end: "bottom top",
    scrub: true
  }
});
```

---

### Pattern 5: Number Counter Animation

**When to use:** Statistics sections, "by the numbers" blocks, KPIs.

**HTML:**
```html
<div class="grid grid-cols-2 md:grid-cols-4 gap-8" id="stats-container">
  <div class="text-center stat-item">
    <span class="text-5xl font-serif text-brand-gold counter" data-target="500">0</span>
    <span class="text-5xl font-serif text-brand-gold">+</span>
    <p class="text-xs font-sans tracking-widest mt-3 text-gray-500">PRIVATE CLIENTS</p>
  </div>
  <div class="text-center stat-item">
    <span class="text-xl font-serif text-brand-gold mr-1">$</span>
    <span class="text-5xl font-serif text-brand-gold counter" data-target="2">0</span>
    <span class="text-5xl font-serif text-brand-gold">B+</span>
    <p class="text-xs font-sans tracking-widest mt-3 text-gray-500">ASSETS MANAGED</p>
  </div>
</div>
```

**JavaScript:**
```javascript
// Number Counter Animation
document.querySelectorAll(".counter").forEach(counter => {
  const target = parseFloat(counter.getAttribute("data-target"));

  gsap.to(counter, {
    innerText: target,
    duration: 2.5,
    ease: "power2.out",
    snap: { innerText: target >= 100 ? 1 : 0.1 },
    scrollTrigger: {
      trigger: "#stats-container",
      start: "top 75%",
      toggleActions: "play none none reverse"
    }
  });
});

// Stagger the stat items themselves
gsap.from(".stat-item", {
  opacity: 0,
  y: 40,
  stagger: 0.2,
  duration: 0.8,
  ease: "power3.out",
  scrollTrigger: {
    trigger: "#stats-container",
    start: "top 75%",
    toggleActions: "play none none reverse"
  }
});
```

---

### Pattern 6: Image Reveal with Mask

**When to use:** Feature images, portfolio items, team photos. Creates a cinematic unveiling.

**HTML:**
```html
<div class="relative overflow-hidden" id="image-reveal">
  <div class="absolute inset-0 bg-brand-gold z-10" id="image-mask"></div>
  <img src="IMAGE_URL" alt="" class="w-full h-full object-cover scale-110" id="image-inner">
</div>
```

**JavaScript:**
```javascript
// Image Reveal with Mask
const imgRevealTl = gsap.timeline({
  scrollTrigger: {
    trigger: "#image-reveal",
    start: "top 70%",
    toggleActions: "play none none reverse"
  }
});

imgRevealTl
  .to("#image-mask", {
    xPercent: 100,
    duration: 1.2,
    ease: "power3.inOut"
  })
  .from("#image-inner", {
    scale: 1.3,
    duration: 1.5,
    ease: "power2.out"
  }, "-=1");
```

**Why this works:** The gold mask sweeps across revealing the image underneath. The image simultaneously zooms from 1.3x to 1.1x (staying slightly zoomed for parallax later), creating a cinematic Ken Burns effect.

---

### Pattern 7: Text Typing Effect

**When to use:** Taglines, quotes, mission statements -- any impactful single-line text.

**HTML:**
```html
<div class="text-center py-16 relative">
  <div class="w-[1px] h-full absolute left-1/2 top-0 bg-white/5"></div>
  <h3 class="text-xl md:text-2xl font-serif italic text-brand-white/80" id="typed-quote"></h3>
  <div class="w-0 h-[2px] mt-8 bg-brand-gold mx-auto" id="quote-underline"></div>
</div>
```

**JavaScript:**
```javascript
// Text Typing with Underline
const typingTl = gsap.timeline({
  scrollTrigger: {
    trigger: "#typed-quote",
    start: "top 75%",
    toggleActions: "play none none none"
  }
});

typingTl
  .to("#typed-quote", {
    text: "True luxury is the absence of noise.",
    duration: 2.5,
    ease: "none"
  })
  .to("#quote-underline", {
    width: "200px",
    duration: 1,
    ease: "power2.inOut"
  }, "-=0.5");
```

---

### Pattern 8: Horizontal Scroll Section

**When to use:** Services overview, portfolio gallery, timeline -- when you need cinematic horizontal movement.

**HTML:**
```html
<section id="horizontal-wrapper" class="h-screen overflow-hidden relative bg-brand-charcoal">
  <div class="absolute top-10 left-10 z-20">
    <span class="text-xs tracking-widest text-brand-gold/50 uppercase" id="horiz-label">Our Expertise</span>
  </div>

  <div id="horizontal-track" class="flex h-full w-[400vw]">
    <div class="w-screen h-full flex flex-col justify-center items-center border-r border-white/5 relative group">
      <h3 class="text-6xl md:text-9xl font-serif text-transparent" style="-webkit-text-stroke: 1px rgba(255,255,255,0.3);">Service One</h3>
      <p class="mt-4 font-sans tracking-widest text-sm opacity-50">SUBTITLE</p>
    </div>
    <!-- Repeat for each panel -->
  </div>

  <div class="absolute bottom-10 right-10 flex items-center gap-4">
    <span class="text-[10px] tracking-[0.2em] uppercase opacity-60">Scroll to Explore</span>
    <div class="w-12 h-[1px] bg-white/20"></div>
  </div>
</section>
```

**JavaScript:**
```javascript
// Horizontal Scroll
const panels = gsap.utils.toArray("#horizontal-track > div");

gsap.to("#horizontal-track", {
  xPercent: -100 * ((panels.length - 1) / panels.length),
  ease: "none",
  scrollTrigger: {
    trigger: "#horizontal-wrapper",
    pin: true,
    scrub: 1,
    snap: 1 / (panels.length - 1),
    end: () => "+=" + (panels.length * 800)
  }
});

// Fade label as scroll begins
gsap.to("#horiz-label", {
  opacity: 0,
  scrollTrigger: {
    trigger: "#horizontal-wrapper",
    start: "top top",
    end: "+=300",
    scrub: 1
  }
});
```

---

### Pattern 9: SVG Gold Path Draw

**When to use:** Decorative elements, section dividers, architectural accent lines.

**HTML:**
```html
<svg class="absolute bottom-0 left-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
  <path id="svg-gold-path" d="M0,100 C25,80 75,20 100,0" fill="none" stroke="#D4AF37" stroke-width="0.2"/>
</svg>
```

**JavaScript:**
```javascript
// SVG Path Draw Animation
const pathLength = document.querySelector("#svg-gold-path").getTotalLength();

gsap.fromTo("#svg-gold-path",
  {
    strokeDasharray: pathLength,
    strokeDashoffset: pathLength
  },
  {
    strokeDashoffset: 0,
    ease: "none",
    scrollTrigger: {
      trigger: "#svg-gold-path",
      start: "top 80%",
      end: "bottom 20%",
      scrub: 1
    }
  }
);
```

---

### Pattern 10: Pinned Statement Section (Floating Text)

**When to use:** Brand statements, mission values, impactful quotes that deserve full-screen attention.

**HTML:**
```html
<section id="statements" class="relative h-screen bg-brand-black flex items-center justify-center overflow-hidden">
  <div class="statement absolute text-center w-full px-4">
    <h2 class="text-4xl md:text-6xl font-serif leading-tight">Discretion over <span class="text-brand-gold italic">exposure</span>.</h2>
  </div>
  <div class="statement absolute text-center w-full px-4">
    <h2 class="text-4xl md:text-6xl font-serif leading-tight">Advisory before <span class="text-brand-gold italic">transaction</span>.</h2>
  </div>
  <div class="statement absolute text-center w-full px-4">
    <h2 class="text-4xl md:text-6xl font-serif leading-tight">Property handled <span class="text-brand-gold italic">privately</span>.</h2>
  </div>
</section>
```

**JavaScript:**
```javascript
// Pinned Floating Statements
const statements = gsap.utils.toArray(".statement");

// Set initial state
gsap.set(statements, { opacity: 0, scale: 0.8, filter: "blur(10px)" });

ScrollTrigger.create({
  trigger: "#statements",
  start: "top top",
  end: `+=${statements.length * 100}%`,
  pin: true,
  scrub: 1,
  onUpdate: (self) => {
    const progress = self.progress * statements.length;
    statements.forEach((statement, i) => {
      const dist = progress - i;
      let opacity = 0, scale = 0.8, blur = 10;

      if (dist > -0.5 && dist < 1.5) {
        if (dist < 0.5) {
          opacity = gsap.utils.mapRange(-0.5, 0.5, 0, 1, dist);
          scale = gsap.utils.mapRange(-0.5, 0.5, 0.8, 1, dist);
          blur = gsap.utils.mapRange(-0.5, 0.5, 10, 0, dist);
        } else {
          opacity = gsap.utils.mapRange(0.5, 1.5, 1, 0, dist);
          scale = gsap.utils.mapRange(0.5, 1.5, 1, 1.2, dist);
          blur = gsap.utils.mapRange(0.5, 1.5, 0, 10, dist);
        }
      }

      gsap.set(statement, {
        opacity: opacity,
        scale: scale,
        filter: `blur(${blur}px)`,
        zIndex: Math.round(opacity * 10)
      });
    });
  }
});
```

---

### Pattern 11: Form Field Focus Animations

**When to use:** Contact forms, inquiry forms -- adds interactivity to form inputs.

**HTML:**
```html
<form class="space-y-8">
  <div class="form-field relative">
    <label class="text-xs tracking-widest text-gray-500 block mb-3">FULL NAME</label>
    <input type="text" required class="w-full bg-transparent border-b border-white/20 py-4 outline-none focus:border-brand-gold transition-colors text-white">
    <div class="form-line absolute bottom-0 left-0 w-0 h-[2px] bg-brand-gold"></div>
  </div>
</form>
```

**JavaScript:**
```javascript
// Stagger form fields on scroll
gsap.from(".form-field", {
  opacity: 0,
  x: -30,
  stagger: 0.15,
  duration: 0.8,
  ease: "power2.out",
  scrollTrigger: {
    trigger: "form",
    start: "top 75%",
    toggleActions: "play none none reverse"
  }
});

// Animate underline on focus
document.querySelectorAll(".form-field input, .form-field textarea, .form-field select").forEach(input => {
  const line = input.parentElement.querySelector(".form-line");
  if (line) {
    input.addEventListener("focus", () => gsap.to(line, { width: "100%", duration: 0.4, ease: "power2.out" }));
    input.addEventListener("blur", () => gsap.to(line, { width: "0%", duration: 0.3, ease: "power2.in" }));
  }
});
```

---

### Pattern 12: Footer Reveal with Fade

**When to use:** Every page footer. Creates a smooth transition into the footer.

**JavaScript:**
```javascript
// Footer fade-in
gsap.from("footer", {
  opacity: 0,
  y: 40,
  duration: 1,
  ease: "power2.out",
  scrollTrigger: {
    trigger: "footer",
    start: "top 90%",
    toggleActions: "play none none reverse"
  }
});
```

---

### Pattern 13: Scroll Progress Indicator

**When to use:** Every page for a luxury, immersive feel.

**HTML (place inside body, before other content):**
```html
<div id="scroll-indicator" class="fixed right-4 top-1/2 -translate-y-1/2 w-1 h-32 bg-brand-gold/20 rounded-full z-50 opacity-0">
  <div id="scroll-progress" class="w-full bg-brand-gold rounded-full transition-all duration-100 ease-out" style="height: 0%"></div>
</div>
```

**JavaScript:**
```javascript
// Custom Scroll Progress Indicator
const scrollIndicator = document.getElementById("scroll-indicator");
const scrollProgress = document.getElementById("scroll-progress");
let scrollTimeout;

window.addEventListener("scroll", () => {
  // Show indicator
  gsap.to(scrollIndicator, { opacity: 1, duration: 0.3, ease: "power2.out" });

  // Update progress
  const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
  scrollProgress.style.height = `${scrollPercent}%`;

  // Hide after scrolling stops
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    gsap.to(scrollIndicator, { opacity: 0, duration: 0.5, ease: "power2.in" });
  }, 1500);
});
```

---

### Pattern 14: Hover-Triggered Micro-Animations (CSS + GSAP hybrid)

**When to use:** Buttons, cards, links -- adds tactile feel to interactive elements.

**CSS:**
```css
/* Button hover effect */
.btn-luxury {
  position: relative;
  overflow: hidden;
}
.btn-luxury::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(212,175,55,0.1), transparent);
  transition: left 0.6s ease;
}
.btn-luxury:hover::before {
  left: 100%;
}
```

**JavaScript (for card hover depth):**
```javascript
// Card hover depth effect
document.querySelectorAll(".card-item").forEach(card => {
  card.addEventListener("mouseenter", () => {
    gsap.to(card, {
      y: -8,
      boxShadow: "0 20px 60px rgba(212,175,55,0.08)",
      borderColor: "rgba(212,175,55,0.3)",
      duration: 0.4,
      ease: "power2.out"
    });
  });
  card.addEventListener("mouseleave", () => {
    gsap.to(card, {
      y: 0,
      boxShadow: "none",
      borderColor: "rgba(255,255,255,0.1)",
      duration: 0.3,
      ease: "power2.in"
    });
  });
});
```

---

### Pattern 15: Page Load Curtain Reveal

**When to use:** Optionally on key pages for a dramatic entrance (not needed on every page).

**HTML (first element in body):**
```html
<div id="page-curtain" class="fixed inset-0 bg-brand-black z-[10000] flex items-center justify-center">
  <img src="/secondary-logo.png" alt="" class="w-16 h-16 opacity-50" id="curtain-logo">
</div>
```

**JavaScript:**
```javascript
// Page Load Curtain
const curtainTl = gsap.timeline();

curtainTl
  .to("#curtain-logo", {
    opacity: 0,
    scale: 0.5,
    duration: 0.8,
    ease: "power2.inOut",
    delay: 0.3
  })
  .to("#page-curtain", {
    yPercent: -100,
    duration: 1,
    ease: "power3.inOut"
  })
  .set("#page-curtain", { display: "none" });
```

---

## 5. Easing & Timing Guidelines

### Recommended Easings by Context

| Context | Easing | Duration | Why |
|---------|--------|----------|-----|
| Hero title entrance | `power4.out` | 1.2-1.5s | Dramatic, cinematic deceleration |
| Section heading reveal | `power3.out` | 0.8-1.0s | Smooth, authoritative |
| Card/item stagger | `power2.out` | 0.6-0.8s | Quick but elegant |
| Gold line expansion | `power2.inOut` | 1.0-1.5s | Symmetrical, architectural |
| Text typing | `"none"` (linear) | 2.0-3.0s | Even, readable pace |
| Parallax (scrub) | `"none"` (linear) | n/a (scrub) | Smooth, natural scroll-linked |
| Image mask reveal | `power3.inOut` | 1.0-1.2s | Dramatic sweep |
| Button hover | `power2.out` | 0.3-0.4s | Responsive, not sluggish |
| Footer reveal | `power2.out` | 0.8-1.0s | Gentle appearance |

### Timing Principles for Luxury

1. **Never rush.** Minimum animation duration: 0.6s for reveals, 0.3s for hover states.
2. **Stagger at 0.1-0.2s intervals.** Faster than 0.1s looks simultaneous. Slower than 0.3s feels sluggish.
3. **Overlap timeline entries.** Use `"-=0.4"` or similar to create fluid sequences, not rigid step-by-step.
4. **Hero animations should take 3-5 seconds total** from page load to completion.
5. **ScrollTrigger start at "top 75%"** -- elements animate before reaching center screen, feeling proactive.

### What to AVOID

- **Bounce easing** -- too playful, cheapens the luxury feel
- **Elastic easing** -- too whimsical for a property brand
- **Duration under 0.3s** -- feels cheap/snappy rather than smooth
- **Duration over 3s for individual tweens** -- user loses patience
- **animating width/height** -- causes layout thrashing, use transform: scale instead
- **Too many simultaneous animations** -- max 3-5 concurrent, stagger the rest

---

## 6. Complete Page Template

This is the MINIMUM viable luxury page. The AI must produce at least this level of animation for every page:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PAGE_TITLE | Davidson & Co London</title>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;700&family=Manrope:wght@200;300;400;500&display=swap" rel="stylesheet">

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- GSAP Animation Suite -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/TextPlugin.min.js"></script>

  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              black: '#080808',
              charcoal: '#121212',
              gold: '#D4AF37',
              goldDim: '#8A7120',
              stone: '#1c1c1c',
              white: '#F5F5F5'
            }
          },
          fontFamily: {
            serif: ['Cinzel', 'serif'],
            sans: ['Manrope', 'sans-serif'],
          }
        }
      }
    }
  </script>

  <style>
    body {
      background-color: #080808;
      color: #F5F5F5;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }
    ::-webkit-scrollbar { width: 0px; background: transparent; }

    .text-gold-gradient {
      background: linear-gradient(to right, #D4AF37, #FEE180, #D4AF37);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      background-size: 200% auto;
      animation: shine 5s linear infinite;
    }
    @keyframes shine { to { background-position: 200% center; } }

    .grain-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 9999;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E");
    }

    .btn-luxury {
      position: relative;
      overflow: hidden;
    }
    .btn-luxury::before {
      content: '';
      position: absolute;
      top: 0; left: -100%;
      width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(212,175,55,0.1), transparent);
      transition: left 0.6s ease;
    }
    .btn-luxury:hover::before { left: 100%; }
  </style>
</head>

<body class="relative">

  <!-- Grain Overlay -->
  <div class="grain-overlay"></div>

  <!-- Scroll Progress -->
  <div id="scroll-indicator" class="fixed right-4 top-1/2 -translate-y-1/2 w-1 h-32 bg-brand-gold/20 rounded-full z-50 opacity-0">
    <div id="scroll-progress" class="w-full bg-brand-gold rounded-full transition-all duration-100 ease-out" style="height: 0%"></div>
  </div>

  <!-- Navigation -->
  <nav class="fixed top-0 left-0 w-full z-50 flex justify-between items-center p-8 mix-blend-difference pointer-events-none">
    <a href="/" class="pointer-events-auto"><img src="/logo.png" alt="Davidson & Co." class="h-10"></a>
    <div class="flex gap-8 text-xs tracking-widest pointer-events-auto">
      <a href="/" class="hover:text-brand-gold transition-colors duration-300">HOME</a>
      <a href="/who-we-are" class="hover:text-brand-gold transition-colors duration-300">WHO WE ARE</a>
      <a href="/contact" class="hover:text-brand-gold transition-colors duration-300">CONTACT</a>
    </div>
  </nav>

  <!-- HERO SECTION -->
  <section id="hero" class="relative h-screen flex items-center justify-center overflow-hidden bg-brand-black">
    <div class="relative z-10 text-center max-w-4xl px-8">
      <div class="w-[1px] h-24 bg-brand-gold mx-auto mb-8 origin-top" id="hero-line"></div>
      <h1 class="text-5xl md:text-8xl font-serif font-bold tracking-tighter mb-6" id="hero-title">
        Page <span class="text-gold-gradient">Title</span>
      </h1>
      <p class="font-sans font-light text-lg md:text-xl text-gray-400 max-w-2xl mx-auto" id="hero-subtitle"></p>
      <div class="mt-12" id="hero-cta">
        <a href="#content" class="btn-luxury px-8 py-3 border border-brand-gold/30 text-xs tracking-widest hover:bg-brand-gold hover:text-brand-black transition-all duration-500">DISCOVER MORE</a>
      </div>
    </div>
  </section>

  <!-- CONTENT SECTION 1 -->
  <section id="content" class="py-24 md:py-32 bg-brand-stone relative overflow-hidden">
    <div class="max-w-6xl mx-auto px-8">
      <div class="text-center mb-16">
        <div class="w-0 h-[2px] bg-brand-gold mx-auto mb-8 content-line"></div>
        <span class="text-brand-gold text-xs tracking-[0.3em] uppercase block mb-4 content-fade">Section Label</span>
        <h2 class="text-4xl md:text-5xl font-serif content-fade">Section <span class="text-gold-gradient">Heading</span></h2>
      </div>
      <p class="text-center text-gray-400 font-sans text-lg max-w-3xl mx-auto leading-relaxed content-fade">
        Section body text goes here. Rich, descriptive content about this topic.
      </p>
    </div>
  </section>

  <!-- CARDS/GRID SECTION -->
  <section id="cards-section" class="py-24 md:py-32 bg-brand-charcoal">
    <div class="max-w-7xl mx-auto px-8">
      <div class="text-center mb-16">
        <div class="w-0 h-[2px] bg-brand-gold mx-auto mb-8 cards-line"></div>
        <h2 class="text-4xl md:text-5xl font-serif cards-title-fade">Grid <span class="text-gold-gradient">Section</span></h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8" id="cards-container">
        <div class="card-item border border-white/10 p-10 hover:border-brand-gold/30 transition-all duration-500 group">
          <span class="text-brand-gold text-xs tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">01</span>
          <h3 class="text-2xl font-serif mt-4 mb-3">Card Title</h3>
          <p class="text-sm text-gray-400 font-sans leading-relaxed">Description text goes here.</p>
        </div>
        <div class="card-item border border-white/10 p-10 hover:border-brand-gold/30 transition-all duration-500 group">
          <span class="text-brand-gold text-xs tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">02</span>
          <h3 class="text-2xl font-serif mt-4 mb-3">Card Title</h3>
          <p class="text-sm text-gray-400 font-sans leading-relaxed">Description text goes here.</p>
        </div>
        <div class="card-item border border-white/10 p-10 hover:border-brand-gold/30 transition-all duration-500 group">
          <span class="text-brand-gold text-xs tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">03</span>
          <h3 class="text-2xl font-serif mt-4 mb-3">Card Title</h3>
          <p class="text-sm text-gray-400 font-sans leading-relaxed">Description text goes here.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- QUOTE / STATEMENT SECTION -->
  <section class="py-24 bg-brand-black relative overflow-hidden">
    <div class="w-[1px] h-full absolute left-1/2 top-0 bg-white/5"></div>
    <div class="relative z-10 text-center max-w-2xl mx-auto px-8">
      <h3 class="text-xl md:text-2xl font-serif italic text-brand-white/80" id="typed-quote"></h3>
      <div class="w-0 h-[2px] mt-8 bg-brand-gold mx-auto" id="quote-underline"></div>
    </div>
  </section>

  <!-- CTA SECTION -->
  <section id="cta-section" class="py-24 md:py-32 bg-brand-stone text-center">
    <div class="max-w-2xl mx-auto px-8">
      <div class="w-0 h-[2px] bg-brand-gold mx-auto mb-8 cta-line"></div>
      <h2 class="text-4xl md:text-5xl font-serif mb-6 cta-fade">Ready to <span class="text-gold-gradient">Begin</span>?</h2>
      <p class="text-gray-400 font-sans text-lg mb-12 cta-fade">Contact our team for a private consultation.</p>
      <a href="/contact" class="btn-luxury inline-block px-12 py-4 border border-brand-gold/30 text-xs tracking-[0.2em] hover:bg-brand-gold hover:text-brand-black transition-all duration-500 cta-fade">CONTACT US</a>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="bg-black text-white/40 py-24 px-8 border-t border-white/5">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start">
      <div class="mb-12 md:mb-0">
        <img src="/logo.png" alt="Davidson & Co." class="h-12 mb-4">
      </div>
      <div class="flex gap-16 text-xs font-sans tracking-widest">
        <div>
          <h6 class="text-white mb-4">NAVIGATION</h6>
          <ul class="space-y-2">
            <li><a href="/" class="hover:text-brand-gold transition-colors">Home</a></li>
            <li><a href="/who-we-are" class="hover:text-brand-gold transition-colors">Who We Are</a></li>
            <li><a href="/contact" class="hover:text-brand-gold transition-colors">Contact</a></li>
          </ul>
        </div>
        <div>
          <h6 class="text-white mb-4">CONTACT</h6>
          <ul class="space-y-2">
            <li><a href="tel:+442080544065" class="hover:text-brand-gold transition-colors">020 8054 4065</a></li>
            <li><a href="mailto:info@davidsoncolondon.com" class="hover:text-brand-gold transition-colors">info@davidsoncolondon.com</a></li>
          </ul>
        </div>
      </div>
    </div>
    <div class="text-[10px] text-center mt-24 opacity-20 font-sans">
      &copy; 2026 DAVIDSON & CO. LONDON. ALL RIGHTS RESERVED.
    </div>
  </footer>

  <!-- ============================================ -->
  <!-- GSAP ANIMATIONS - ALL IN ONE SCRIPT BLOCK   -->
  <!-- ============================================ -->
  <script>
    document.addEventListener("DOMContentLoaded", () => {
      gsap.registerPlugin(ScrollTrigger, TextPlugin);

      // Respect reduced motion
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) {
        gsap.globalTimeline.timeScale(100);
        return;
      }

      // ---- HERO CINEMATIC REVEAL ----
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTl
        .from("#hero-line", { scaleY: 0, duration: 1.2, ease: "power2.inOut" })
        .from("#hero-title", { opacity: 0, y: 60, duration: 1.4, ease: "power4.out" }, "-=0.6")
        .to("#hero-subtitle", { text: "A tagline typed character by character for effect", duration: 2.5, ease: "none" }, "-=0.4")
        .from("#hero-cta", { opacity: 0, y: 30, duration: 1 }, "-=0.8");

      // ---- CONTENT SECTION REVEAL ----
      const contentTl = gsap.timeline({
        scrollTrigger: { trigger: "#content", start: "top 75%", toggleActions: "play none none reverse" }
      });
      contentTl
        .to(".content-line", { width: "120px", duration: 1, ease: "power2.inOut" })
        .from(".content-fade", { opacity: 0, y: 40, stagger: 0.2, duration: 1, ease: "power3.out" }, "-=0.5");

      // ---- CARDS STAGGER ----
      const cardsTl = gsap.timeline({
        scrollTrigger: { trigger: "#cards-section", start: "top 75%", toggleActions: "play none none reverse" }
      });
      cardsTl
        .to(".cards-line", { width: "120px", duration: 1, ease: "power2.inOut" })
        .from(".cards-title-fade", { opacity: 0, y: 40, duration: 1, ease: "power3.out" }, "-=0.5")
        .from(".card-item", { opacity: 0, y: 60, scale: 0.95, stagger: 0.15, duration: 0.8, ease: "power3.out" }, "-=0.4");

      // Card hover depth
      document.querySelectorAll(".card-item").forEach(card => {
        card.addEventListener("mouseenter", () => {
          gsap.to(card, { y: -8, boxShadow: "0 20px 60px rgba(212,175,55,0.08)", borderColor: "rgba(212,175,55,0.3)", duration: 0.4, ease: "power2.out" });
        });
        card.addEventListener("mouseleave", () => {
          gsap.to(card, { y: 0, boxShadow: "none", borderColor: "rgba(255,255,255,0.1)", duration: 0.3, ease: "power2.in" });
        });
      });

      // ---- TYPED QUOTE ----
      const quoteTl = gsap.timeline({
        scrollTrigger: { trigger: "#typed-quote", start: "top 75%", toggleActions: "play none none none" }
      });
      quoteTl
        .to("#typed-quote", { text: "True luxury is the absence of noise.", duration: 2.5, ease: "none" })
        .to("#quote-underline", { width: "200px", duration: 1, ease: "power2.inOut" }, "-=0.5");

      // ---- CTA SECTION ----
      const ctaTl = gsap.timeline({
        scrollTrigger: { trigger: "#cta-section", start: "top 75%", toggleActions: "play none none reverse" }
      });
      ctaTl
        .to(".cta-line", { width: "120px", duration: 1, ease: "power2.inOut" })
        .from(".cta-fade", { opacity: 0, y: 40, stagger: 0.2, duration: 1, ease: "power3.out" }, "-=0.5");

      // ---- FOOTER REVEAL ----
      gsap.from("footer", {
        opacity: 0, y: 40, duration: 1, ease: "power2.out",
        scrollTrigger: { trigger: "footer", start: "top 90%", toggleActions: "play none none reverse" }
      });

      // ---- SCROLL PROGRESS INDICATOR ----
      const scrollIndicator = document.getElementById("scroll-indicator");
      const scrollProgress = document.getElementById("scroll-progress");
      let scrollTimeout;
      window.addEventListener("scroll", () => {
        gsap.to(scrollIndicator, { opacity: 1, duration: 0.3, ease: "power2.out" });
        const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        scrollProgress.style.height = `${pct}%`;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          gsap.to(scrollIndicator, { opacity: 0, duration: 0.5, ease: "power2.in" });
        }, 1500);
      });
    });
  </script>

</body>
</html>
```

---

## 7. System Prompt Integration Plan

### Strategy: Embed Directly Into System Prompt

The animation skill should NOT be a separate tool. It should be embedded directly into the system prompt so the AI always has it available and cannot skip it. Here is the approach:

### A. Replace the Current Animation Section

The current system prompt section titled "REQUIRED STYLING FOR ALL NEW PAGES - MANDATORY ANIMATION REQUIREMENTS" (approximately lines 209-381 of api/chat.js) should be replaced with a condensed but comprehensive animation reference.

### B. Proposed New System Prompt Section

Replace the existing STEP 1 through STEP 5 and EXAMPLE blocks with the following condensed injection:

```
GSAP ANIMATION SYSTEM -- MANDATORY FOR EVERY PAGE:

You MUST use at least 6 distinct GSAP animations on every page. Here is your animation toolkit:

REQUIRED SCRIPT IMPORTS (in <head>, in this exact order):
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/TextPlugin.min.js"></script>

REQUIRED INITIALIZATION (at top of your <script> block, inside DOMContentLoaded):
gsap.registerPlugin(ScrollTrigger, TextPlugin);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (prefersReducedMotion) { gsap.globalTimeline.timeScale(100); return; }

ANIMATION PATTERNS -- Use these by section type:

PATTERN A -- HERO (mandatory on every page):
Use gsap.timeline() for sequential reveal:
1. Gold line draws down: gsap.from("#hero-line", { scaleY: 0, duration: 1.2, ease: "power2.inOut" })
2. Title fades up: gsap.from("#hero-title", { opacity: 0, y: 60, duration: 1.4, ease: "power4.out" })
3. Subtitle types: gsap.to("#hero-subtitle", { text: "Your tagline", duration: 2.5, ease: "none" })
4. CTA appears: gsap.from("#hero-cta", { opacity: 0, y: 30, duration: 1 })
Chain these with timeline offsets like "-=0.6" for fluid overlap.

PATTERN B -- SECTION REVEAL (mandatory for every content section):
Use a timeline triggered by ScrollTrigger:
1. Gold line expands: gsap.to(".section-line", { width: "120px", duration: 1, ease: "power2.inOut" })
2. Heading and label fade up with stagger: gsap.from(".section-fade", { opacity: 0, y: 40, stagger: 0.2, duration: 1, ease: "power3.out" })
ScrollTrigger config: { trigger: "#section-id", start: "top 75%", toggleActions: "play none none reverse" }

PATTERN C -- CARDS/GRID STAGGER (use for any grid layout):
gsap.from(".card-item", { opacity: 0, y: 60, scale: 0.95, stagger: { each: 0.15, ease: "power2.out" }, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: "#container", start: "top 75%", toggleActions: "play none none reverse" } });
Also add hover depth:
card.addEventListener("mouseenter", () => gsap.to(card, { y: -8, boxShadow: "0 20px 60px rgba(212,175,55,0.08)", duration: 0.4, ease: "power2.out" }));
card.addEventListener("mouseleave", () => gsap.to(card, { y: 0, boxShadow: "none", duration: 0.3, ease: "power2.in" }));

PATTERN D -- TEXT TYPING (use for quotes, taglines, mission statements):
gsap.to("#element", { text: "Your text here", duration: 2.5, ease: "none", scrollTrigger: { trigger: "#element", start: "top 75%" } });
Follow with underline expansion: gsap.to("#underline", { width: "200px", duration: 1, ease: "power2.inOut" });

PATTERN E -- PARALLAX (use when section has background image):
gsap.to("#bg-layer", { yPercent: 25, ease: "none", scrollTrigger: { trigger: "#section", start: "top bottom", end: "bottom top", scrub: true } });
gsap.to("#content-layer", { yPercent: -15, ease: "none", scrollTrigger: { trigger: "#section", start: "top bottom", end: "bottom top", scrub: true } });

PATTERN F -- NUMBER COUNTERS (use for stats/numbers):
gsap.to(counter, { innerText: targetValue, duration: 2.5, ease: "power2.out", snap: { innerText: 1 }, scrollTrigger: { trigger: "#stats", start: "top 75%" } });

PATTERN G -- IMAGE MASK REVEAL (use for key images):
Timeline: gold mask sweeps right (xPercent: 100), then image zooms from scale 1.3 to 1.1.

PATTERN H -- FOOTER REVEAL:
gsap.from("footer", { opacity: 0, y: 40, duration: 1, ease: "power2.out", scrollTrigger: { trigger: "footer", start: "top 90%" } });

EASING RULES:
- Hero: power4.out (dramatic)
- Headings: power3.out (smooth)
- Cards/items: power2.out (quick but elegant)
- Gold lines: power2.inOut (symmetrical)
- Text typing: "none" (linear)
- Parallax: "none" (linear, scrub-linked)
- NEVER use bounce or elastic easings

TIMING RULES:
- Hero total sequence: 3-5 seconds
- Section reveals: 0.8-1.2 seconds
- Stagger intervals: 0.1-0.2 seconds
- ScrollTrigger start: "top 75%" (animate before center screen)
- Always use timeline offsets ("-=0.4", "-=0.6") for fluid overlap
- NEVER have elements just appear instantly

MINIMUM REQUIREMENTS PER PAGE:
1. Hero cinematic timeline (Pattern A) -- REQUIRED
2. At least 2 section reveals with gold lines (Pattern B) -- REQUIRED
3. At least 1 stagger animation for grids/cards (Pattern C) -- REQUIRED
4. At least 1 text typing effect (Pattern D) -- REQUIRED
5. Footer reveal (Pattern H) -- REQUIRED
6. Card hover depth effects -- REQUIRED
7. Scroll progress indicator -- RECOMMENDED

ANIMATION CHECKLIST -- VERIFY BEFORE RESPONDING:
[ ] GSAP core + ScrollTrigger + TextPlugin loaded in <head>
[ ] gsap.registerPlugin(ScrollTrigger, TextPlugin) called
[ ] prefers-reduced-motion check included
[ ] Hero has timeline with at least 3 chained animations
[ ] Each content section has ScrollTrigger-based reveal
[ ] Gold line expansion animation on at least 2 sections
[ ] Cards/grid items have stagger + hover effects
[ ] At least 1 text typing effect
[ ] Footer has reveal animation
[ ] All animated elements have proper initial state (no flash of unstyled content)
[ ] Total distinct animations >= 6

If ANY of these fail, FIX before telling user the page is done.
```

### C. Key Changes from Current System

1. **Raised minimum from 3 to 6 animations** -- 3 was too low and easily met with trivial opacity tweens
2. **Organized by section type** -- AI knows which pattern to use WHERE
3. **Mandatory timeline for hero** -- prevents the single-tween hero problem
4. **Explicit easing guidance** -- prevents generic "power2.out" on everything
5. **Hover interactions required** -- adds interactivity beyond scroll animations
6. **Checklist is more granular** -- each item is specific and verifiable
7. **prefers-reduced-motion** -- accessibility compliance built-in

### D. Where to Make the Edit

In `/Users/paulbridges/Desktop/new d&c/davidsonandco/api/chat.js`:

1. **Remove** the section from line ~209 ("REQUIRED STYLING FOR ALL NEW PAGES") through line ~381 ("NEVER use <link rel="stylesheet" href="/styles.css">")
2. **Replace** with the condensed GSAP ANIMATION SYSTEM block above
3. **Keep** all other sections (brand identity, conversation style, rules, etc.) unchanged
4. **Keep** the styling blocks (grain overlay, gold gradient, body styles) but move them BEFORE the animation section for clarity

### E. Additional Reinforcement

Add to the BRAND IDENTITY section near the top of the prompt:

```
- BLOCKING REQUIREMENT: Every page must have AT LEAST 6 distinct GSAP animations including:
  a hero timeline, section reveals, card staggers, text typing, and footer reveal.
  A page with only opacity tweens is FAILED. Use timelines, ScrollTrigger, and varied easings.
```

---

## 8. Accessibility & Performance

### Accessibility

The `prefers-reduced-motion` check is mandatory:

```javascript
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (prefersReducedMotion) {
  gsap.globalTimeline.timeScale(100); // Skip to end state instantly
  return; // Don't set up scroll listeners etc.
}
```

This respects users who have enabled "Reduce Motion" in their OS settings by instantly completing all animations rather than removing content.

### Performance Checklist

1. Only animate `transform` and `opacity` properties
2. Never animate `width`, `height`, `margin`, `padding`, `top`, `left`
3. Use `will-change: transform, opacity` only on elements that actually animate (add via CSS, not inline)
4. Keep total simultaneous animations under 5
5. Use `gsap.utils.toArray()` for batch element selection
6. Set `ScrollTrigger` start/end points efficiently
7. All images that participate in parallax should have `loading="lazy"`

---

## Research Sources

- [ScrollTrigger Documentation | GSAP](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [GSAP ScrollTrigger: Complete Guide with 20+ Examples (2025) | GSAPify](https://gsapify.com/gsap-scrolltrigger)
- [Get Started with ScrollTrigger | GreenSock](https://gsap.com/community/st-get-started/)
- [GSAP Animations Modern Websites | Top Effects & Pro Guide 2025](https://devsync.tn/blog/top-gsap-animations-modern-websites/)
- [High-Performance Web Animation: GSAP, WebGL, and the Secret to 60fps](https://dev.to/kolonatalie/high-performance-web-animation-gsap-webgl-and-the-secret-to-60fps-2l1g)
- [Staggers | GSAP Docs](https://gsap.com/resources/getting-started/Staggers/)
- [Easing | GSAP Docs](https://gsap.com/docs/v3/Eases/)
- [GSAP Scroll Page](https://gsap.com/scroll/)
- [Made With GSAP](https://madewithgsap.com/)
- [Best GSAP Animation Websites | Awwwards](https://www.awwwards.com/websites/gsap/)
- [SplitType - Free SplitText Alternative](https://github.com/lukePeavey/SplitType)
- [48 GSAP ScrollTrigger Examples](https://freefrontend.com/scroll-trigger-js/)
- [Trigger Animations On Scroll With GSAP | Marmelab](https://marmelab.com/blog/2024/04/11/trigger-animations-on-scroll-with-gsap-scrolltrigger.html)
- [GSAP Best Practices | RUSTCODE](https://www.rustcodeweb.com/2024/04/gsap-best-practices.html)
