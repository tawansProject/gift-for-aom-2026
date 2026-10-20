(() => {
  const PASSWORD = "21102001";
  const TAPS_TO_OPEN = 10;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Android uses the Vibration API. iPhone Safari has none, but toggling a native switch
  // control (iOS 18+) plays the system haptic tick, so we toggle a hidden one.
  const hasVibrate = typeof navigator.vibrate === "function";
  const buzz = (p) => {
    try {
      if (hasVibrate) { navigator.vibrate(p); return; }
      const pulses = Array.isArray(p) ? Math.ceil(p.length / 2) : 1;
      const tick = () => document.getElementById("hapticLabel").click();
      tick();                                   // first tick must run inside the tap itself
      for (let i = 1; i < pulses; i++) setTimeout(tick, i * 90);
    } catch (e) {}
  };
  const $ = (id) => document.getElementById(id);

  /* ================= Password screen ================= */
  const slotsEl = $("slots"), padEl = $("pad"), hintEl = $("hint");
  let entry = "", locked = false;
  for (let i = 0; i < PASSWORD.length; i++) {
    const s = document.createElement("div");
    s.className = "slot" + (i === 1 || i === 3 ? " gap" : "");
    slotsEl.appendChild(s);
  }
  ["1","2","3","4","5","6","7","8","9","","0","ลบ"].forEach((k) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "key" + (k === "ลบ" ? " ghost" : "");
    b.id = "key-" + (k === "ลบ" ? "del" : k || "blank");
    b.textContent = k; if (!k) b.disabled = true;
    b.setAttribute("aria-label", k === "ลบ" ? "ลบตัวเลข" : k);
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); press(k); });
    b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); press(k); } });
    padEl.appendChild(b);
  });
  function renderSlots() {
    [...slotsEl.children].forEach((s, i) => {
      s.textContent = entry[i] || "";
      s.classList.toggle("filled", i < entry.length);
      s.classList.toggle("current", i === entry.length);
    });
  }
  function press(k) {
    if (locked || !k) return;
    hintEl.textContent = "";
    if (k === "ลบ") entry = entry.slice(0, -1);
    else if (entry.length < PASSWORD.length) { entry += k; buzz(8); }
    renderSlots();
    if (entry.length === PASSWORD.length) check();
  }
  function check() {
    locked = true;
    if (entry === PASSWORD) {
      slotsEl.classList.add("ok"); buzz([20, 40, 20]);
      setTimeout(() => {
        $("lock").classList.add("out");
        setTimeout(showPresent, 700);
      }, 450);
    } else {
      slotsEl.classList.add("bad", "shake"); buzz([60, 40, 60]);
      hintEl.textContent = "ยังไม่ถูกนะ ลองใหม่อีกครั้ง";
      setTimeout(() => { slotsEl.classList.remove("bad", "shake"); entry = ""; renderSlots(); locked = false; }, 650);
    }
  }
  document.addEventListener("keydown", (e) => {
    if ($("lock").classList.contains("out")) return;
    if (/^[0-9]$/.test(e.key)) press(e.key);
    else if (e.key === "Backspace") press("ลบ");
  });
  renderSlots();

  /* ================= Present (three.js) ================= */
  const meterEl = $("meter"), meterFill = $("meterFill");
  function setProgress(f) {
    meterFill.style.transform = "scaleX(" + f + ")";
    meterEl.setAttribute("aria-valuenow", Math.round(f * 100));
  }

  // Flat illustrated gift (white box, blue ribbon, purple bow), split into body and lid
  // so the lid can lift off when it opens. Both share one 400x400 frame.
  const INK = "#241a52";
  const S = 'stroke="' + INK + '" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"';
  const DEFS = `
    <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eaedfd"/></linearGradient>
    <linearGradient id="gR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dfe4fb"/><stop offset="1" stop-color="#c6cdf1"/></linearGradient>
    <linearGradient id="gT" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f1f2fe"/></linearGradient>
    <linearGradient id="gRib" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a66ea"/><stop offset=".45" stop-color="#5d8fff"/><stop offset="1" stop-color="#3a66ea"/></linearGradient>
    <linearGradient id="gRibS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2d52cc"/><stop offset="1" stop-color="#21409f"/></linearGradient>
    <linearGradient id="gBow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b786ff"/><stop offset="1" stop-color="#8447ee"/></linearGradient>
    <radialGradient id="gKnot" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#d7bcff"/><stop offset="1" stop-color="#9558f4"/></radialGradient>
    <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="6" cy="7" r="3.2" fill="#d9d0fb"/><circle cx="19" cy="20" r="3.2" fill="#d9d0fb"/></pattern>`;
  const BODY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="1024" height="1024"><defs>${DEFS}</defs>
    <polygon points="62,182 250,195 245,352 80,337" fill="url(#gF)"/>
    <polygon points="62,182 250,195 245,352 80,337" fill="url(#dots)" opacity=".75"/>
    <polygon points="70,190 92,192 104,334 86,333" fill="#ffffff" opacity=".7"/>
    <polygon points="62,182 250,195 245,352 80,337" fill="none" ${S}/>
    <polygon points="250,195 345,166 335,313 245,352" fill="url(#gR)" ${S}/>
    <polygon points="140,188 182,191 179,348 144,344" fill="url(#gRib)" ${S}/>
    <path d="M162,196 L161,340" stroke="#a9c3ff" stroke-width="3" stroke-linecap="round" opacity=".8"/>
    <polygon points="288,183 307,177 299,328 281,336" fill="url(#gRibS)" ${S}/>
    <path d="M250,200 L246,346" stroke="#ffffff" stroke-width="2" opacity=".5"/>
  </svg>`;
  const LID_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="1024" height="1024"><defs>${DEFS}</defs>
    <polygon points="50,140 255,152 355,125 160,110" fill="url(#gT)"/>
    <polygon points="138,146 180,148 283,119 244,116" fill="url(#gRib)"/>
    <polygon points="94,128 116,122 315,136 295,141" fill="#4a7bf7"/>
    <polygon points="50,140 255,152 355,125 160,110" fill="none" ${S}/>
    <polygon points="50,140 255,152 255,197 52,184" fill="url(#gF)"/>
    <polygon points="50,140 255,152 255,197 52,184" fill="url(#dots)" opacity=".75"/>
    <polygon points="50,140 255,152 255,197 52,184" fill="none" ${S}/>
    <polygon points="255,152 355,125 352,166 255,197" fill="url(#gR)" ${S}/>
    <polygon points="138,146 180,148 180,193 138,189" fill="url(#gRib)" ${S}/>
    <polygon points="295,141 315,136 313,178 294,184" fill="url(#gRibS)" ${S}/>
    <ellipse cx="162" cy="134" rx="42" ry="8" fill="${INK}" opacity=".28"/>
    <ellipse cx="252" cy="134" rx="42" ry="8" fill="${INK}" opacity=".28"/>
    <path d="M198,136 C188,160 176,180 160,200 L176,195 L183,209 C194,186 204,162 212,140 Z" fill="url(#gBow)" ${S}/>
    <path d="M216,136 C228,158 240,176 256,192 L240,191 L235,205 C224,184 214,162 204,140 Z" fill="url(#gBow)" ${S}/>
    <path d="M204,124 C182,84 136,66 116,88 C102,106 116,134 150,138 C172,140 192,134 204,124 Z" fill="url(#gBow)" ${S}/>
    <path d="M204,124 C186,104 160,94 138,98 C160,108 180,118 204,124 Z" fill="#7440d8"/>
    <path d="M128,96 C134,88 146,84 158,86" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity=".65"/>
    <path d="M210,124 C232,84 278,66 298,88 C312,106 298,134 264,138 C242,140 222,134 210,124 Z" fill="url(#gBow)" ${S}/>
    <path d="M210,124 C228,104 254,94 276,98 C254,108 234,118 210,124 Z" fill="#7440d8"/>
    <path d="M250,86 C262,82 276,82 286,88" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity=".55"/>
    <ellipse cx="207" cy="126" rx="16" ry="15" fill="url(#gKnot)" ${S}/>
    <circle cx="201" cy="120" r="3.5" fill="#ffffff" opacity=".8"/>
  </svg>`;
  // Party palette with metallic golds and silvers; metallic pieces glint as they turn
  const CONFETTI = [
    { c: 0xffd36b, m: 1 }, { c: 0xfff0c2, m: 1 }, { c: 0xe9ecff, m: 1 }, { c: 0xffb3d9, m: 1 },
    { c: 0x4f86ff, m: 0 }, { c: 0x9cc0ff, m: 0 }, { c: 0xa56bff, m: 0 }, { c: 0xd9c2ff, m: 0 }, { c: 0xffffff, m: 0 }
  ];

  function svgTexture(svg) {
    const img = new Image(), tex = new THREE.Texture();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = c.height = 1024;
      c.getContext("2d").drawImage(img, 0, 0, 1024, 1024);
      tex.image = c; tex.needsUpdate = true;
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }
  function glowTexture(stops, star) {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d"), grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(([o, col]) => grad.addColorStop(o, col));
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    if (star) {                                            // four-point twinkle
      g.fillStyle = "rgba(255,255,255,0.95)";
      g.beginPath();
      g.moveTo(64, 2); g.quadraticCurveTo(68, 60, 126, 64); g.quadraticCurveTo(68, 68, 64, 126);
      g.quadraticCurveTo(60, 68, 2, 64); g.quadraticCurveTo(60, 60, 64, 2); g.fill();
    }
    return new THREE.CanvasTexture(c);
  }

  let started = false;
  function showPresent() {
    $("present").classList.remove("out");
    if (!started) { started = true; initThree(); }
  }

  function initThree() {
    const canvas = $("gl");
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 1);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 500);

    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture([[0, "rgba(140,110,255,0.55)"], [0.45, "rgba(80,100,255,0.18)"], [1, "rgba(0,0,0,0)"]]),
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    glow.position.z = -4; glow.scale.set(30, 30, 1); scene.add(glow);
    const flash = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture([[0, "rgba(255,255,255,1)"], [0.3, "rgba(220,200,255,0.6)"], [1, "rgba(0,0,0,0)"]]),
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    flash.position.z = 3; scene.add(flash);

    // Gift: two textured planes; the lid pivots near the bow
    const SIZE = 16;
    const planeGeo = new THREE.PlaneGeometry(SIZE, SIZE);
    const bodyMat = new THREE.MeshBasicMaterial({ map: svgTexture(BODY_SVG), transparent: true, depthWrite: false });
    const lidMat = new THREE.MeshBasicMaterial({ map: svgTexture(LID_SVG), transparent: true, depthWrite: false });
    const gift = new THREE.Group(); scene.add(gift);
    const body = new THREE.Mesh(planeGeo, bodyMat); gift.add(body);
    const lidPivot = new THREE.Group(); lidPivot.position.set(0, 2.6, 0.02); gift.add(lidPivot);
    const lid = new THREE.Mesh(planeGeo, lidMat); lid.position.y = -2.6; lidPivot.add(lid);

    // Twinkles: a few around the box while tapping, a shower of them when it opens
    const starTex = glowTexture([[0, "rgba(255,255,255,0.9)"], [0.18, "rgba(210,190,255,0.35)"], [1, "rgba(0,0,0,0)"]], true);
    const twinkles = [];
    for (let i = 0; i < 90; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
      sp.visible = false; scene.add(sp);
      twinkles.push({ sp, age: 0, life: 1, size: 1, v: new THREE.Vector3(), on: false });
    }
    function spawnTwinkle(x, y, z, size, life, vx, vy) {
      const tw = twinkles.find((t) => !t.on); if (!tw) return;
      tw.on = true; tw.age = 0; tw.life = life; tw.size = size;
      tw.sp.position.set(x, y, z); tw.v.set(vx || 0, vy || 0, 0); tw.sp.visible = true;
    }

    // Confetti: ribbons, squares, dots and stars
    const star = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.22 : 0.55, a = Math.PI / 2 + i * Math.PI / 5;
      i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const KINDS = [
      { geo: new THREE.PlaneGeometry(0.32, 1.5), n: 300, drag: 2.3 },   // curly ribbons
      { geo: new THREE.PlaneGeometry(0.7, 0.7), n: 260, drag: 1.7 },
      { geo: new THREE.CircleGeometry(0.36, 14), n: 160, drag: 1.7 },
      { geo: new THREE.ShapeGeometry(star), n: 120, drag: 1.5 }
    ];
    const confMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 1 });
    const pieces = [];
    KINDS.forEach((k) => {
      k.mesh = new THREE.InstancedMesh(k.geo, confMat, k.n);
      k.mesh.visible = false; k.mesh.frustumCulled = false; scene.add(k.mesh);
      for (let i = 0; i < k.n; i++) {
        const pal = CONFETTI[(Math.random() * CONFETTI.length) | 0];
        pieces.push({ k, i, base: new THREE.Color(pal.c), metal: pal.m, p: new THREE.Vector3(), v: new THREE.Vector3(),
          r: new THREE.Vector3(), w: new THREE.Vector3(), s: 0.7 + Math.random() * 0.8, delay: 0, phase: Math.random() * 6 });
        k.mesh.setColorAt(i, pal.c && new THREE.Color(pal.c));
      }
    });

    const MAX_SCALE = 1 + (TAPS_TO_OPEN - 1) * 0.1;
    let visW = 1, visH = 1;
    function resize() {
      const w = innerWidth, h = innerHeight, aspect = w / h;
      renderer.setSize(w, h, false);
      camera.aspect = aspect;
      const need = SIZE * 0.8 * MAX_SCALE / 0.72;
      visH = aspect >= 1 ? need : need / aspect; visW = visH * aspect;
      camera.position.set(0, 0, visH / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }
    addEventListener("resize", resize); resize();

    let taps = 0, scale = 1, scaleVel = 0, wobble = 0, wobbleVel = 0, lidHop = 0, lidHopVel = 0, exploded = false, tExplode = 0, twinkleClock = 0;

    $("present").addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (exploded) return;
      taps++;
      setProgress(taps / TAPS_TO_OPEN);
      if (taps >= TAPS_TO_OPEN) { explode(); return; }
      buzz(15 + taps * 3);
      scaleVel += 2.6;
      wobbleVel += (taps % 2 ? 1 : -1) * (70 + taps * 8);
      lidHopVel += 6 + taps * 1.2;
      for (let i = 0; i < 2 + (taps >> 1); i++) {
        const a = Math.random() * Math.PI * 2, r = 7 * scale + Math.random() * 3;
        spawnTwinkle(Math.cos(a) * r, Math.sin(a) * r * 0.8, 1, 1.4 + Math.random() * 1.6, 0.7 + Math.random() * 0.4);
      }
    });

    function explode() {
      exploded = true; tExplode = 0; buzz([30, 30, 80]);
      Music.start();                                     // song starts on the last tap (needs the tap gesture)
      $("instruction").classList.add("gone");
      KINDS.forEach((k) => (k.mesh.visible = true));
      const topY = 2.5 * scale, rnd = (a, b) => a + Math.random() * (b - a);
      pieces.forEach((c) => {
        const roll = Math.random();
        c.r.set(rnd(0, 6), rnd(0, 6), rnd(0, 6));
        c.w.set(rnd(-11, 11), rnd(-11, 11), rnd(-11, 11));
        if (roll < 0.45) {                                   // main burst out of the box
          const a = Math.PI * rnd(0.08, 0.92), sp = rnd(12, 28);
          c.p.set(rnd(-4, 4), topY + rnd(-1, 1), rnd(-1.5, 1.5));
          c.v.set(Math.cos(a) * sp, Math.sin(a) * sp, rnd(-6, 6)); c.delay = rnd(0, 0.08);
        } else if (roll < 0.75) {                            // two side cannons from the bottom corners
          const side = Math.random() < 0.5 ? -1 : 1, sp = rnd(22, 34), a = THREE.MathUtils.degToRad(rnd(58, 78));
          c.p.set(side * (visW / 2 + 1), -visH / 2 - 1, rnd(-2, 2));
          c.v.set(-side * Math.cos(a) * sp, Math.sin(a) * sp, rnd(-4, 4)); c.delay = rnd(0.3, 0.5);
        } else {                                             // soft rain from above
          c.p.set(rnd(-visW / 2, visW / 2), visH / 2 + rnd(1, 4), rnd(-3, 3));
          c.v.set(rnd(-1, 1), rnd(-3, -1), 0); c.delay = rnd(0.5, 2.2);
        }
      });
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2, sp = rnd(3, 12);
        setTimeout(() => spawnTwinkle(rnd(-3, 3), topY, 2, rnd(1.5, 3.5), rnd(0.8, 1.6), Math.cos(a) * sp, Math.abs(Math.sin(a)) * sp), rnd(0, 900));
      }
      setTimeout(() => {
        $("present").classList.add("out");
        Story.start();
      }, reduceMotion ? 1500 : 4400);
    }

    const clock = new THREE.Clock();
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), col = new THREE.Color(), eul = new THREE.Euler(), WHITE = new THREE.Color(0xffffff);
    let t = 0;
    function frame() {
      const dt = Math.min(clock.getDelta(), 1 / 30);
      t += dt;
      if (!exploded) {
        const target = 1 + taps * 0.1;
        scaleVel += ((target - scale) * 120 - scaleVel * 11) * dt; scale += scaleVel * dt;
        wobbleVel += (-wobble * 160 - wobbleVel * 9) * dt; wobble += wobbleVel * dt;
        lidHopVel += (-lidHop * 200 - lidHopVel * 14) * dt; lidHop += lidHopVel * dt;
        gift.scale.setScalar(scale);
        gift.position.y = reduceMotion ? 0 : Math.sin(t * 2.1) * 0.3;
        gift.rotation.z = THREE.MathUtils.degToRad(wobble);
        gift.rotation.y = reduceMotion ? 0 : Math.sin(t * 1.2) * 0.22;
        lidPivot.position.y = 2.6 + Math.max(0, lidHop) * 0.25;
        lidPivot.rotation.z = THREE.MathUtils.degToRad(-wobble * 0.4);
        const shake = taps >= 7 ? (taps - 6) * 0.06 : 0;
        gift.position.x = shake ? (Math.random() - 0.5) * shake : 0;
        const gs = 26 + taps * 3.5 + Math.sin(t * 3) * 1.2;
        glow.scale.set(gs, gs, 1);
        twinkleClock += dt;                                  // ambient sparkle around the box
        if (!reduceMotion && twinkleClock > 0.5) {
          twinkleClock = 0;
          const a = Math.random() * Math.PI * 2, r = 7.5 * scale + Math.random() * 2;
          spawnTwinkle(Math.cos(a) * r, Math.sin(a) * r * 0.8, 1, 1 + Math.random(), 1.2);
        }
      } else {
        tExplode += dt;
        const k = tExplode;
        lidPivot.position.y = 2.6 + 10 * (1 - Math.exp(-2.4 * k)) + 2 * k;
        lidPivot.rotation.z = -0.5 * (1 - Math.exp(-2 * k));
        lidMat.opacity = Math.max(0, 1 - k / 1.3);
        bodyMat.opacity = Math.max(0, 1 - k / 1.1);
        gift.scale.setScalar(scale * (1 + 0.12 * Math.min(1, k * 3)));
        glow.material.opacity = Math.max(0, 1 - k / 2);
        glow.scale.multiplyScalar(1 + dt * 0.9);
        const fk = Math.min(1, k / 0.6);                     // bright bloom at the moment it opens
        flash.material.opacity = (1 - fk) * 0.9;
        flash.scale.setScalar(8 + fk * 55);
        flash.position.y = 2.5 * scale;
        const fadeAll = Math.min(1, Math.max(0, (4.6 - k) / 0.8));
        pieces.forEach((c) => {
          const mesh = c.k.mesh;
          if (k < c.delay) { m4.makeScale(0, 0, 0); mesh.setMatrixAt(c.i, m4); return; }
          c.v.multiplyScalar(Math.exp(-c.k.drag * dt));
          c.v.y -= 7 * dt;
          c.p.addScaledVector(c.v, dt);
          c.p.x += Math.sin(t * 2.6 + c.phase) * 0.9 * dt;   // flutter
          c.r.addScaledVector(c.w, dt);
          q.setFromEuler(eul.set(c.r.x, c.r.y, c.r.z));
          m4.compose(c.p, q, sc.setScalar(c.s));
          mesh.setMatrixAt(c.i, m4);
          const face = Math.abs(Math.cos(c.r.x) * Math.cos(c.r.y));   // brighter when facing us
          col.copy(c.base).multiplyScalar(0.45 + 0.55 * face);
          if (c.metal && face > 0.85) col.lerp(WHITE, (face - 0.85) / 0.15 * 0.9);
          mesh.setColorAt(c.i, col);
        });
        KINDS.forEach((kd) => { kd.mesh.instanceMatrix.needsUpdate = true; kd.mesh.instanceColor.needsUpdate = true; });
        confMat.opacity = fadeAll;
      }
      twinkles.forEach((tw) => {
        if (!tw.on) return;
        tw.age += dt;
        if (tw.age >= tw.life) { tw.on = false; tw.sp.visible = false; return; }
        const f = Math.sin(Math.PI * tw.age / tw.life);
        tw.v.multiplyScalar(Math.exp(-2 * dt));
        tw.sp.position.addScaledVector(tw.v, dt);
        tw.sp.scale.setScalar(tw.size * f);
        tw.sp.material.opacity = f;
        tw.sp.material.rotation = tw.age * 1.5;
      });
      renderer.render(scene, camera);
      if (!exploded || tExplode < 6) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ================= Content (built from the content/ folder) ================= */
  const FALLBACK = { messages: ["สุขสันต์วันเกิดนะ"], bridge: "", ending: ["สุขสันต์วันเกิดนะ"], photos: [], song: null };
  let CONTENT = FALLBACK;
  const contentReady = fetch("content.json", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : FALLBACK))
    .catch(() => FALLBACK)
    .then((c) => {
      CONTENT = Object.assign({}, FALLBACK, c);
      Music.load(CONTENT.song);
      return CONTENT;
    });

  /* ================= Music (sound only) ================= */
  const Music = (() => {
    let ctx = null, el = null, gain = null, wired = false, playing = false, muted = false, level = 1;
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}  // play even with the silent switch on (iOS 17+)
    function load(url) {
      if (!url) return;
      el = new Audio(); el.src = url; el.loop = true; el.preload = "auto"; el.setAttribute("playsinline", "");
    }
    function unlock() {                                     // call from any tap so iPhone allows audio later
      try {
        if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ctx = new AC(); }
        if (ctx && ctx.state === "suspended") ctx.resume();
      } catch (e) {}
    }
    function wire() {
      if (wired || !ctx || !el) return;
      try { const src = ctx.createMediaElementSource(el); gain = ctx.createGain(); gain.gain.value = 0; src.connect(gain).connect(ctx.destination); wired = true; } catch (e) {}
    }
    function fadeTo(v, sec) {
      if (gain) {
        const t = ctx.currentTime; gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(v, t + sec);
      } else if (el) el.volume = v;
    }
    function start() {
      if (!el || playing) return;
      unlock(); wire();
      playing = true;
      const p = el.play(); if (p) p.catch(() => { playing = false; });
      fadeTo(muted ? 0 : level, 2);
      $("mute").hidden = false;
    }
    function setLevel(v, sec) { level = v; if (!muted) fadeTo(v, sec); }
    function toggleMute() {
      muted = !muted; fadeTo(muted ? 0 : level, 0.3);
      $("mute").classList.toggle("muted", muted);
      $("mute").setAttribute("aria-label", muted ? "เปิดเสียง" : "ปิดเสียง");
    }
    $("mute").addEventListener("click", toggleMute);
    return { load, unlock, start, setLevel, get ctx() { return ctx; }, get muted() { return muted; } };
  })();
  document.addEventListener("pointerdown", () => Music.unlock(), { capture: true });

  /* ================= Story: messages → bridge → photos → ending ================= */
  // Mitr draws ๆ (mai yamok) too high; wrap it so CSS can drop it to where Thai writing puts it
  const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const setThai = (el, text) => { el.innerHTML = "<span>" + esc(text).replace(/ๆ/g, '<span class="yamok">ๆ</span>') + "</span>";   // one inner span so flex parents (.msg) keep it as a single line of text };
  const swap = (fromId, toId, delay = 0) => {
    if (fromId) $(fromId).classList.add("out");
    setTimeout(() => toId && $(toId).classList.remove("out"), delay);
  };
  // faint twinkles behind the text screens
  document.querySelectorAll(".stars").forEach((box) => {
    for (let i = 0; i < 36; i++) {
      const s = document.createElement("i");
      s.style.left = Math.random() * 100 + "%"; s.style.top = Math.random() * 100 + "%";
      s.style.animationDelay = (Math.random() * 4).toFixed(2) + "s";
      s.style.animationDuration = (3 + Math.random() * 3).toFixed(2) + "s";
      if (Math.random() < 0.25) s.className = "big";
      box.appendChild(s);
    }
  });

  const photoImgs = [];
  const Story = {
    async start() {
      await contentReady;
      CONTENT.photos.forEach((p, i) => { const im = new Image(); im.decoding = "async"; im.src = p.src; photoImgs[i] = im; });
      msgIndex = 0;
      swap(null, "messages", 200);
      showMessage(0);
    }
  };

  let msgIndex = 0;
  function showMessage(i) {
    const t = $("msgText"), b = $("msgNext");
    t.classList.remove("in"); b.classList.remove("in"); b.disabled = true;
    setTimeout(() => {
      setThai(t, CONTENT.messages[i]);
      $("msgCount").textContent = (i + 1) + " / " + CONTENT.messages.length;
      t.classList.add("in");
      setTimeout(() => { b.classList.add("in"); b.disabled = false; }, 800);
    }, i === 0 ? 700 : 500);
  }
  $("msgNext").addEventListener("click", () => {
    if ($("msgNext").disabled) return;
    buzz(10);
    msgIndex++;
    if (msgIndex < CONTENT.messages.length) showMessage(msgIndex);
    else toBridge();
  });

  function toBridge() {
    $("msgNext").disabled = true;
    if (!CONTENT.bridge) { swap("messages", null); return setTimeout(startPhotos, 900); }
    setThai($("bridgeText"), CONTENT.bridge);
    swap("messages", "bridge", 900);
    setTimeout(() => swap("bridge", null), 900 + 3000);
    setTimeout(startPhotos, 900 + 3000 + 1400);           // a beat of black before the photos
  }

  const PHOTO_SEC = 5, FIRST_FADE = 1.2;                // first photo gets extra time to fade in
  function startPhotos() {
    const list = CONTENT.photos;
    if (!list.length) return toEnding();
    swap(null, "photos");
    let front = $("phA"), back = $("phB"), idx = -1, elapsed = -FIRST_FADE, paused = false, last = performance.now();
    front.classList.add("first"); back.classList.add("first");   // first photo fades in slowly
    const total = list.length * PHOTO_SEC, fill = $("photoFill");
    const onTap = () => { paused = !paused; $("pausedHint").classList.toggle("show", paused); };
    $("photos").addEventListener("click", onTap);
    function tick(now) {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (!paused) elapsed += dt;
      const i = Math.max(0, Math.min(list.length - 1, Math.floor(elapsed / PHOTO_SEC)));
      if (i === 1 && front.classList.contains("first")) { $("phA").classList.remove("first"); $("phB").classList.remove("first"); }
      if (i !== idx) {
        idx = i;
        back.src = list[i].src; back.style.transform = "scale(1)";
        back.style.opacity = 1; front.style.opacity = 0;
        [front, back] = [back, front];
      }
      const local = Math.max(0, Math.min(1, (elapsed - idx * PHOTO_SEC) / PHOTO_SEC));
      if (!reduceMotion) front.style.transform = "scale(" + (1 + 0.06 * local).toFixed(4) + ")";
      fill.style.transform = "scaleX(" + Math.max(0, Math.min(1, elapsed / total)).toFixed(4) + ")";
      if (elapsed >= total) {
        $("photos").removeEventListener("click", onTap);
        swap("photos", null); setTimeout(toEnding, 900);
        return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function toEnding() {
    const [title, ...rest] = CONTENT.ending.length ? CONTENT.ending : ["สุขสันต์วันเกิดนะ"];
    setThai($("endTitle"), title);
    $("endLines").innerHTML = "";
    rest.forEach((l) => { const p = document.createElement("p"); setThai(p, l); $("endLines").appendChild(p); });
    swap(null, "ending", 100);
  }

  /* ================= Video export (canvas + MediaRecorder, made on her device) ================= */
  const Video = (() => {
    const W = 1080, H = 1920, FPS = 30, FADE_OUT = 3;
    const svgImg = (svg) => { const im = new Image(); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); return im; };
    const giftBody = svgImg(BODY_SVG), giftLid = svgImg(LID_SVG);
    const stars = Array.from({ length: 140 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 0.8 + Math.random() * 2.2, ph: Math.random() * 6.28 }));
    let file = null, busy = false;

    function pickMime() {
      const opts = ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
      return opts.find((m) => { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } }) || "";
    }
    function words(text) {
      if (window.Intl && Intl.Segmenter) return [...new Intl.Segmenter("th", { granularity: "word" }).segment(text)].map((s) => s.segment);
      return [...text];
    }
    function wrap(ctx, text, maxW) {
      const lines = []; let line = "";
      for (const w of words(text)) {
        const test = line + w;
        if (line && ctx.measureText(test).width > maxW) { lines.push(line.trim()); line = w.trimStart(); } else line = test;
      }
      if (line.trim()) lines.push(line.trim());
      return lines;
    }
    function timeline() {
      const segs = [{ type: "title", dur: 3.2 }];
      CONTENT.messages.forEach((text) => segs.push({ type: "text", text, dur: 3.4 }));
      if (CONTENT.bridge) segs.push({ type: "text", text: CONTENT.bridge, dur: 2.8 });
      photoImgs.forEach((img) => segs.push({ type: "photo", img, dur: 4 }));
      segs.push({ type: "end", dur: 5 });
      let t = 0; segs.forEach((s) => { s.t0 = t; t += s.dur; });
      return { segs, total: t };
    }
    const ease = (u) => 1 - Math.pow(1 - u, 3);
    // fillText that lowers ๆ like the page does (Mitr draws it too high)
    function fillThai(ctx, text, x, y) {
      if (!text.includes("ๆ")) return ctx.fillText(text, x, y);
      const size = parseFloat(/(\d+)px/.exec(ctx.font)[1]), parts = text.split(/(ๆ)/);
      const total = ctx.measureText(text).width, align = ctx.textAlign;
      let cx = x - total / 2; ctx.textAlign = "left";
      parts.forEach((part) => { ctx.fillText(part, cx, part === "ๆ" ? y + size * 0.2 : y); cx += ctx.measureText(part).width; });
      ctx.textAlign = align;
    }

    function draw(ctx, segs, t, total) {
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
      stars.forEach((s) => {
        ctx.globalAlpha = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.6 + s.ph));
        ctx.fillStyle = "#cfc4ff"; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      });
      const seg = segs.find((s) => t >= s.t0 && t < s.t0 + s.dur) || segs[segs.length - 1];
      const lt = t - seg.t0, u = Math.min(1, lt / seg.dur);
      const a = Math.min(1, lt / 0.5, (seg.dur - lt) / 0.5);
      ctx.globalAlpha = Math.max(0, a);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const rise = 24 * (1 - ease(Math.min(1, lt / 0.9)));
      if (seg.type === "title") {
        const sz = 640, bob = Math.sin(t * 2) * 10;
        ctx.drawImage(giftBody, (W - sz) / 2, H * 0.42 - sz / 2 + bob, sz, sz);
        ctx.drawImage(giftLid, (W - sz) / 2, H * 0.42 - sz / 2 + bob - 10 * Math.abs(Math.sin(t * 3)), sz, sz);
        ctx.fillStyle = "#f4f2ff"; ctx.font = "500 92px Mitr, sans-serif";
        fillThai(ctx, CONTENT.ending[0] || "สุขสันต์วันเกิด", W / 2, H * 0.68 + rise);
      } else if (seg.type === "text" || seg.type === "end") {
        const lines = seg.type === "end" ? CONTENT.ending : null;
        ctx.fillStyle = "#f4f2ff";
        if (lines) {
          ctx.font = "500 96px Mitr, sans-serif"; fillThai(ctx, lines[0] || "", W / 2, H * 0.44 + rise);
          ctx.font = "300 52px Mitr, sans-serif"; ctx.fillStyle = "#b9b3d8";
          lines.slice(1).forEach((l, i) => fillThai(ctx, l, W / 2, H * 0.44 + 140 + i * 76 + rise));
        } else {
          ctx.font = "400 68px Mitr, sans-serif";
          const ls = wrap(ctx, seg.text, W - 200), lh = 112, y0 = H / 2 - ((ls.length - 1) * lh) / 2;
          ls.forEach((l, i) => fillThai(ctx, l, W / 2, y0 + i * lh + rise));
        }
      } else if (seg.type === "photo" && seg.img.complete && seg.img.naturalWidth) {
        const boxW = W - 120, boxH = H - 420, im = seg.img;
        const k = Math.min(boxW / im.naturalWidth, boxH / im.naturalHeight) * (1 + 0.06 * u);
        const w = im.naturalWidth * k, h = im.naturalHeight * k;
        ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
      }
      ctx.globalAlpha = 1;
      const fadeOut = (t - (total - FADE_OUT)) / FADE_OUT;  // picture fades to black with the song
      if (fadeOut > 0) { ctx.fillStyle = "rgba(0,0,0," + Math.min(1, fadeOut).toFixed(3) + ")"; ctx.fillRect(0, 0, W, H); }
    }

    function make() {
      if (busy) return;
      const status = $("dlStatus");
      if (typeof MediaRecorder === "undefined" || !HTMLCanvasElement.prototype.captureStream) {
        status.textContent = "อุปกรณ์นี้สร้างวิดีโอไม่ได้ ลองเปิดด้วย Safari หรือ Chrome รุ่นใหม่นะ"; return;
      }
      busy = true; file = null;
      const canvas = $("vidCanvas"); canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d");
      const { segs, total } = timeline();

      // song for the video: its own player routed only into the recording
      let recAudio = null, recGain = null, audioTrack = null;
      const actx = Music.ctx;
      if (CONTENT.song && actx) {
        try {
          if (actx.state === "suspended") actx.resume();
          recAudio = new Audio(CONTENT.song); recAudio.loop = true; recAudio.setAttribute("playsinline", "");
          const src = actx.createMediaElementSource(recAudio);
          const dest = actx.createMediaStreamDestination();
          recGain = actx.createGain(); recGain.gain.value = 0;
          src.connect(recGain).connect(dest);
          audioTrack = dest.stream.getAudioTracks()[0];
          const now = actx.currentTime;
          recGain.gain.linearRampToValueAtTime(1, now + 1);                      // gentle fade in
          recGain.gain.setValueAtTime(1, now + Math.max(1, total - FADE_OUT));
          recGain.gain.linearRampToValueAtTime(0, now + total);                  // fade out at the end
          recAudio.play().catch(() => {});                 // must start inside the tap
        } catch (e) { recAudio = null; audioTrack = null; }
      }

      const stream = canvas.captureStream(FPS);
      if (audioTrack) stream.addTrack(audioTrack);
      const mime = pickMime();
      let rec;
      try { rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 6000000 } : undefined); }
      catch (e) { busy = false; status.textContent = "สร้างวิดีโอไม่สำเร็จ ลองใหม่อีกครั้งนะ"; return; }
      const chunks = [];
      rec.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
      let lock = null;
      try { navigator.wakeLock && navigator.wakeLock.request("screen").then((l) => (lock = l)).catch(() => {}); } catch (e) {}

      $("exporting").hidden = false; $("expSave").hidden = true; $("expClose").hidden = true;
      $("expLabel").textContent = "กำลังสร้างวีดีโอ… 0%"; $("expFill").style.transform = "scaleX(0)";
      $("expSub").textContent = "เปิดหน้าจอค้างไว้จนกว่าจะเสร็จน้าา";

      rec.onstop = () => {
        if (recAudio) recAudio.pause();
        try { lock && lock.release(); } catch (e) {}
        const type = (rec.mimeType || mime || "video/webm").split(";")[0];
        const ext = type.includes("mp4") ? "mp4" : "webm";
        file = new File([new Blob(chunks, { type })], "gift-for-aom." + ext, { type });
        $("expLabel").textContent = "วีดีโอพร้อมแระ";
        $("expSub").textContent = "";
        $("expSave").hidden = false; $("expClose").hidden = false;
        busy = false;
      };

      draw(ctx, segs, 0, total);
      rec.start(1000);
      const t0 = performance.now();
      (function loop() {
        const t = (performance.now() - t0) / 1000;
        draw(ctx, segs, Math.min(t, total - 0.001), total);
        const f = Math.min(1, t / total);
        $("expFill").style.transform = "scaleX(" + f.toFixed(3) + ")";
        $("expLabel").textContent = "กำลังสร้างวีดีโอ… " + Math.round(f * 100) + "%";
        if (t < total) requestAnimationFrame(loop); else rec.stop();
      })();
    }

    function save() {
      if (!file) return;
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: "ของขวัญวันเกิด" }).catch(() => {});
          return;
        }
      } catch (e) {}
      const a = document.createElement("a");
      a.href = URL.createObjectURL(file); a.download = file.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    }
    $("dlBtn").addEventListener("click", make);
    $("expSave").addEventListener("click", save);
    $("expClose").addEventListener("click", () => { $("exporting").hidden = true; });
    return { make };
  })();
})();
