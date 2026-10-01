/* ==========================================================
   Character Sheet Builder — behaviour
   - Text: every element with data-k is editable (contenteditable).
   - Images: every <figure class="slot" data-id="..."> can be deleted,
     replaced, re-fit, or filled by clicking "+" / dropping a file.
   - Autosaves to this browser; Save/Open project uses a .json file
     with the images embedded so it can be moved between computers.
   ========================================================== */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sheet = $("#sheet");
  const STORE_KEY = "charsheet:v1:" + location.pathname;
  const BLANK_SWATCH = "#cfd1cc"; // swatches still at this value are treated as "not set"
  const MAX_EDGE = 1600; // uploaded images are downscaled to this many px on the long edge

  const ICON = {
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>',
    swap:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>',
    fit:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
  };

  /* ---------------- helpers ---------------- */
  const textOf = (el) => el.innerText.replace(/ /g, " ").replace(/[ \t]+\n/g, "\n").trim();
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const setText = (el, t) => { el.innerHTML = esc(t).replace(/\n/g, "<br>"); };
  const oneLine = (s) => s.replace(/\s*\n\s*/g, " ").trim();
  const slug = (s) => oneLine(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "image";
  const projectName = () => $("#projectName").value.trim() || "character-sheet";
  const fileBase = () => slug(projectName());

  let toastTimer;
  function toast(msg, ms = 3200) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), ms);
  }

  function download(name, data, type = "application/octet-stream") {
    const blob = data instanceof Blob ? data : new Blob([data], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }

  /* ---------------- capture template defaults ---------------- */
  const textEls = $$("[data-k]", sheet);
  const slots = $$(".slot", sheet);
  const colorEls = $$("input[data-c]", sheet);
  const listEls = $$("dl[data-list]", sheet);
  const readList = (dl) => $$(":scope > div", dl).map((r) => ({ label: textOf($("dt", r)), value: textOf($("dd", r)) }));

  const defaults = {
    lists: Object.fromEntries(listEls.map((dl) => [dl.dataset.list, readList(dl)])),
    texts: Object.fromEntries(textEls.map((el) => [el.dataset.k, textOf(el)])),
    images: Object.fromEntries(slots.map((s) => [s.dataset.id, $("img", s).getAttribute("src") || ""])),
    colors: Object.fromEntries(colorEls.map((c) => [c.dataset.c, c.value])),
  };
  // If you edit index.html in VS Code, this changes and stale browser edits are ignored.
  const fingerprint = hash(JSON.stringify(defaults));

  // state.images[id]: undefined = template image, "" = removed, "data:..." = uploaded
  // state.lists[name]: undefined = template rows, otherwise [{label, value}]
  const fresh = (extra = {}) => ({ v: 1, fp: fingerprint, name: "character-sheet", texts: {}, images: {}, imageNames: {}, fits: {}, colors: {}, lists: {}, ...extra });
  let state = fresh({ name: projectName() });

  /* ---------------- text editing ---------------- */
  function makeEditable(el, onInput) {
    el.classList.add("ed");
    el.contentEditable = "true";
    el.spellcheck = false;
    el.addEventListener("input", () => { onInput(); save(); });
    el.addEventListener("paste", (e) => {
      e.preventDefault();
      const t = (e.clipboardData || window.clipboardData).getData("text/plain");
      document.execCommand("insertText", false, t);
    });
    // Enter = new line; Escape leaves the field
    el.addEventListener("keydown", (e) => { if (e.key === "Escape") el.blur(); });
  }
  textEls.forEach((el) => makeEditable(el, () => { state.texts[el.dataset.k] = textOf(el); }));

  /* ---------------- profile rows (add / remove) ---------------- */
  // Works for every <dl data-list="..."> on the sheet (core profile + extended profile).
  function renderLists() {
    listEls.forEach((dl) => {
      dl.innerHTML = "";
      (state.lists[dl.dataset.list] || defaults.lists[dl.dataset.list]).forEach((row) => addRow(dl, row));
    });
  }
  function addRow(dl, { label = "", value = "" } = {}, focus = false) {
    const div = document.createElement("div");
    div.innerHTML = '<dt data-ph="LABEL:"></dt><dd data-ph="Describe…"></dd><button type="button" class="row-del no-export" title="Remove this row">✕</button>';
    const [dt, dd] = [$("dt", div), $("dd", div)];
    setText(dt, label);
    setText(dd, value);
    const sync = () => { state.lists[dl.dataset.list] = readList(dl); };
    [dt, dd].forEach((el) => makeEditable(el, sync));
    $(".row-del", div).addEventListener("click", () => { div.remove(); sync(); save(); });
    dl.appendChild(div);
    if (focus) dt.focus();
  }
  listEls.forEach((dl) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "add-row no-export";
    btn.textContent = dl.dataset.add || "+ Add row";
    btn.addEventListener("click", () => { addRow(dl, {}, true); state.lists[dl.dataset.list] = readList(dl); save(); });
    dl.after(btn);
  });

  colorEls.forEach((c) => c.addEventListener("input", () => { state.colors[c.dataset.c] = c.value; save(); }));
  $("#projectName").addEventListener("input", () => { state.name = projectName(); save(); });

  /* ---------------- image slots ---------------- */
  const picker = $("#imageFile");
  let pickTarget = null;

  slots.forEach((slot) => {
    const frame = $(".frame", slot);

    const tools = document.createElement("div");
    tools.className = "slot-tools no-export";
    tools.innerHTML =
      `<button type="button" class="fitb" title="Toggle fill / fit">${ICON.fit}</button>` +
      `<button type="button" class="swap" title="Replace image">${ICON.swap}</button>` +
      `<button type="button" class="del" title="Delete image">${ICON.trash}</button>`;
    frame.appendChild(tools);

    const empty = document.createElement("div");
    empty.className = "empty no-export";
    empty.tabIndex = 0;
    empty.title = "Click to upload an image (or drop one here)";
    empty.innerHTML = '<span class="plus">+</span><span>Add image</span>';
    frame.appendChild(empty);

    const pick = () => { pickTarget = slot; picker.value = ""; picker.click(); };
    empty.addEventListener("click", pick);
    empty.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
    $(".swap", tools).addEventListener("click", pick);
    $(".del", tools).addEventListener("click", () => {
      state.images[slot.dataset.id] = "";
      delete state.imageNames[slot.dataset.id];
      applySlot(slot);
      save();
    });
    $(".fitb", tools).addEventListener("click", () => {
      const id = slot.dataset.id;
      state.fits[id] = state.fits[id] === "contain" ? "cover" : "contain";
      applySlot(slot);
      save();
    });

    // drag & drop
    frame.addEventListener("dragover", (e) => { e.preventDefault(); frame.classList.add("drag"); });
    frame.addEventListener("dragleave", () => frame.classList.remove("drag"));
    frame.addEventListener("drop", (e) => {
      e.preventDefault();
      frame.classList.remove("drag");
      const f = [...(e.dataTransfer?.files || [])].find((f) => f.type.startsWith("image/"));
      if (f) loadInto(slot, f);
    });
  });

  picker.addEventListener("change", () => {
    const f = picker.files[0];
    if (f && pickTarget) loadInto(pickTarget, f);
  });

  async function loadInto(slot, file) {
    try {
      const url = await shrink(file);
      state.images[slot.dataset.id] = url;
      state.imageNames[slot.dataset.id] = file.name;
      state.fits[slot.dataset.id] = state.fits[slot.dataset.id] || "cover";
      applySlot(slot);
      save();
      toast(`Added “${file.name}”`);
    } catch (err) {
      console.error(err);
      toast("Could not read that image.");
    }
  }

  // Reads a local file and downsizes very large photos so saving stays fast.
  function shrink(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = reject;
      r.onload = () => {
        const src = r.result;
        if (file.type === "image/svg+xml" || file.type === "image/gif") return resolve(src);
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
          if (scale === 1 && file.size < 1.5e6) return resolve(src);
          const c = document.createElement("canvas");
          c.width = Math.round(img.naturalWidth * scale);
          c.height = Math.round(img.naturalHeight * scale);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          resolve(file.type === "image/png" ? c.toDataURL("image/png") : c.toDataURL("image/jpeg", 0.9));
        };
        img.src = src;
      };
      r.readAsDataURL(file);
    });
  }

  function applySlot(slot) {
    const id = slot.dataset.id;
    const img = $("img", slot);
    const v = state.images[id];
    const src = v === undefined ? defaults.images[id] : v;
    if (src) img.src = src; else img.removeAttribute("src");
    slot.classList.toggle("is-empty", !src);
    slot.classList.toggle("fit-contain", state.fits[id] === "contain");
  }

  /* ---------------- apply / save / load state ---------------- */
  function applyState() {
    $("#projectName").value = state.name || "character-sheet";
    textEls.forEach((el) => {
      const k = el.dataset.k;
      setText(el, k in state.texts ? state.texts[k] : defaults.texts[k]);
    });
    colorEls.forEach((c) => { c.value = state.colors[c.dataset.c] || defaults.colors[c.dataset.c]; });
    renderLists();
    slots.forEach(applySlot);
  }

  let saveTimer;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
      catch (e) { toast("Browser storage is full — use File ▸ Save project (.json) to keep your work.", 6000); }
    }, 300);
  }

  function restore() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch (e) { /* ignore */ }
    if (!saved) return;
    if (saved.fp !== fingerprint) {
      try { localStorage.setItem(STORE_KEY + ":backup", JSON.stringify(saved)); } catch (e) { /* ignore */ }
      toast("index.html changed — loaded the template from the file (browser edits backed up).", 5000);
      return;
    }
    state = Object.assign(state, saved);
  }

  function snapshot() {
    return { ...state, fp: fingerprint, name: projectName(), savedAt: new Date().toISOString() };
  }

  $("#btnSave").addEventListener("click", () => {
    download(`${fileBase()}.project.json`, JSON.stringify(snapshot(), null, 2), "application/json");
    toast("Project saved (images included).");
  });
  $("#btnLoad").addEventListener("click", () => { $("#projectFile").value = ""; $("#projectFile").click(); });
  $("#projectFile").addEventListener("change", async () => {
    const f = $("#projectFile").files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      // only accept the fields we know about; texts are plain strings
      state = {
        v: 1, fp: fingerprint,
        name: String(data.name || "character-sheet"),
        texts: Object.fromEntries(Object.entries(data.texts || {}).filter(([k, v]) => typeof v === "string")),
        images: Object.fromEntries(Object.entries(data.images || {}).filter(([k, v]) => v === "" || (typeof v === "string" && v.startsWith("data:image/")))),
        imageNames: data.imageNames || {},
        fits: data.fits || {},
        colors: Object.fromEntries(Object.entries(data.colors || {}).filter(([k, v]) => /^#[0-9a-f]{6}$/i.test(v))),
        lists: Object.fromEntries(Object.entries(data.lists || (Array.isArray(data.profile) ? { core: data.profile } : {}))
          .filter(([k, v]) => Array.isArray(v))
          .map(([k, v]) => [k, v.map((r) => ({ label: String(r?.label ?? ""), value: String(r?.value ?? "") }))])),
      };
      applyState();
      save();
      toast(`Opened “${f.name}”`);
    } catch (e) {
      toast("That file isn't a valid project.");
    }
  });
  $("#btnReset").addEventListener("click", () => {
    if (!confirm("Reset every text and image back to the sample character? (Save a project file first if you want to keep this version.)")) return;
    state = fresh();
    applyState();
    save();
    toast("Reset to sample character.");
  });
  // Blank character: keeps the layout, section titles, captions and profile labels; clears everything else.
  $("#btnBlank").addEventListener("click", () => {
    if (!confirm("Start a new blank character? All images and descriptions will be cleared. (Save a project file first if you want to keep this one.)")) return;
    state = fresh({
      name: "new-character",
      // costume/material captions describe the sample outfit, so clear them (placeholders show instead)
      // the negative prompt is generic, so it is kept as a starting point
      texts: Object.fromEntries(["notes", "scene-prompt", ...textEls.map((el) => el.dataset.k).filter((k) => /^(cost|mat)-/.test(k))].map((k) => [k, ""])),
      lists: Object.fromEntries(Object.entries(defaults.lists).map(([k, rows]) => [k, rows.map((r) => ({ label: r.label, value: "" }))])),
      images: Object.fromEntries(slots.map((s) => [s.dataset.id, ""])),
      colors: Object.fromEntries(colorEls.map((c) => [c.dataset.c, BLANK_SWATCH])),
    });
    applyState();
    save();
    toast("Blank sheet ready. Click the + boxes to add images.");
  });

  /* ---------------- menu ---------------- */
  const menu = $(".menu");
  $(".menu-btn").addEventListener("click", (e) => { e.stopPropagation(); menu.classList.toggle("open"); });
  document.addEventListener("click", () => menu.classList.remove("open"));
  $(".menu-list").addEventListener("click", () => menu.classList.remove("open"));

  /* ---------------- fit sheet to small screens ---------------- */
  function fit() {
    const avail = document.documentElement.clientWidth - 32;
    sheet.style.zoom = Math.min(1, avail / sheet.offsetWidth).toFixed(3);
  }
  window.addEventListener("resize", fit);

  /* ---------------- structured data for AI tools ---------------- */
  function collect() {
    const ext = (src) => (src.startsWith("data:image/png") ? "png" : src.startsWith("data:image/webp") ? "webp" : src.startsWith("data:image/gif") ? "gif" : src.startsWith("data:image/svg") ? "svg" : src.startsWith("data:") ? "jpg" : (src.split(".").pop().split("?")[0] || "jpg"));
    const rows = (name) => {
      const dl = $(`dl[data-list="${name}"]`, sheet);
      return dl ? readList(dl).map((r) => ({ label: oneLine(r.label).replace(/:$/, ""), value: oneLine(r.value) })).filter((r) => r.value) : [];
    };
    const field = (k) => { const el = $(`[data-k="${k}"]`, sheet); return el ? textOf(el).trim() : ""; };
    let n = 0;
    const sections = $$("[data-section]", sheet).map((sec) => {
      const title = oneLine(textOf($("h2", sec)));
      const items = $$(".slot", sec).map((slot) => {
        const img = $("img", slot);
        const label = oneLine(textOf($("figcaption", slot)));
        if (slot.classList.contains("is-empty")) return { id: slot.dataset.id, label, file: null, src: null };
        n++;
        const src = img.getAttribute("src");
        return { id: slot.dataset.id, label, src, file: `images/${String(n).padStart(2, "0")}-${slot.dataset.id}-${slug(label)}.${ext(src)}` };
      });
      return { title, items };
    });
    const palette = colorEls.map((c) => c.value).filter((v) => v.toLowerCase() !== BLANK_SWATCH);
    return {
      name: projectName(), profile: rows("core"), details: rows("details"), palette, sections,
      notes: oneLine(field("notes")), scene: field("scene-prompt"), negative: oneLine(field("negative")),
    };
  }

  // Short details go into the video prompt; long ones (backstory etc.) stay in the profile sections.
  function characterParagraph(d) {
    const facts = [...d.profile, ...d.details.filter((r) => r.value.length <= 160)]
      .map((p) => `${p.label ? cap(p.label) + ": " : ""}${p.value}`).join(". ");
    const mats = (d.sections.find((s) => s.items.some((i) => i.id.startsWith("mat-")))?.items || [])
      .filter((i) => i.file && i.label).map((i) => i.label.toLowerCase()).join("; ");
    return "Consistent character across all shots." + (facts ? ` ${facts}.` : "") +
      (mats ? ` Colors and materials: ${mats}.` : "") +
      (d.palette.length ? ` Palette: ${d.palette.join(", ")}.` : "") +
      " Match the attached reference images exactly for face, hair, outfit, accessories, proportions and colors." +
      (d.notes ? ` ${d.notes}` : "");
  }
  // The text to paste into the video model's prompt field: the scene, then the character lock.
  const videoPrompt = (d = collect()) => [d.scene, characterParagraph(d)].filter(Boolean).join("\n\n");

  function buildPrompt(d = collect()) {
    const lines = [];
    lines.push(`# Character reference: ${d.name}`, "");
    lines.push("## Video prompt", "", videoPrompt(d), "");
    if (d.negative) lines.push("## Negative prompt", "", d.negative, "");
    lines.push("## Character profile", "");
    d.profile.forEach((p) => lines.push(`- **${cap(p.label)}:** ${p.value}`));
    lines.push("");
    if (d.details.length) {
      lines.push("## Extended profile", "");
      d.details.forEach((p) => lines.push(`- **${cap(p.label)}:** ${p.value}`));
      lines.push("");
    }
    if (d.palette.length) lines.push("## Color palette", "", d.palette.map((h) => `\`${h}\``).join(" "), "");
    lines.push("## Reference images", "");
    d.sections.forEach((s) => {
      const imgs = s.items.filter((i) => i.file);
      if (!imgs.length) return;
      lines.push(`### ${s.title}`);
      imgs.forEach((i) => lines.push(`- \`${i.file}\` — ${cap(i.label)}`));
      lines.push("");
    });
    if (d.notes) lines.push("## Consistency notes", "", d.notes, "");
    return lines.join("\n");
  }
  function cap(s) { s = s.toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); }

  function characterJson(prompt) {
    const d = collect();
    return JSON.stringify({
      name: d.name,
      generated: new Date().toISOString(),
      profile: d.profile,
      extended_profile: d.details,
      palette: d.palette,
      scene_prompt: d.scene,
      video_prompt: videoPrompt(d),
      negative_prompt: d.negative,
      consistency_notes: d.notes,
      reference_images: d.sections.map((s) => ({
        section: s.title,
        images: s.items.filter((i) => i.file).map((i) => ({ id: i.id, label: i.label, file: i.file })),
      })).filter((s) => s.images.length),
      sheet_image: "sheet.png",
      full_markdown: prompt || buildPrompt(d),
    }, null, 2);
  }

  /* ---------------- prompt dialog ---------------- */
  const dlg = $("#promptDialog");
  const promptBox = $("#promptText");
  $("#btnPrompt").addEventListener("click", () => { promptBox.value = buildPrompt(); dlg.showModal(); });
  async function copy(text, what) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const t = document.createElement("textarea");
      t.value = text; dlg.appendChild(t); t.select(); document.execCommand("copy"); t.remove();
    }
    toast(`${what} copied.`);
  }
  $("#dlgCopy").addEventListener("click", () => copy(promptBox.value, "Everything"));
  $("#dlgCopyPrompt").addEventListener("click", () => copy(videoPrompt(), "Video prompt"));
  $("#dlgCopyNeg").addEventListener("click", () => {
    const n = collect().negative;
    n ? copy(n, "Negative prompt") : toast("The negative prompt box is empty.");
  });
  $("#dlgMd").addEventListener("click", () => download("prompt.md", promptBox.value, "text/markdown"));
  $("#dlgJson").addEventListener("click", () => download(`${fileBase()}.character.json`, characterJson(promptBox.value), "application/json"));
  $("#dlgZip").addEventListener("click", () => exportZip(promptBox.value));

  /* ---------------- PDF (browser print → Save as PDF) ---------------- */
  $("#btnPdf").addEventListener("click", () => {
    const z = sheet.style.zoom;
    sheet.style.zoom = 1;
    const w = sheet.offsetWidth, h = sheet.offsetHeight;
    const st = document.createElement("style");
    st.id = "pageSize";
    st.textContent = `@page { size: ${w}px ${h + 2}px; margin: 0; }`;
    document.head.appendChild(st);
    toast('Choose "Save as PDF" as the printer. Turn on "Background graphics" if colors are missing.', 6000);
    setTimeout(() => {
      window.print();
      st.remove();
      sheet.style.zoom = z;
    }, 200);
  });

  /* ---------------- PNG + ZIP ---------------- */
  async function renderSheet() {
    if (!window.html2canvas) throw new Error("html2canvas not loaded (are you offline?)");
    document.body.classList.add("exporting");
    const z = sheet.style.zoom;
    sheet.style.zoom = 1;
    document.activeElement?.blur?.();
    try {
      const canvas = await html2canvas(sheet, { scale: 2, backgroundColor: getComputedStyle(sheet).backgroundColor, useCORS: true, logging: false });
      return await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("empty"))), "image/png"));
    } finally {
      sheet.style.zoom = z;
      document.body.classList.remove("exporting");
    }
  }

  const fileHelp = "Browsers block reading the built-in images when the page is opened as a file. Open it with VS Code “Live Server” (or run: python -m http.server) and try again.";

  $("#btnPng").addEventListener("click", async () => {
    toast("Rendering sheet…");
    try { download(`${fileBase()}.png`, await renderSheet()); toast("PNG saved."); }
    catch (e) { console.error(e); toast(location.protocol === "file:" ? fileHelp : "PNG export failed: " + e.message, 8000); }
  });
  $("#btnZip").addEventListener("click", () => exportZip());

  async function srcToBlob(src) {
    const r = await fetch(src);
    if (!r.ok) throw new Error(r.status);
    return r.blob();
  }

  async function exportZip(promptText) {
    if (!window.JSZip) return toast("JSZip not loaded (are you offline?).");
    toast("Building AI pack…", 10000);
    const d = collect();
    const prompt = promptText || buildPrompt(d);
    const zip = new JSZip();
    const missing = [];
    for (const s of d.sections) {
      for (const i of s.items) {
        if (!i.file) continue;
        try { zip.file(i.file, await srcToBlob(i.src)); }
        catch (e) { missing.push(i.label); }
      }
    }
    try { zip.file("sheet.png", await renderSheet()); } catch (e) { missing.push("sheet.png"); }
    zip.file("prompt.md", prompt);
    zip.file("character.json", characterJson(prompt));
    const blob = await zip.generateAsync({ type: "blob" });
    download(`${fileBase()}.ai-pack.zip`, blob, "application/zip");
    if (missing.length) toast(`Saved, but ${missing.length} image(s) were skipped. ` + (location.protocol === "file:" ? fileHelp : ""), 9000);
    else toast("AI pack saved.");
  }

  /* ---------------- go ---------------- */
  restore();
  applyState();
  fit();
})();
