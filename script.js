const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Static background + cursor glow ---------- */
(() => {
  const glow = document.querySelector(".cursor-glow");
  window.addEventListener("mousemove", (e) => {
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
  });
})();

/* ---------- Broadcast scoreboard ---------- */
(() => {
  const bug = document.getElementById("scorebug");
  if (!bug) return;
  const home = document.getElementById("sb-home"), away = document.getElementById("sb-away");
  const clock = document.getElementById("sb-clock");
  const MATCH = 180; // real seconds for a full 90 minutes
  let start = performance.now(), goals = 0, conceded = 0, lastMin = -1;
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () => {
    const secs = ((performance.now() - start) / 1000) * (5400 / MATCH);
    if (secs >= 5400) { // full time: show FT, then kick off again
      clock.textContent = "FT";
      if (secs >= 5400 + 4 * (5400 / MATCH)) { start = performance.now(); goals = conceded = 0; home.textContent = away.textContent = "0"; }
    } else {
      const m = Math.floor(secs / 60);
      clock.textContent = `${pad(m)}:${pad(Math.floor(secs % 60))}`;
      // the bugs sneak one in now and then
      if (m !== lastMin) { lastMin = m; if (m > 0 && Math.random() < 0.012) away.textContent = ++conceded; }
    }
  };
  if (reduceMotion) { clock.textContent = "KO"; return; }
  setInterval(tick, 250);
  window.addEventListener("pitch:goal", () => {
    if (clock.textContent === "FT") return;
    home.textContent = ++goals;
    bug.classList.remove("goal"); void bug.offsetWidth; bug.classList.add("goal");
    clearTimeout(bug._t); bug._t = setTimeout(() => bug.classList.remove("goal"), 2200);
  });
})();

/* ---------- Menu tabs: LB/RB bumpers, Q/E keys, active tab ---------- */
(() => {
  const nav = document.getElementById("tabs");
  if (!nav) return;
  const tabs = [...nav.querySelectorAll("a[href^='#']")];
  const sections = tabs.map((a) => document.querySelector(a.getAttribute("href")));
  let current = -1;
  const setActive = (i) => { current = i; tabs.forEach((t, j) => t.classList.toggle("active", j === i)); };

  const spy = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) setActive(sections.indexOf(e.target));
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => s && spy.observe(s));
  window.addEventListener("scroll", () => { if (window.scrollY < 200) setActive(-1); }, { passive: true });

  const go = (i) => {
    if (i < 0) { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); setActive(-1); return; }
    const s = sections[i];
    s.classList.add("visible");
    s.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    setActive(i);
    if (!reduceMotion) { s.classList.remove("swipe"); void s.offsetWidth; s.classList.add("swipe"); }
  };
  const step = (dir) => go(Math.max(-1, Math.min(tabs.length - 1, current + dir)));

  nav.querySelectorAll(".bumper").forEach((b) => b.addEventListener("click", () => step(+b.dataset.dir)));
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest("input, textarea, [contenteditable]") || document.querySelector("dialog[open]")) return;
    const k = e.key.toLowerCase();
    const dir = k === "q" ? -1 : k === "e" ? 1 : 0;
    if (dir) {
      step(dir);
      const b = nav.querySelector(`.bumper[data-dir="${dir}"]`);
      b.classList.add("press"); setTimeout(() => b.classList.remove("press"), 150);
    } else if (e.key === "Escape") go(-1);
  });
})();

/* ---------- Typing effect ---------- */
(() => {
  const el = document.getElementById("typed");
  const phrases = [
    "Carleton University Student",
    "Software Developer",
    "DevOps & Infrastructure Automation",
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
// [name, category, rating out of 99]
const SKILLS = [
  ["Java", "lang", 85], ["C", "lang", 82], ["C++", "lang", 84], ["Python", "lang", 88], ["JavaScript", "lang", 84],
  ["TypeScript", "lang", 80], ["SQL", "lang", 83], ["HTML / CSS", "lang", 86],
  ["Docker", "infra", 90], ["Kubernetes", "infra", 88], ["Ansible", "infra", 87], ["Traefik", "infra", 80],
  ["VMware vSphere", "infra", 80], ["GitLab CI/CD", "infra", 88], ["AWS", "infra", 80], ["Nlyte DCIM", "infra", 79],
  ["Git", "infra", 90], ["Linux (Ubuntu, Kali)", "infra", 87],
  ["Wireshark", "sec", 85], ["Risk Management (CS RMP)", "sec", 80], ["Security Assessment", "sec", 84],
  ["SANS SEC566", "sec", 80], ["Network Forensics", "sec", 80], ["Cryptography", "sec", 80],
  ["React.js", "web", 80], ["Angular", "web", 79], ["Node.js", "web", 80], ["Qt", "web", 80],
  ["PostgreSQL", "data", 80], ["MySQL", "data", 80], ["SQLite", "data", 80], ["scikit-learn", "data", 79],
  ["Claude Code", "data", 92], ["Cursor", "data", 85],
];
(() => {
  const grid = document.getElementById("skill-grid");
  const tier = (r) => (r >= 85 ? "t1" : r >= 78 ? "t2" : r >= 70 ? "t3" : "t4");
  grid.innerHTML = SKILLS.map(([name, cat, r]) =>
    `<div class="skill ${tier(r)}" data-cat="${cat}" title="${name}: ${r}"><span class="rt">${r}</span><span class="nm">${name}</span><span class="bar"><i style="--v:${r}%"></i></span></div>`
  ).join("");
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
`<span class="t-yel">2027</span>  Software Developer Intern      <span class="t-dim">Kinaxis</span>
      ↳ starting Jan 2027 · DevOps: IaC, CI/CD, Terraform, GitOps, ArgoCD
<span class="t-yel">2026</span>  Software Developer Intern      <span class="t-dim">Shared Services Canada</span>
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
<span class="t-acc">/_/ |_|   </span>   <span class="t-acc">Uptime</span>:  5+ internships
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
    goal: {
      desc: "score one for the home side",
      run: async () => {
        const lines = [
          ["Ourdjini picks it up on the edge of the box...", "t-dim"],
          ["cuts inside... shoots...", "t-dim"],
          ["GOOOOOOAAAAAL! ⚽", "t-yel"],
        ];
        for (const [line, cls] of lines) { print(line, cls); await sleep(550); }
        window.dispatchEvent(new Event("pitch:goal"));
      },
    },
    formation: {
      desc: "my starting XI (4-3-3)",
      run: () => print(
`<span class="t-dim">            ─── RAYAN FC · 4-3-3 ───</span>

   <span class="t-yel">Kubernetes</span>        <span class="t-yel">Docker</span>         <span class="t-yel">Ansible</span>

        <span class="t-acc">Python</span>         <span class="t-acc">C++</span>          <span class="t-acc">Java</span>

  <span class="t-ok">Wireshark</span>     <span class="t-ok">Linux</span>       <span class="t-ok">Git</span>      <span class="t-ok">GitLab CI</span>

                    <span class="t-pur">Rayan</span> <span class="t-dim">(GK, C)</span>`),
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

/* ---------- News ticker: repeat items so the loop is seamless ---------- */
(() => {
  const run = document.querySelector(".ticker-run");
  if (run) run.innerHTML += run.innerHTML.replace(/<span>/g, "<span aria-hidden=\"true\">");
})();

/* ---------- Tactics board: top skills as a 4-3-3 ---------- */
(() => {
  const squad = document.getElementById("tb-squad");
  if (!squad) return;
  const rating = Object.fromEntries(SKILLS.map(([n, , r]) => [n, r]));
  // [skill, x %, y %] attacking left to right
  const XI = [
    ["Linux (Ubuntu, Kali)", 7, 50, "Linux", "gk"],
    ["Git", 24, 15], ["GitLab CI/CD", 21, 38], ["Ansible", 21, 62], ["Wireshark", 24, 85],
    ["Python", 46, 25], ["Docker", 42, 50], ["Java", 46, 75],
    ["Kubernetes", 72, 18], ["Claude Code", 82, 50], ["HTML / CSS", 72, 82],
  ];
  squad.innerHTML = XI.map(([skill, x, y, label, cls]) =>
    `<div class="mag ${cls || ""}" style="left:${x}%;top:${y}%" title="${skill}: ${rating[skill]}">` +
    `<b>${rating[skill]}</b><span>${label || skill}</span></div>`
  ).join("");
})();

/* ---------- Dressing room: hotspots open the matching section in a panel ---------- */
(() => {
  const scene = document.getElementById("scene");
  const panel = document.getElementById("panel");
  if (!scene || !panel) return;
  const body = document.getElementById("panel-body");
  const title = document.getElementById("panel-title");
  const kicker = document.getElementById("panel-kicker");
  const tip = document.getElementById("scene-tip");
  const svg = document.getElementById("scene-svg");

  const PANELS = {
    profile: { kicker: "My locker", title: "Player profile", nodes: ["#profile", "#experience"] },
    skills: { kicker: "Tactics board", title: "Skills", nodes: ["#skills"] },
    projects: { kicker: "Trophy cabinet", title: "Projects", nodes: ["#projects"] },
    terminal: { kicker: "Laptop", title: "Terminal", nodes: ["#terminal"] },
    education: { kicker: "Diploma", title: "Education", nodes: ["#education"] },
    contact: { kicker: "Club crest", title: "Contact", nodes: ["#contact"] },
  };
  const ORDER = Object.keys(PANELS);

  // sections are borrowed into the panel and put back where they were on close
  let borrowed = [];
  const putBack = () => {
    for (const [node, marker] of borrowed) { marker.replaceWith(node); }
    borrowed = [];
  };
  const open = (key) => {
    const cfg = PANELS[key];
    if (!cfg) return;
    putBack();
    kicker.textContent = cfg.kicker;
    title.textContent = cfg.title;
    for (const sel of cfg.nodes) {
      const node = document.querySelector(sel);
      if (!node) continue;
      const marker = document.createComment("panel:" + sel);
      node.replaceWith(marker);
      node.classList.add("visible");
      body.appendChild(node);
      borrowed.push([node, marker]);
    }
    panel.dataset.key = key;
    body.scrollTop = 0;
    if (!panel.open) panel.showModal();
    if (key === "terminal") setTimeout(() => document.getElementById("term-in")?.focus({ preventScroll: true }), 350);
  };
  panel.addEventListener("close", putBack);
  document.getElementById("panel-close").addEventListener("click", () => panel.close());
  panel.addEventListener("click", (e) => { if (e.target === panel) panel.close(); }); // click the backdrop
  // inside a panel, links to other sections switch panels instead of scrolling the page behind
  panel.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#']");
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    const key = ORDER.find((k) => PANELS[k].nodes.includes("#" + id));
    if (key && key !== panel.dataset.key) { e.preventDefault(); open(key); }
  });

  // hotspots + menu buttons
  scene.querySelectorAll("[data-open]").forEach((el) => {
    el.addEventListener("click", () => open(el.dataset.open));
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(el.dataset.open); } });
  });
  // number keys 1-6 open panels while the room is on screen
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest("input, textarea, [contenteditable]")) return;
    const i = "123456".indexOf(e.key);
    if (i >= 0 && scene.getBoundingClientRect().bottom > 0) open(ORDER[i]);
  });

  // floating label over the hovered hotspot
  const showTip = (el) => {
    const cfg = PANELS[el.dataset.open];
    const r = el.getBoundingClientRect(), s = scene.getBoundingClientRect();
    tip.innerHTML = `<b>${cfg.kicker}</b><span>${cfg.title}</span>`;
    tip.style.left = `${r.left - s.left + r.width / 2}px`;
    tip.style.top = `${Math.max(8, r.top - s.top - 10)}px`;
    tip.classList.add("on");
    scene.querySelectorAll(".scene-menu [data-open]").forEach((b) => b.classList.toggle("hl", b.dataset.open === el.dataset.open));
  };
  const hideTip = () => { tip.classList.remove("on"); scene.querySelectorAll(".scene-menu .hl").forEach((b) => b.classList.remove("hl")); };
  svg.querySelectorAll(".hot").forEach((el) => {
    el.addEventListener("mouseenter", () => showTip(el));
    el.addEventListener("focus", () => showTip(el));
    el.addEventListener("mouseleave", hideTip);
    el.addEventListener("blur", hideTip);
  });
  scene.querySelectorAll(".scene-menu [data-open]").forEach((b) => {
    const hot = svg.querySelector(`.hot[data-open="${b.dataset.open}"]`);
    b.addEventListener("mouseenter", () => hot.classList.add("lit"));
    b.addEventListener("mouseleave", () => hot.classList.remove("lit"));
  });

  // portrait screens: show the whole room instead of cropping the sides away
  const fit = () => svg.setAttribute("preserveAspectRatio", window.innerHeight > window.innerWidth ? "xMidYMid meet" : "xMidYMid slice");
  fit();
  window.addEventListener("resize", fit);

  // lights flicker on as the room appears
  if (!reduceMotion) scene.classList.add("lights-on");
})();

/* ---------- The scoreboard ticks over: Rayan FC nicks a goal every so often ---------- */
(() => {
  if (reduceMotion) return;
  const kick = () => setTimeout(() => { window.dispatchEvent(new Event("pitch:goal")); kick(); }, 30000 + Math.random() * 25000);
  kick();
})();
