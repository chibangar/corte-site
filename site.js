// The cinematic scroll of the Corte website. Every chapter is pinned while its
// story plays with the scroll: the product enters, a big number counts, text
// arrives out of a chromatic blur and the light changes colour. Without GSAP,
// on small screens or with reduced motion, the page stays readable as is (the
// numbers are already written in the HTML).
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmt = v => Math.round(v).toLocaleString(root.lang === "en" ? "en" : "pt-PT");

  // Each chapter has its own light; the header pill follows the chapter on screen.
  $$(".chapter").forEach(ch => ch.style.setProperty("--glow", ch.dataset.glow));
  function setPill(color) {
    root.style.setProperty("--pill", color);
  }
  const pillWatch = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && e.target.dataset.pill) setPill(e.target.dataset.pill);
  }), { rootMargin: "-45% 0px -45% 0px" });
  $$(".chapter").forEach(ch => pillWatch.observe(ch));

  // Stickers: a category card swaps the three stickers and the light.
  const stickers = $("#stickers");
  if (stickers) {
    const imgs = $$(".sticker-stage img", stickers);
    $$(".swatch", stickers).forEach(btn => btn.addEventListener("click", () => {
      $$(".swatch", stickers).forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
      stickers.style.setProperty("--glow", btn.dataset.glow);
      const names = btn.dataset.set.split(",");
      imgs.forEach((img, i) => {
        // Inline styles, so they win over whatever the scroll animation left.
        img.style.transition = "opacity .45s, scale .6s cubic-bezier(.2, .8, .2, 1.3)";
        img.style.opacity = "0";
        img.style.scale = "0.8";
        setTimeout(() => {
          const show = () => { img.style.opacity = "1"; img.style.scale = "1"; };
          img.onload = show;
          img.src = "img/stickers/" + names[i] + ".png";
          if (img.complete) show();
        }, reduced ? 0 : 260 + i * 70);
      });
    }));
  }

  // The sound chapter's waveform: bars that breathe while on screen.
  const wave = $("#som .wave");
  let waveLevel = 0.35;
  if (wave) {
    const n = innerWidth < 900 ? 44 : 56;
    const bars = Array.from({ length: n }, (_, i) => {
      const b = document.createElement("i");
      wave.appendChild(b);
      // A cinematic hit: loud in the middle, quieter at the edges.
      const env = Math.exp(-Math.pow((i - n * 0.42) / (n * 0.22), 2)) * 0.85 + 0.15;
      return { el: b, env, speed: 1.5 + Math.random() * 2.5, phase: Math.random() * 6.28 };
    });
    let on = false;
    const draw = t => {
      for (const b of bars) {
        const h = b.env * waveLevel * (0.45 + 0.55 * Math.abs(Math.sin(t / 1000 * b.speed + b.phase)));
        b.el.style.setProperty("--h", Math.max(0.03, Math.min(1, h)).toFixed(3));
      }
      if (on && !reduced) requestAnimationFrame(draw);
    };
    draw(0);
    new IntersectionObserver(es => es.forEach(e => {
      const was = on;
      on = e.isIntersecting;
      if (on && !was && !reduced) requestAnimationFrame(draw);
    })).observe(wave);
  }

  if (!window.gsap || !window.ScrollTrigger || reduced || document.body.classList.contains("cc")) return;
  gsap.registerPlugin(ScrollTrigger);

  // Text that arrives out of a chromatic blur (and leaves into one).
  const fxFrom = { opacity: 0, y: 40, filter: "blur(18px)", "--ca": 10 };
  const fxTo = { opacity: 1, y: 0, filter: "blur(0px)", "--ca": 0 };
  const fxIn = (tl, el, at, d = 0.25) => el && tl.fromTo(el, fxFrom, { ...fxTo, duration: d, ease: "power2.out" }, at);
  const fxOut = (tl, el, at, d = 0.18) => el && tl.to(el, { opacity: 0, y: -30, filter: "blur(16px)", "--ca": -10, duration: d, ease: "power2.in" }, at);

  // A big number counting between data-from and data-to (read live: the
  // downloads total arrives later from GitHub).
  function count(tl, el, at, d = 0.45) {
    if (!el) return;
    const p = { v: 0 };
    tl.to(p, {
      v: 1, duration: d, ease: "power2.out",
      onUpdate: () => {
        const from = +el.dataset.from || 0, to = +el.dataset.to || 0;
        el.firstChild.textContent = to ? fmt(from + (to - from) * p.v) : "—";
      }
    }, at);
  }

  const mm = gsap.matchMedia();

  // ---------- desktop: pinned chapters scrubbed by the scroll ----------
  mm.add("(min-width: 901px)", () => {
    const chapter = (id, length, build) => {
      const ch = document.getElementById(id);
      if (!ch) return;
      const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: ch, start: "top top", end: "+=" + length + "%", scrub: 0.6, pin: $(".stage", ch), anticipatePin: 1 } });
      build(ch, tl);
      tl.to({}, { duration: 0.0001 }, 1); // the timeline always spans 0..1
    };

    // 1. Hero: the editor rises out of the dark (on load), then the scroll pulls it away.
    const hero = $("#hero");
    if (hero) {
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .from($(".ambient", hero), { opacity: 0, duration: 1.6 })
        .from($(".device", hero), { opacity: 0, y: 80, scale: 0.92, filter: "brightness(0.2)", duration: 1.6 }, 0.1)
        .from($(".floor", hero), { opacity: 0, scaleX: 0.3, duration: 1.4 }, 0.4)
        .from($(".giant", hero), { opacity: 0, scale: 0.9, filter: "blur(20px)", duration: 1.6 }, 0.3)
        .fromTo($(".copy h1", hero), fxFrom, { ...fxTo, duration: 1.1 }, 0.8)
        .from($$(".copy p, .copy .cta, .meta", hero), { opacity: 0, y: 20, duration: 0.9, stagger: 0.1 }, 1.1);
    }
    chapter("hero", 110, (ch, tl) => {
      tl.to($(".giant", ch), { yPercent: -18, scale: 1.14, opacity: 0.18, duration: 1 }, 0)
        .to($(".device", ch), { y: "-8vh", scale: 0.84, duration: 1 }, 0)
        .to($(".floor", ch), { opacity: 0.2, duration: 1 }, 0);
      fxOut(tl, $(".copy h1", ch), 0.35, 0.3);
      tl.to($$(".copy p, .copy .cta, .meta", ch), { opacity: 0, y: -20, duration: 0.25 }, 0.4);
      tl.to($(".device", ch), { opacity: 0, filter: "blur(10px)", duration: 0.25 }, 0.75);
    });

    // 2. Captions: the lyric video swings up, 12 → 84 templates, callouts.
    chapter("legendas", 170, (ch, tl) => {
      tl.from($(".device", ch), { opacity: 0, scale: 0.7, rotationX: 28, transformPerspective: 1400, y: 120, duration: 0.3, ease: "power2.out" }, 0);
      fxIn(tl, $(".copy.tl .num", ch), 0.05);
      count(tl, $(".copy.tl .num", ch), 0.08, 0.5);
      tl.from($(".copy.tl .num-label", ch), { opacity: 0, duration: 0.15 }, 0.2);
      fxIn(tl, $(".copy.br h2", ch), 0.3);
      tl.from($$(".copy.br p, .copy.br .btn", ch), { opacity: 0, y: 20, duration: 0.15, stagger: 0.05 }, 0.4);
      tl.from($$(".callout", ch), { opacity: 0, x: 30, duration: 0.15, stagger: 0.1 }, 0.45);
      tl.to($(".device", ch), { scale: 1.06, opacity: 0, duration: 0.15 }, 0.88);
      fxOut(tl, $$(".copy", ch), 0.86, 0.12);
      tl.to($$(".callout", ch), { opacity: 0, duration: 0.1 }, 0.86);
    });

    // 3. Transitions: the gallery turns to face you, 0 → 32.
    chapter("transicoes", 150, (ch, tl) => {
      tl.fromTo($(".device", ch), { rotationY: -38, rotationX: 10, x: "-10vw", opacity: 0, transformPerspective: 1400 }, { rotationY: 0, rotationX: 0, x: "-6vw", opacity: 1, duration: 0.5, ease: "power2.out" }, 0);
      fxIn(tl, $(".copy .num", ch), 0.1);
      count(tl, $(".copy .num", ch), 0.12, 0.45);
      fxIn(tl, $(".copy h2", ch), 0.35);
      tl.from($(".copy p:not(.num)", ch), { opacity: 0, y: 20, duration: 0.15 }, 0.45);
      tl.to($(".device", ch), { scale: 0.9, opacity: 0, duration: 0.15 }, 0.88);
      fxOut(tl, $(".copy", ch), 0.86, 0.12);
    });

    // 4. Sound: the waveform swells with the scroll, 0 → 47.
    chapter("som", 150, (ch, tl) => {
      const level = { v: 0.15 };
      tl.to(level, { v: 1, duration: 0.5, ease: "power2.out", onUpdate: () => { waveLevel = level.v; } }, 0.05);
      fxIn(tl, $(".copy .num", ch), 0.05);
      count(tl, $(".copy .num", ch), 0.08, 0.5);
      fxIn(tl, $(".copy h2", ch), 0.3);
      tl.from($(".copy p:not(.num)", ch), { opacity: 0, y: 20, duration: 0.15 }, 0.4);
      tl.from($$(".sound-chips span", ch), { opacity: 0, y: 24, filter: "blur(8px)", duration: 0.12, stagger: 0.04 }, 0.45);
      tl.to(level, { v: 0.1, duration: 0.15, onUpdate: () => { waveLevel = level.v; } }, 0.86);
      fxOut(tl, [$(".copy", ch), $(".sound-chips", ch)], 0.86, 0.12);
    });

    // 5. Stickers: they pop in one by one and keep floating.
    chapter("stickers", 110, (ch, tl) => {
      fxIn(tl, $(".copy h2", ch), 0.02);
      tl.from($(".copy p:not(.num)", ch), { opacity: 0, y: 20, duration: 0.12 }, 0.12);
      tl.from($$(".swatch", ch), { opacity: 0, y: 30, duration: 0.12, stagger: 0.05 }, 0.18);
      tl.from($$(".sticker-stage img", ch), { opacity: 0, scale: 0.4, rotation: -20, y: 80, duration: 0.25, stagger: 0.08, ease: "back.out(1.6)" }, 0.05);
      fxOut(tl, $(".copy", ch), 0.88, 0.1);
      tl.to($(".sticker-stage", ch), { opacity: 0, scale: 0.9, duration: 0.1 }, 0.9);
    });

    // 6. AI: the request, then each tool lights up as the agent works.
    chapter("ia", 170, (ch, tl) => {
      fxIn(tl, $(".copy .num", ch), 0.02);
      count(tl, $(".copy .num", ch), 0.05, 0.55);
      fxIn(tl, $(".copy h2", ch), 0.15);
      tl.from($(".copy p:not(.num)", ch), { opacity: 0, y: 20, duration: 0.12 }, 0.25);
      tl.from($(".chat", ch), { opacity: 0, y: 80, scale: 0.94, duration: 0.18, ease: "power2.out" }, 0.05);
      fxIn(tl, $(".ask", ch), 0.15, 0.12);
      tl.from($$(".tool", ch), { opacity: 0, x: -24, filter: "blur(6px)", duration: 0.06, stagger: 0.06 }, 0.28);
      fxIn(tl, $(".done", ch), 0.7, 0.1);
      fxOut(tl, [$(".copy", ch), $(".agent", ch)], 0.9, 0.1);
    });

    // 7. Finale: CORTE lit again; the light turns orange → white → gold.
    chapter("final", 160, (ch, tl) => {
      const palette = [[255, 90, 31], [235, 235, 245], [255, 190, 40]];
      const light = { p: 0 };
      tl.to(light, {
        p: 1, duration: 1, onUpdate: () => {
          const x = light.p * (palette.length - 1), i = Math.min(palette.length - 2, Math.floor(x)), f = x - i;
          const c = palette[i].map((v, k) => Math.round(v + (palette[i + 1][k] - v) * f));
          ch.style.setProperty("--glow", c.join(","));
        }
      }, 0);
      tl.from($(".giant", ch), { opacity: 0, scale: 0.85, filter: "blur(18px)", duration: 0.3 }, 0);
      tl.from($(".device", ch), { opacity: 0, y: 100, scale: 0.9, duration: 0.3, ease: "power2.out" }, 0.05);
      fxIn(tl, $(".copy.tl .num", ch), 0.15);
      count(tl, $(".copy.tl .num", ch), 0.18, 0.4);
      tl.from($(".copy.tl .num-label", ch), { opacity: 0, duration: 0.1 }, 0.3);
      fxIn(tl, $(".copy.bl h2", ch), 0.35);
      tl.from($(".copy.br", ch), { opacity: 0, y: 20, duration: 0.12 }, 0.45);
    });
  });

  // ---------- small screens: no pinning, things arrive as they scroll in ----------
  mm.add("(max-width: 900px)", () => {
    $$(".chapter").forEach(ch => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: ch, start: "top 70%" } });
      fxIn(tl, $$("h1, h2", ch), 0, 0.9);
      tl.from($$(".device, .agent, .sticker-stage, .wave", ch), { opacity: 0, y: 40, duration: 0.8, ease: "power2.out" }, 0.1);
      $$(".num", ch).forEach(n => count(tl, n, 0.1, 1.4));
    });
    waveLevel = 0.9;
  });

  // Specs and other plain sections rise in.
  gsap.from("#tudo .spec", { opacity: 0, y: 50, duration: 0.9, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: "#tudo .specs", start: "top 80%" } });
  gsap.fromTo("#tudo h2", fxFrom, { ...fxTo, duration: 1, scrollTrigger: { trigger: "#tudo", start: "top 75%" } });

  // Layout changes (fonts, language, late images) move the trigger points.
  addEventListener("load", () => ScrollTrigger.refresh());
  $$(".lang button").forEach(b => b.addEventListener("click", () => requestAnimationFrame(() => ScrollTrigger.refresh())));
})();
