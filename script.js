const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Blue smoke background (WebGL shader) ---------- */
(() => {
  const canvas = document.getElementById("bg");
  const glow = document.querySelector(".cursor-glow");
  window.addEventListener("mousemove", (e) => {
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
  });

  const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
  if (!gl) { canvas.classList.add("no-gl"); return; }

  const vert = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;
  const frag = `
    precision highp float;
    uniform vec2 r;
    uniform float t;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
      for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
      return v;
    }
    void main() {
      vec2 uv = gl_FragCoord.xy / r.y;
      vec2 p = uv * 1.5;
      float T = t * 0.045;
      // Domain warping: noise fed into noise gives flowing, silky smoke
      vec2 q = vec2(fbm(p + T), fbm(p + vec2(5.2, 1.3) - T));
      vec2 s = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + T * 1.4),
                    fbm(p + 3.0 * q + vec2(8.3, 2.8) - T * 0.8));
      float f = fbm(p + 3.0 * s);

      vec3 col = mix(vec3(0.0), vec3(0.0, 0.05, 0.22), smoothstep(0.25, 0.95, f));
      col += vec3(0.08, 0.35, 0.95) * pow(smoothstep(0.5, 1.05, f * (0.6 + length(s))), 2.2);
      col += vec3(0.3, 0.78, 1.0) * pow(smoothstep(0.82, 1.15, f * (0.6 + length(s))), 3.0) * 0.5;

      vec2 c = gl_FragCoord.xy / r - 0.5;
      col *= 1.0 - dot(c, c) * 1.8;   // vignette
      col *= 0.8;                      // keep it dark so text stays readable
      gl_FragColor = vec4(col, 1.0);
    }`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.classList.add("no-gl"); return; }
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, "r");
  const uTime = gl.getUniformLocation(prog, "t");

  const SCALE = 0.5; // render at half resolution — smoke is soft, saves GPU
  function resize() {
    canvas.width = Math.ceil(window.innerWidth * SCALE);
    canvas.height = Math.ceil(window.innerHeight * SCALE);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }

  const start = performance.now();
  let last = 0;
  function draw(now) {
    if (now - last > 33) { // ~30fps is plenty for slow smoke
      last = now;
      gl.uniform1f(uTime, 20 + (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  window.addEventListener("resize", () => { resize(); if (reduceMotion) draw(1e9); });
  resize();
  requestAnimationFrame(draw);
})();

/* ---------- Typing effect ---------- */
(() => {
  const el = document.getElementById("typed");
  const phrases = [
    "Software Developer",
    "DevOps & Infrastructure Automation",
    "Computer Science Student",
    "Kubernetes · Docker · Ansible",
  ];
  if (reduceMotion) { el.textContent = phrases[0]; return; }
  let i = 0, j = 0, deleting = false;
  function tick() {
    const word = phrases[i];
    el.textContent = word.slice(0, j);
    if (!deleting && j === word.length) { deleting = true; return setTimeout(tick, 1600); }
    if (deleting && j === 0) { deleting = false; i = (i + 1) % phrases.length; }
    j += deleting ? -1 : 1;
    setTimeout(tick, deleting ? 35 : 70);
  }
  tick();
})();

/* ---------- Scroll reveal + count-up stats ---------- */
(() => {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
    }
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  const nums = document.querySelectorAll(".num[data-count]");
  const countIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target, target = +el.dataset.count;
      countIO.unobserve(el);
      if (reduceMotion) { el.textContent = target; continue; }
      const start = performance.now(), dur = 1400;
      (function frame(now) {
        const t = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(frame);
      })(start);
    }
  });
  nums.forEach((n) => countIO.observe(n));
})();

/* ---------- Card tilt + spotlight ---------- */
document.querySelectorAll(".tilt").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    card.style.setProperty("--mx", x + "px");
    card.style.setProperty("--my", y + "px");
    if (reduceMotion) return;
    const rx = ((y / r.height) - 0.5) * -8;
    const ry = ((x / r.width) - 0.5) * 8;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
  });
  card.addEventListener("mouseleave", () => { card.style.transform = ""; });
});

/* ---------- Skills ---------- */
const SKILLS = [
  ["Java", "lang"], ["C", "lang"], ["C++", "lang"], ["Python", "lang"], ["JavaScript", "lang"],
  ["TypeScript", "lang"], ["SQL", "lang"], ["HTML / CSS", "lang"],
  ["Docker", "infra"], ["Kubernetes", "infra"], ["Ansible", "infra"], ["Traefik", "infra"],
  ["VMware vSphere", "infra"], ["GitLab CI/CD", "infra"], ["AWS", "infra"], ["Nlyte DCIM", "infra"],
  ["Git", "infra"], ["Linux (Ubuntu, Kali)", "infra"],
  ["Wireshark", "sec"], ["Risk Management (CS RMP)", "sec"], ["Security Assessment", "sec"],
  ["SANS SEC566", "sec"], ["Network Forensics", "sec"], ["Cryptography", "sec"],
  ["React.js", "web"], ["Angular", "web"], ["Node.js", "web"], ["Qt", "web"],
  ["PostgreSQL", "data"], ["MySQL", "data"], ["SQLite", "data"], ["scikit-learn", "data"],
  ["Claude Code", "data"], ["Cursor", "data"],
];
(() => {
  const grid = document.getElementById("skill-grid");
  grid.innerHTML = SKILLS.map(([name, cat]) => `<div class="skill" data-cat="${cat}">${name}</div>`).join("");
  const buttons = document.querySelectorAll("#skill-filters button");
  buttons.forEach((btn) => btn.addEventListener("click", () => {
    buttons.forEach((b) => b.classList.toggle("active", b === btn));
    const f = btn.dataset.filter;
    grid.querySelectorAll(".skill").forEach((s) => s.classList.toggle("dim", f !== "all" && s.dataset.cat !== f));
  }));
})();

/* ---------- Terminal ---------- */
(() => {
  const out = document.getElementById("term-out");
  const form = document.getElementById("term-form");
  const input = document.getElementById("term-in");
  const body = document.getElementById("term-body");
  const history = [];
  let hIndex = 0;

  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const print = (html, cls = "") => {
    const div = document.createElement("div");
    if (cls) div.className = cls;
    div.innerHTML = html;
    out.appendChild(div);
    body.scrollTop = body.scrollHeight;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const link = (url, text) => `<a class="t-acc" href="${url}" target="_blank" rel="noopener"><u>${text}</u></a>`;

  const COMMANDS = {
    help: {
      desc: "list available commands",
      run: () => {
        const rows = Object.entries(COMMANDS)
          .filter(([, c]) => !c.hidden)
          .map(([name, c]) => `  <span class="t-acc">${name.padEnd(12)}</span><span class="t-dim">${c.desc}</span>`);
        print(rows.join("\n") + `\n\n<span class="t-dim">tip: use ↑/↓ for history and Tab to autocomplete</span>`);
      },
    },
    whoami: {
      desc: "who is Rayan?",
      run: () => print(
`<span class="t-acc">Rayan Ourdjini</span>
CS (Cybersecurity) student at Carleton University, graduating Dec 2027.
Software dev intern at Shared Services Canada — Kubernetes, Ansible, Docker, CI/CD.
Previously cybersecurity at National Defence and networking at the CRA.
Likes: automating boring things, breaking (then fixing) systems, CTFs.`),
    },
    "ls": {
      desc: "list directories",
      run: (args) => {
        if (args[0] === "projects") return COMMANDS.projects.run();
        print(`<span class="t-pur">experience/</span>  <span class="t-pur">projects/</span>  <span class="t-pur">skills/</span>  resume.txt  secrets.txt`);
      },
    },
    projects: {
      desc: "show my projects",
      run: () => print(
`<span class="t-acc">gta6-wiki/</span>           Astro — unofficial GTA VI fan wiki               ${link("https://gta-6wiki.com", "site")}
<span class="t-acc">detection-lab/</span>       Sigma · Sysmon — detection-as-code + ATT&amp;CK    ${link("https://github.com/rayjini/detection-engineering-lab", "repo")}
<span class="t-acc">insulin-pump-sim/</span>    C++ · Qt — real-time insulin pump simulator      ${link("https://github.com/rayjini/Insulin-Pump-Solution", "repo")}
<span class="t-acc">worldcup-stats/</span>      Python · SQLite — World Cup winners & scorers     ${link("https://github.com/rayjini/FIFA-World-Cup-Winners-Scorers", "repo")}
<span class="t-acc">curling-game/</span>        JS · Canvas — two-player curling + live chat${link("https://github.com/rayjini/Curling-Game", "repo")}
<span class="t-acc">itunes-search/</span>       Express — iTunes API song search                 ${link("https://github.com/rayjini/ITunes-API-App", "repo")}
<span class="t-acc">image-encoder/</span>       C — bit packing & run-length encoding            ${link("https://github.com/rayjini/Ghost-Hunting-Game", "repo")}
<span class="t-acc">portfolio/</span>           you're looking at it                             ${link("https://github.com/rayjini/portfolio", "repo")}`),
    },
    experience: {
      desc: "work history",
      run: () => print(
`<span class="t-yel">2026</span>  Software Developer Intern      <span class="t-dim">Shared Services Canada</span>
      ↳ provisioning 2–4h → &lt;15min, release cycles −70%, 99%+ uptime
<span class="t-yel">2024</span>  Cybersecurity Specialist Intern <span class="t-dim">National Defence</span>
      ↳ 20+ critical gaps found, ~40% risk reduction
<span class="t-yel">2024</span>  Software Developer Intern      <span class="t-dim">Canada Revenue Agency</span>
      ↳ 6+ rogue routers found via DHCP monitoring`),
    },
    skills: {
      desc: "tech I work with",
      run: () => {
        const bar = (n) => `<span class="t-acc">${"█".repeat(n)}</span><span class="t-dim">${"░".repeat(10 - n)}</span>`;
        print(
`languages   ${bar(8)}  Java, C, C++, Python, JS/TS, SQL
devops      ${bar(9)}  Docker, Kubernetes, Ansible, Traefik, GitLab CI
security    ${bar(8)}  risk mgmt, assessments, Wireshark, CTFs
web         ${bar(6)}  React, Angular, Node.js
data        ${bar(6)}  PostgreSQL, MySQL, SQLite, scikit-learn`);
      },
    },
    contact: {
      desc: "get in touch",
      run: () => print(
`email     ${link("mailto:rayandz25@gmail.com", "rayandz25@gmail.com")}
linkedin  ${link("https://www.linkedin.com/in/rayan-ourdjini", "linkedin.com/in/rayan-ourdjini")}
github    ${link("https://github.com/rayjini", "github.com/rayjini")}
twitter   ${link("https://x.com/RayanJini", "@RayanJini")}`),
    },
    cat: {
      desc: "read a file",
      run: (args) => {
        const f = args[0];
        if (!f) return print("usage: cat &lt;file&gt;", "t-err");
        if (f === "resume.txt") return COMMANDS.experience.run();
        if (f === "secrets.txt") return print("cat: secrets.txt: Permission denied. Nice try though 😉", "t-err");
        print(`cat: ${esc(f)}: No such file or directory`, "t-err");
      },
    },
    neofetch: {
      desc: "system info",
      run: () => print(
`<span class="t-acc">    ____  </span>   <span class="t-acc">guest</span>@<span class="t-acc">rayan-portfolio</span>
<span class="t-acc">   / __ \\ </span>   ---------------------
<span class="t-acc">  / /_/ / </span>   <span class="t-acc">OS</span>:      Carleton CS / Cybersecurity
<span class="t-acc"> / _, _/  </span>   <span class="t-acc">Host</span>:    Ottawa, ON
<span class="t-acc">/_/ |_|   </span>   <span class="t-acc">Uptime</span>:  5 internships
             <span class="t-acc">Shell</span>:   bash, PowerShell
             <span class="t-acc">Stack</span>:   K8s · Docker · Ansible · Python · C++
             <span class="t-acc">Editor</span>:  VS Code + Claude Code
             <span class="t-acc">Status</span>:  <span class="t-ok">looking for Winter & Summer 2027 roles</span>`),
    },
    hack: {
      desc: "totally real hacking",
      run: async () => {
        const steps = [
          ["[*] scanning target 10.0.0.42 ...", "t-dim"],
          ["[+] port 22/tcp open  ssh", "t-ok"],
          ["[+] port 443/tcp open https", "t-ok"],
          ["[*] bypassing firewall ████████████ 100%", "t-yel"],
          ["[*] decrypting mainframe ...", "t-dim"],
          ["[!] ACCESS GRANTED", "t-ok"],
          ["\njk — I only hack things I'm authorized to. Ethical hacking only. 🛡️", "t-acc"],
        ];
        for (const [line, cls] of steps) { print(line, cls); await sleep(380); }
      },
    },
    sudo: {
      desc: "",
      hidden: true,
      run: (args) => {
        if (args.join(" ") === "rm -rf /") return print("Nice try. This portfolio is immutable. 🔒", "t-err");
        print(`guest is not in the sudoers file. This incident will be reported. 🚨`, "t-err");
      },
    },
    rm: { desc: "", hidden: true, run: () => print("rm: permission denied — please don't delete my portfolio 🥲", "t-err") },
    party: {
      desc: "",
      hidden: true,
      run: () => { document.body.classList.toggle("party"); print("🎉 party mode toggled", "t-pur"); },
    },
    echo: { desc: "print text", run: (args) => print(esc(args.join(" "))) },
    date: { desc: "current date", run: () => print(new Date().toString()) },
    clear: { desc: "clear the screen", run: () => { out.innerHTML = ""; } },
    exit: { desc: "", hidden: true, run: () => print("There's no escape. Try <span class='t-acc'>contact</span> instead 😄") },
  };

  async function exec(raw) {
    const line = raw.trim();
    print(`<span class="prompt">guest@rayans-mbp ~ %</span>${esc(raw)}`, "t-cmd");
    if (!line) return;
    history.push(line);
    hIndex = history.length;
    const [cmd, ...args] = line.split(/\s+/);
    const c = COMMANDS[cmd.toLowerCase()];
    if (c) await c.run(args);
    else print(`command not found: ${esc(cmd)} — type <span class="t-acc">help</span>`, "t-err");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = input.value;
    input.value = "";
    input.disabled = true;
    await exec(v);
    input.disabled = false;
    input.focus({ preventScroll: true });
    body.scrollTop = body.scrollHeight;
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (hIndex > 0) input.value = history[--hIndex];
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      hIndex = Math.min(hIndex + 1, history.length);
      input.value = history[hIndex] || "";
    } else if (e.key === "Tab") {
      e.preventDefault();
      const v = input.value.toLowerCase();
      const matches = Object.keys(COMMANDS).filter((k) => !COMMANDS[k].hidden && k.startsWith(v));
      if (matches.length === 1) input.value = matches[0] + " ";
      else if (matches.length > 1) print(matches.join("  "), "t-dim");
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      out.innerHTML = "";
    }
  });

  body.addEventListener("click", () => {
    if (!window.getSelection().toString()) input.focus({ preventScroll: true });
  });

  document.querySelectorAll("#quick-cmds button").forEach((b) =>
    b.addEventListener("click", async () => {
      input.focus({ preventScroll: true });
      await exec(b.dataset.cmd);
    })
  );

  const last = new Date(Date.now() - 1000 * 60 * 47);
  const fmt = last.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).replace(/,/g, "");
  print(
`<span class="t-dim">Last login: ${fmt} on ttys001</span>
<span class="t-acc">Welcome to rayan-portfolio v1.0</span>
<span class="t-dim">Type</span> <span class="t-acc">help</span> <span class="t-dim">to get started, or click a command below.</span>
`);

  /* macOS window controls + dock */
  const mac = document.getElementById("mac");
  const win = document.getElementById("term");
  const show = () => {
    win.classList.remove("closed", "minimized");
    mac.classList.remove("term-hidden");
    setTimeout(() => input.focus({ preventScroll: true }), 300);
  };
  const hide = (cls) => {
    win.classList.add(cls);
    mac.classList.add("term-hidden");
  };
  document.querySelectorAll(".tdot[data-win]").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      const a = b.dataset.win;
      if (a === "close") { hide("closed"); out.innerHTML = ""; history.length = 0; hIndex = 0; }
      else if (a === "min") hide("minimized");
      else win.classList.toggle("zoomed");
    })
  );
  document.getElementById("dock-term").addEventListener("click", () => {
    if (win.classList.contains("closed")) print(`<span class="t-dim">Last login: ${new Date().toString().slice(0, 24)} on ttys002</span>`);
    show();
  });
  document.getElementById("term-reopen").addEventListener("click", () => document.getElementById("dock-term").click());
  document.querySelector(".term-bar").addEventListener("dblclick", (e) => {
    if (!e.target.closest(".lights")) win.classList.toggle("zoomed");
  });

  /* menu bar clock */
  const clock = document.getElementById("mac-clock");
  const tick = () => {
    clock.textContent = new Date().toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).replace(/,/g, "");
  };
  tick();
  setInterval(tick, 15000);
})();

/* ---------- Konami code ---------- */
(() => {
  const code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let pos = 0;
  window.addEventListener("keydown", (e) => {
    if (e.target.id === "term-in") return;
    pos = e.key === code[pos] ? pos + 1 : e.key === code[0] ? 1 : 0;
    if (pos === code.length) {
      pos = 0;
      document.body.classList.toggle("party");
    }
  });
})();
