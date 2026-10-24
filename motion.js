// Scroll and intro animations with GSAP + ScrollTrigger. Pure enhancement: if the
// library does not load, or the visitor prefers reduced motion, nothing runs and
// the page keeps its CSS animations.
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const $$ = s => [...document.querySelectorAll(s)];

  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    // Reading progress along the top edge.
    const bar = document.createElement("div");
    bar.className = "scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

    // Hero: text column enters line by line, the editor screenshot swings in.
    const heroText = document.querySelector(".hero-grid > div:first-child");
    if (heroText) {
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .from(heroText.children, { y: 34, autoAlpha: 0, duration: 0.8, stagger: 0.07, clearProps: "transform,opacity,visibility" })
        .from(".device .frame", { x: 90, rotationY: -28, scale: 0.9, autoAlpha: 0, duration: 1.2, transformPerspective: 1200, clearProps: "transform,opacity,visibility" }, 0.15)
        .from(".device .glow", { scale: 0.4, autoAlpha: 0, duration: 1.4 }, 0.3);

      // Leaving the hero: the text drifts up and the screenshot slowly zooms out.
      gsap.to(heroText, { y: -70, opacity: 0.25, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.fromTo(".device .frame img", { scale: 1.08 }, { scale: 1, yPercent: 3, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    }

    // Section titles: a cut line sweeps across and reveals the words.
    // The sweep covers only the text, not the empty space around centred titles.
    const textSpan = el => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const t = range.getBoundingClientRect(), b = el.getBoundingClientRect();
      return b.width ? [(t.left - b.left) / b.width * 100, (t.right - b.left) / b.width * 100] : [0, 100];
    };
    $$("main h2, #countries-heading, #feedback-heading").forEach(h2 => {
      h2.classList.add("cut");
      h2.style.setProperty("--cut", 0);
      ScrollTrigger.create({
        trigger: h2, start: "top 88%", once: true,
        onEnter: () => {
          const [from, to] = textSpan(h2);
          gsap.fromTo(h2, { "--cut": from }, {
            "--cut": to, duration: 1.1, ease: "power3.inOut",
            onComplete: () => { h2.classList.remove("cut"); h2.style.removeProperty("--cut"); }
          });
        }
      });
    });

    // Demo player tilts up into place while scrolling to it.
    gsap.fromTo(".player", { scale: 0.86, rotationX: 16, transformPerspective: 1400, transformOrigin: "50% 100%" }, {
      scale: 1, rotationX: 0, ease: "none",
      scrollTrigger: { trigger: ".player", start: "top 95%", end: "top 30%", scrub: 0.6 }
    });

    // Timeline mock-up: clips are "laid down" on their lanes, one after another.
    gsap.from(".tl .clip", {
      scaleX: 0, transformOrigin: "0% 50%", duration: 0.8, ease: "power3.out", stagger: { amount: 0.9 },
      scrollTrigger: { trigger: ".tl", start: "top 78%", once: true }
    });

    // News visuals pop in as each card reaches the screen.
    $$(".news-visual").forEach(v => {
      gsap.from(v.children, {
        y: 18, scale: 0.6, autoAlpha: 0, duration: 0.6, ease: "back.out(2)", stagger: 0.08,
        scrollTrigger: { trigger: v, start: "top 90%", once: true }
      });
    });

    return () => bar.remove();
  });

  // Layout changes (language switch, late images) move the trigger points.
  window.addEventListener("load", () => ScrollTrigger.refresh());
  $$(".lang button").forEach(b => b.addEventListener("click", () => requestAnimationFrame(() => ScrollTrigger.refresh())));
})();
