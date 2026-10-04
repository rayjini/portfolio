const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Particle network background ---------- */
(() => {
  const canvas = document.getElementById("bg");
  const ctx = canvas.getContext("2d");
  const mouse = { x: -9999, y: -9999 };
  let w, h, dpr, particles = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(110, Math.floor((w * h) / 14000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.4 + 0.6,
    }));
  }

  function step() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      // Gently push particles away from the cursor
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 140 && dist > 0) {
        p.x += (dx / dist) * 1.2;
        p.y += (dy / dist) * 1.2;
      }
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(94, 234, 212, 0.55)";
      ctx.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 120) {
          ctx.strokeStyle = `rgba(129, 140, 248, ${0.18 * (1 - d / 120)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      // Link nearby particles to the cursor
      const a = particles[i];
      const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (md < 180) {
        ctx.strokeStyle = `rgba(94, 234, 212, ${0.35 * (1 - md / 180)})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }
    if (!reduceMotion) requestAnimationFrame(step);
  }

  const glow = document.querySelector(".cursor-glow");
  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
  });
  window.addEventListener("mouseout", () => { mouse.x = mouse.y = -9999; });
  window.addEventListener("resize", () => { resize(); if (reduceMotion) step(); });
  resize();
  step();
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
`<span class="t-acc">insulin-pump-sim/</span>    C++ · Qt — real-time insulin pump simulator      ${link("https://github.com/rayjini/Insulin-Pump-Solution", "repo")}
<span class="t-acc">worldcup-stats/</span>      Python · SQLite — World Cup winners & scorers     ${link("https://github.com/rayjini/FIFA-World-Cup-Winners-Scorers", "repo")}
<span class="t-acc">auto-applier/</span>        Node · Playwright — application automation       ${link("https://github.com/rayjini/tesla-auto-applier", "repo")}
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
    print(`<span class="prompt">guest@rayan:~$</span>${esc(raw)}`, "t-cmd");
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

  print(
`<span class="t-acc">Welcome to rayan-portfolio v1.0</span>
<span class="t-dim">Type</span> <span class="t-acc">help</span> <span class="t-dim">to get started, or click a command below.</span>
`);
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
