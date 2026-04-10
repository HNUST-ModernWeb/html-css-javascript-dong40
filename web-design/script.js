(() => {
  const $ = (sel) => document.querySelector(sel);

  const els = {
    themeToggle: $("#themeToggle"),
    themeToggleLabel: $("#themeToggleLabel"),
    card: $("#profileCard"),
    avatarWrap: $("#avatarWrap"),
    avatarInput: $("#avatarInput"),
    avatarImg: $("#avatarImg"),
    avatarInitials: $("#avatarInitials"),

    nameInput: $("#nameInput"),
    bioInput: $("#bioInput"),
    charCount: $("#charCount"),
    nameError: $("#nameError"),

    nameDisplay: $("#nameDisplay"),
    bioDisplay: $("#bioDisplay"),

    saveBtn: $("#saveBtn"),
    resetBtn: $("#resetBtn"),
    form: $("#profileForm"),
  };

  const STORAGE_KEYS = {
    theme: "pf_theme_v1",
    name: "pf_name_v1",
    bio: "pf_bio_v1",
    avatar: "pf_avatar_v1", // dataURL
  };

  const DEFAULTS = {
    name: "美叽",
    bio: "世界上最可爱的小老鼠!",
    avatar: "1.jpg",
    theme: "dark",
  };

  function clampStr(str, maxLen) {
    const s = String(str ?? "");
    if (s.length <= maxLen) return s;
    return s.slice(0, maxLen);
  }

  function getInitials(name) {
    const s = String(name ?? "").trim();
    if (!s) return "N/A";
    // 简单规则：中文取前1个字符；英文取前2个字母
    if (/[\u4e00-\u9fa5]/.test(s)) return s.slice(0, 1);
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return s.slice(0, 2).toUpperCase();
  }

  function setAvatar(dataUrlOrEmpty) {
    const hasAvatar = Boolean(dataUrlOrEmpty);
    els.avatarImg.style.display = hasAvatar ? "block" : "none";
    els.avatarInitials.style.display = hasAvatar ? "none" : "grid";
    if (hasAvatar) {
      els.avatarImg.src = dataUrlOrEmpty;
    } else {
      els.avatarImg.removeAttribute("src");
      els.avatarImg.src = "";
    }
  }

  function updatePreviewFromInputs() {
    const name = clampStr(els.nameInput.value.trim(), 20);
    const bio = clampStr(els.bioInput.value.trim(), 120);
    els.nameDisplay.textContent = name || DEFAULTS.name;
    els.bioDisplay.textContent = bio || DEFAULTS.bio;
  }

  function validateAndGetName() {
    const name = els.nameInput.value.trim();
    if (!name) {
      els.nameError.textContent = "姓名不能为空。";
      return null;
    }
    if (name.length > 20) {
      els.nameError.textContent = "姓名长度不能超过20个字符。";
      return null;
    }
    els.nameError.textContent = "";
    return name;
  }

  function updateCharCount() {
    const len = els.bioInput.value.length;
    els.charCount.textContent = `${len}/120`;
  }

  function setTheme(theme) {
    const t = theme === "light" ? "light" : "dark";
    document.body.dataset.theme = t;
    // 按“当前显示的反向按钮文字”直观些
    if (t === "dark") {
      els.themeToggleLabel.textContent = "深色";
    } else {
      els.themeToggleLabel.textContent = "浅色";
    }
  }

  function toggleTheme() {
    const cur = document.body.dataset.theme === "light" ? "light" : "dark";
    const next = cur === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem(STORAGE_KEYS.theme, next);
  }

  async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("读取图片失败。"));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(file);
    });
  }

  async function handleAvatarUpload(file) {
    if (!file) return;
    // 限制大小，避免本地存储过大
    const maxBytes = 800 * 1024;
    if (file.size > maxBytes) {
      els.nameError.textContent = "头像图片过大（建议小于800KB）。";
      return;
    }
    els.nameError.textContent = "";
    const dataUrl = await fileToDataUrl(file);
    localStorage.setItem(STORAGE_KEYS.avatar, dataUrl);
    setAvatar(dataUrl);
  }

  function saveProfile() {
    const name = validateAndGetName();
    if (!name) return;

    const bio = clampStr(els.bioInput.value.trim(), 120);
    localStorage.setItem(STORAGE_KEYS.name, name);
    localStorage.setItem(STORAGE_KEYS.bio, bio);

    // 同步预览区（卡片顶部）
    els.nameInput.value = name;
    els.bioInput.value = bio;
    updatePreviewFromInputs();
    els.avatarInitials.textContent = getInitials(name);

    // 提示轻量化：按钮短暂“成功”态
    const oldText = els.saveBtn.textContent;
    els.saveBtn.textContent = "已保存";
    els.saveBtn.disabled = true;
    setTimeout(() => {
      els.saveBtn.textContent = oldText;
      els.saveBtn.disabled = false;
    }, 900);
  }

  function resetProfile() {
    localStorage.removeItem(STORAGE_KEYS.name);
    localStorage.removeItem(STORAGE_KEYS.bio);
    localStorage.removeItem(STORAGE_KEYS.avatar);

    els.nameInput.value = DEFAULTS.name;
    els.bioInput.value = DEFAULTS.bio;
    els.avatarInitials.textContent = getInitials(DEFAULTS.name);
    setAvatar("1.jpg");
    updateCharCount();
    updatePreviewFromInputs();
    els.nameError.textContent = "";
  }

  function init() {
    // 主题
    const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    const theme = storedTheme ? storedTheme : DEFAULTS.theme;
    setTheme(theme);

    // 表单值
    const name = localStorage.getItem(STORAGE_KEYS.name) ?? DEFAULTS.name;
    const bio = localStorage.getItem(STORAGE_KEYS.bio) ?? DEFAULTS.bio;
    const avatar = localStorage.getItem(STORAGE_KEYS.avatar) ?? DEFAULTS.avatar;

    els.nameInput.value = name;
    els.bioInput.value = bio;
    els.avatarInitials.textContent = getInitials(name);
    setAvatar(avatar);
    els.avatarImg.style.display = "block";
    els.avatarInitials.style.display = "none";

    updateCharCount();
    updatePreviewFromInputs();

    // 事件绑定
    els.themeToggle?.addEventListener("click", toggleTheme);
    els.avatarWrap?.addEventListener("click", () => els.avatarInput.click());
    els.avatarInput?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) handleAvatarUpload(file).catch((err) => {
        els.nameError.textContent = String(err?.message || "上传失败。");
      });
    });

    els.bioInput.addEventListener("input", updateCharCount);
    els.nameInput.addEventListener("input", () => {
      // 输入时也能即时更新预览（但不写入localStorage，直到点保存）
      const tentative = clampStr(els.nameInput.value.trim(), 20);
      els.nameDisplay.textContent = tentative || DEFAULTS.name;
      els.avatarInitials.textContent = getInitials(tentative);
    });
    els.bioInput.addEventListener("input", () => {
      const tentative = clampStr(els.bioInput.value.trim(), 120);
      els.bioDisplay.textContent = tentative || DEFAULTS.bio;
    });

    els.saveBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      saveProfile();
    });

    els.resetBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      resetProfile();
    });

    // Enter 快捷键：在表单中按 Enter 触发保存（避免多行 textarea 的默认行为）
    els.form.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        saveProfile();
      }
    });

    // 点击卡片轻微聚焦到姓名输入，提高交互“高级感”
    els.card.addEventListener("click", (e) => {
      const target = e.target;
      if (target && (target === els.nameInput || target === els.bioInput)) return;
      if (target && target.closest && target.closest(".btn")) return;
      els.nameInput.focus();
    });
  }

  init();
})();

