// === action.js ===
document.addEventListener("DOMContentLoaded", () => {
  /* =========================================================
     === 1. STRUCTURE ET NAVIGATION DU LIVRE 3D ===
  ========================================================= */

  const coverRight = document.querySelector(".cover.cover-right");
  const coverLeft = document.querySelector(".cover.cover-left");
  const pages = Array.from(document.querySelectorAll(".book-page"));
  const navButtons = Array.from(document.querySelectorAll(".nextprev-btn"));

  // Identifier le côté de chaque page
  pages.forEach((p) => {
    if (p.classList.contains("page-left")) p.dataset.side = "left";
    else p.dataset.side = "right";
  });

  // S’assurer que les flèches sont visibles
  navButtons.forEach((btn) => {
    btn.style.display = "block";
    btn.style.zIndex = 200;
    const cs = getComputedStyle(btn);
    if (cs.left && cs.left.includes("-")) btn.style.left = "12px";
    if (cs.right && cs.right.includes("-")) btn.style.right = "12px";
  });

  // Fonctions utilitaires
  function firstNotTurnedIndex() {
    return pages.findIndex((p) => !p.classList.contains("turn"));
  }

  function lastTurnedIndex() {
    for (let i = pages.length - 1; i >= 0; i--) {
      if (pages[i].classList.contains("turn")) return i;
    }
    return -1;
  }

  // Animation ouverture initiale
  function openBookOnce() {
    if (!coverRight) return;
    if (!coverRight.classList.contains("turn")) {
      setTimeout(() => {
        coverRight.classList.add("turn");
      }, 800);
      setTimeout(() => {
        coverRight.style.zIndex = -1;
      }, 1600);
      if (coverLeft) coverLeft.style.zIndex = 1;
    }
  }
  openBookOnce();

  // Navigation pages
  function nextPage() {
    const idx = firstNotTurnedIndex();
    if (idx === -1) return;
    const p = pages[idx];
    p.classList.add("turn");
    p.style.transform = `rotateY(${p.dataset.side === "left" ? "" : "-"}180deg)`;
    p.style.zIndex = 20 + idx;
  }

  function prevPage() {
    const idx = lastTurnedIndex();
    if (idx === -1) return;
    const p = pages[idx];
    p.classList.remove("turn");
    p.style.transform = "";
    p.style.zIndex = 10 + idx;
  }

  // Liens boutons et clavier
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (
        btn.classList.contains("btn-prev") ||
        btn.textContent.trim() === "‹" ||
        btn.textContent.trim() === "<"
      ) {
        prevPage();
      } else {
        nextPage();
      }
    });
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") nextPage();
    if (e.key === "ArrowLeft") prevPage();
  });

  // Exposer globalement
  window.nextPage = nextPage;
  window.prevPage = prevPage;

  /* =========================================================
     === 2. NOTES, SAUVEGARDE & RESTAURATION ===
  ========================================================= */

  function saveNote(noteId) {
    const editor =
      document.getElementById(noteId) ||
      document.querySelector(`[data-note-id='${noteId}']`);
    if (!editor) return false;
    localStorage.setItem(noteId, editor.innerHTML);
    return true;
  }

  window.saveNote = (noteId) => {
    const ok = saveNote(noteId);
    if (ok) {
      const el = document.createElement("div");
      el.textContent = "Note sauvegardée ✅";
      Object.assign(el.style, {
        position: "fixed",
        right: "16px",
        bottom: "16px",
        background: "#333",
        color: "#fff",
        padding: "8px 12px",
        borderRadius: "8px",
        zIndex: 9999,
        opacity: "0",
        transition: "opacity .25s",
      });
      document.body.appendChild(el);
      requestAnimationFrame(() => (el.style.opacity = "1"));
      setTimeout(() => {
        el.style.opacity = "0";
        setTimeout(() => el.remove(), 300);
      }, 900);
    } else {
      alert("Impossible de sauvegarder : éditeur introuvable.");
    }
  };

  // Restauration des notes et polices
  document.querySelectorAll(".note-editor").forEach((editor) => {
    const id = editor.getAttribute("data-note-id") || editor.id;
    const saved = localStorage.getItem(id);
    if (saved) editor.innerHTML = saved;

    const savedSize = localStorage.getItem(`fontSize-${id}`);
    if (savedSize) editor.style.fontSize = savedSize;

    const savedTheme = localStorage.getItem(`theme-${id}`);
    if (savedTheme === "dark") applyTheme(editor, "dark");
  });

  // Sauvegarde automatique
  setInterval(() => {
    document.querySelectorAll(".note-editor").forEach((editor) => {
      const id = editor.getAttribute("data-note-id") || editor.id;
      if (editor.innerHTML.trim() !== "")
        localStorage.setItem(id, editor.innerHTML);
    });
  }, 30000);

  /* =========================================================
     === 3. CONTROLES : TAILLE DE POLICE + THEME ===
  ========================================================= */

  function changeFontSize(editorId, size) {
    let editor =
      document.getElementById(editorId) ||
      document.querySelector(`[data-note-id='${editorId}']`);
    if (!editor) {
      console.error(`Éditeur ${editorId} non trouvé`);
      return;
    }

    if (typeof size === "number") size = size + "px";
    if (typeof size === "string" && size.match(/^\d+(\.\d+)?(px|em|rem|%)$/)) {
      editor.style.fontSize = size;
      const key = editor.id
        ? `fontSize-${editor.id}`
        : `fontSize-${editor.dataset.noteId}`;
      localStorage.setItem(key, size);
    } else {
      console.error("Valeur de taille non valide:", size);
    }
  }
  window.changeFontSize = changeFontSize;

  function applyTheme(editor, theme) {
    if (theme === "dark") {
      editor.style.backgroundColor = "#282c34";
      editor.style.color = "#abb2bf";
      editor.style.borderColor = "#444";
    } else {
      editor.style.backgroundColor = "white";
      editor.style.color = "#333";
      editor.style.borderColor = "#ddd";
    }
  }

  function toggleTheme(editorId, button) {
    let editor =
      document.getElementById(editorId) ||
      document.querySelector(`[data-note-id='${editorId}']`);
    if (!editor) return;

    const isDark =
      window.getComputedStyle(editor).backgroundColor === "rgb(40, 44, 52)";
    if (isDark) {
      applyTheme(editor, "light");
      localStorage.setItem(`theme-${editorId}`, "light");
      button.classList.remove("active");
    } else {
      applyTheme(editor, "dark");
      localStorage.setItem(`theme-${editorId}`, "dark");
      button.classList.add("active");
    }
  }
  window.toggleTheme = toggleTheme;

  /* =========================================================
     === 4. BARRE FLOTTANTE GLOBALE ===
  ========================================================= */

  const toolbar = document.createElement("div");
  toolbar.innerHTML = `
    <div style="
      position: fixed;
      right: 25px;
      bottom: 25px;
      background: rgba(255,255,255,0.9);
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      border-radius: 12px;
      padding: 10px 14px;
      z-index: 9999;
      display: flex;
      gap: 10px;
      align-items: center;
      font-family: 'JetBrains Mono', monospace;
    ">
      <button id="font-minus" style="font-size:16px;">A−</button>
      <button id="font-plus" style="font-size:18px;">A+</button>
      <button id="toggle-theme" style="font-size:14px;">🌙/☀️</button>
    </div>
  `;
  document.body.appendChild(toolbar);

  // Gère la taille de police globale sur tous les éditeurs
  function adjustGlobalFont(deltaPx) {
    document.querySelectorAll(".note-editor").forEach((ed) => {
      const current = parseFloat(window.getComputedStyle(ed).fontSize);
      const newSize = Math.max(10, Math.min(24, current + deltaPx));
      ed.style.fontSize = newSize + "px";
      const id = ed.getAttribute("data-note-id") || ed.id;
      localStorage.setItem(`fontSize-${id}`, newSize + "px");
    });
  }

  document.getElementById("font-minus").onclick = () => adjustGlobalFont(-2);
  document.getElementById("font-plus").onclick = () => adjustGlobalFont(+2);

  // Basculer le thème globalement
  document.getElementById("toggle-theme").onclick = () => {
    document.querySelectorAll(".note-editor").forEach((ed) => {
      const bg = window.getComputedStyle(ed).backgroundColor;
      const id = ed.getAttribute("data-note-id") || ed.id;
      if (bg === "rgb(40, 44, 52)") {
        applyTheme(ed, "light");
        localStorage.setItem(`theme-${id}`, "light");
      } else {
        applyTheme(ed, "dark");
        localStorage.setItem(`theme-${id}`, "dark");
      }
    });
  };

  console.log("📖 Livre interactif initialisé :", {
    pages: pages.length,
    notes: document.querySelectorAll(".note-editor").length,
  });
});
