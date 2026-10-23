/**
 * ============================================================================
 * LILY HOME — Интерактивен Фотоалбум, Видео История и 3D Кинематографичен Свят
 * ============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  const CONFIG = window.SITE_CONFIG;
  if (!CONFIG) return;

  // Зареждане на запазени потребителски редакции (име, текстове, семейни/любими снимки)
  const STORAGE_KEY_TEXTS = "lily_home_custom_texts_v1";
  const STORAGE_KEY_FAMILY = "lily_home_family_ids_v1";
  const STORAGE_KEY_FAVS = "lily_home_fav_ids_v1";

  let savedTexts = {};
  try {
    savedTexts = JSON.parse(localStorage.getItem(STORAGE_KEY_TEXTS) || "{}");
  } catch (e) {
    savedTexts = {};
  }

  // Възстановяване на потребителски избор за семейни и любими снимки
  try {
    const savedFamilyIds = JSON.parse(localStorage.getItem(STORAGE_KEY_FAMILY) || "null");
    if (Array.isArray(savedFamilyIds)) {
      CONFIG.photos.forEach((p) => {
        p.isFamily = savedFamilyIds.includes(p.id);
        if (p.isFamily && !p.categories.includes("family")) {
          p.categories.push("family");
        } else if (!p.isFamily) {
          p.categories = p.categories.filter((c) => c !== "family");
        }
      });
    }

    const savedFavIds = JSON.parse(localStorage.getItem(STORAGE_KEY_FAVS) || "null");
    if (Array.isArray(savedFavIds)) {
      CONFIG.photos.forEach((p) => {
        p.isFavorite = savedFavIds.includes(p.id);
        if (p.isFavorite && !p.categories.includes("favorites")) {
          p.categories.push("favorites");
        } else if (!p.isFavorite) {
          p.categories = p.categories.filter((c) => c !== "favorites");
        }
      });
    }
  } catch (e) {}

  // Състояние на приложението
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let isMotionPaused = prefersReducedMotion;
  let activeYearFilter = "all";
  let activeCategoryFilter = "all";
  let currentLightboxList = [...CONFIG.photos];
  let currentLightboxIndex = 0;
  let lastFocusedElement = null;

  // Елементи
  const globalBgVideo = document.getElementById("globalBgVideo");
  const bgMemoryCrossfade = document.getElementById("bgMemoryCrossfade");
  const bgVignetteOverlay = document.getElementById("bgVignetteOverlay");
  const bgSlideA = document.getElementById("bgSlideA");
  const bgSlideB = document.getElementById("bgSlideB");
  const bgAmbientGlow = document.getElementById("bgAmbientGlow");
  const motionToggleBtn = document.getElementById("motionToggleBtn");
  const motionLabel = document.getElementById("motionLabel");
  const audioToggleBtn = document.getElementById("audioToggleBtn");
  const iconSoundMuted = document.getElementById("iconSoundMuted");
  const iconSoundUnmuted = document.getElementById("iconSoundUnmuted");

  // Интро видео синхронизирани елементи (00:00 -> 00:10)
  const introSyncedStage = document.getElementById("introSyncedStage");
  const introSceneNum = document.getElementById("introSceneNum");
  const introSceneEyebrow = document.getElementById("introSceneEyebrow");
  const introSceneTitle = document.getElementById("introSceneTitle");
  const introSteps = document.querySelectorAll(".intro-step");
  const introFills = [
    document.getElementById("introFill0"),
    document.getElementById("introFill1"),
    document.getElementById("introFill2"),
    document.getElementById("introFill3")
  ];

  const INTRO_VIDEO_SCENES = [
    {
      num: "01",
      start: 0.0,
      end: 2.35,
      eyebrow: "УТРИННИ ОТРАЖЕНИЯ",
      title: "Тишината на споделените утрини"
    },
    {
      num: "02",
      start: 2.35,
      end: 4.45,
      eyebrow: "ТОПЛА ВЕЧЕР",
      title: "Светлината на нашия уютен свят"
    },
    {
      num: "03",
      start: 4.45,
      end: 6.55,
      eyebrow: "МОРСКИ ХОРИЗОНТ",
      title: "По пътя към любимите брегове"
    },
    {
      num: "04",
      start: 6.55,
      end: 10.05,
      eyebrow: "ЗВЕЗДНА НОЩ",
      title: "Вечност под звездното небе"
    }
  ];

  let activeIntroSceneIdx = -1;
  let isIntroTransitioning = false;

  function renderIntroSceneText(idx, immediate = false) {
    const scene = INTRO_VIDEO_SCENES[idx];
    if (!scene || !introSyncedStage || !introSceneTitle) return;
    activeIntroSceneIdx = idx;

    introSteps.forEach((btn, i) => btn.classList.toggle("active", i === idx));

    const applyWords = () => {
      if (introSceneNum) introSceneNum.textContent = scene.num;
      if (introSceneEyebrow) introSceneEyebrow.textContent = scene.eyebrow;

      const words = scene.title.split(/\s+/);
      introSceneTitle.innerHTML = words
        .map((w, i) => `<span class="intro-word" style="--w-idx:${i}">${w}</span>`)
        .join(" ");

      introSyncedStage.classList.remove("is-exiting");
      void introSyncedStage.offsetWidth;
      introSyncedStage.classList.add("is-visible");
      isIntroTransitioning = false;
    };

    if (immediate || !introSyncedStage.classList.contains("is-visible")) {
      introSyncedStage.classList.remove("is-visible", "is-exiting");
      applyWords();
    } else {
      isIntroTransitioning = true;
      introSyncedStage.classList.remove("is-visible");
      introSyncedStage.classList.add("is-exiting");
      setTimeout(applyWords, 360);
    }
  }

  function syncIntroVideoLoop() {
    if (globalBgVideo) {
      const t = globalBgVideo.currentTime || 0;
      let matched = 0;
      for (let i = 0; i < INTRO_VIDEO_SCENES.length; i++) {
        if (t >= INTRO_VIDEO_SCENES[i].start && t < INTRO_VIDEO_SCENES[i].end) {
          matched = i;
          break;
        }
      }

      if (matched !== activeIntroSceneIdx && !isIntroTransitioning) {
        renderIntroSceneText(matched);
      }

      INTRO_VIDEO_SCENES.forEach((sc, i) => {
        const fill = introFills[i];
        if (!fill) return;
        if (i < matched) fill.style.width = "100%";
        else if (i > matched) fill.style.width = "0%";
        else {
          const pct = Math.min(100, Math.max(0, ((t - sc.start) / (sc.end - sc.start)) * 100));
          fill.style.width = `${pct}%`;
        }
      });
    }
    requestAnimationFrame(syncIntroVideoLoop);
  }

  renderIntroSceneText(0, true);
  requestAnimationFrame(syncIntroVideoLoop);

  introSteps.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-intro-scene"), 10);
      if (globalBgVideo && INTRO_VIDEO_SCENES[idx]) {
        globalBgVideo.currentTime = INTRO_VIDEO_SCENES[idx].start + 0.05;
        isIntroTransitioning = false;
        renderIntroSceneText(idx);
      }
    });
  });

  // ==========================================================================
  // 1. ИНИЦИАЛИЗАЦИЯ НА РЕДАКТИРУЕМИ ТЕКСТОВЕ И НАЧАЛЕН ЕКРАН
  // ==========================================================================

  function getNestedConfigValue(obj, path) {
    return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : ""), obj);
  }

  function applyEditableTexts() {
    document.querySelectorAll("[data-edit-key]").forEach((el) => {
      const key = el.getAttribute("data-edit-key");
      const defaultVal = getNestedConfigValue(CONFIG, key);
      el.textContent = savedTexts[key] !== undefined ? savedTexts[key] : defaultVal;

      el.addEventListener("blur", () => {
        const newVal = el.textContent.trim();
        if (newVal) {
          savedTexts[key] = newVal;
          try {
            localStorage.setItem(STORAGE_KEY_TEXTS, JSON.stringify(savedTexts));
          } catch (err) {}
        }
      });

      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && key === "wifeName") {
          e.preventDefault();
          el.blur();
        }
      });
    });
  }

  applyEditableTexts();

  // Възстановяване на фабричните текстове
  const resetEditsBtn = document.getElementById("resetEditsBtn");
  if (resetEditsBtn) {
    resetEditsBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY_TEXTS);
      localStorage.removeItem(STORAGE_KEY_FAMILY);
      localStorage.removeItem(STORAGE_KEY_FAVS);
      window.location.reload();
    });
  }

  // Начални Hero снимки водят към Lightbox
  const heroFeaturedFrame = document.getElementById("heroFeaturedFrame");
  const heroFloatingMini = document.getElementById("heroFloatingMini");
  if (heroFeaturedFrame) {
    heroFeaturedFrame.addEventListener("click", () => openLightboxById("photo-13", CONFIG.photos));
  }
  if (heroFloatingMini) {
    heroFloatingMini.addEventListener("click", () => openLightboxById("photo-07", CONFIG.photos));
  }

  // Плавно появяване на елементите в Hero секцията
  setTimeout(() => {
    document.querySelectorAll(".hero-section .reveal-item").forEach((el, idx) => {
      setTimeout(() => el.classList.add("revealed"), idx * 110);
    });
  }, 80);

  // ==========================================================================
  // 2. ПОСТОЯНЕН ВИДЕО ИСТОРИЯ СЛОЙ ПРИ СКРОЛВАНЕ (Приоритет 2)
  // ==========================================================================

  // Безопасно стартиране на видеофона с обработка на отказ за autoplay
  function playVideoSafely(videoEl) {
    if (!videoEl || isMotionPaused) return;
    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Ако браузърът блокира autoplay, постерът и анимираните фонови слайдове поемат плавно
      });
    }
  }

  playVideoSafely(globalBgVideo);

  // Фонови сцени при скролване през различните глави на сайта
  const chapterBgPhotos = {
    "hero": "facebook_1792763701295_7519395963396826105.jpg",
    "her-world": "IMG_20260921_185332.jpg",
    "memories": "IMG-08a108395de870f235f523a71db1a6d4-V.jpg",
    "family": "IMG_20260316_215016.jpg",
    "motion": "IMG-6100748e383180b31d688baec7e0a885-V.jpg",
    "favorites": "IMG_20261012_212209.jpg",
    "finale": "IMG_20260930_185559.jpg"
  };

  let currentBgPhotoSrc = "";
  let useSlideA = true;

  function crossfadeBackgroundMemory(src) {
    if (!src || src === currentBgPhotoSrc || !bgSlideA || !bgSlideB) return;
    currentBgPhotoSrc = src;

    if (useSlideA) {
      bgSlideA.style.backgroundImage = `url("${src}")`;
      bgSlideA.classList.add("active");
      bgSlideB.classList.remove("active");
    } else {
      bgSlideB.style.backgroundImage = `url("${src}")`;
      bgSlideB.classList.add("active");
      bgSlideA.classList.remove("active");
    }
    useSlideA = !useSlideA;
  }

  // Начален фонов слайд
  crossfadeBackgroundMemory(chapterBgPhotos["hero"]);

  // Скрол паралакс и плавно приближаване/отдалечаване на видеофона
  let tickingScroll = false;
  const siteHeader = document.getElementById("siteHeader");

  function onScrollUpdate() {
    const scrollY = window.scrollY || window.pageYOffset;
    const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const scrollProgress = Math.min(1, Math.max(0, scrollY / docHeight));
    const isAtHeroIntro = scrollY < window.innerHeight * 0.65;

    if (siteHeader) {
      siteHeader.classList.toggle("scrolled", scrollY > 30);
    }

    // В Hero интрото видеото е 100% чисто, а след скролване надолу плавно преминава във фонов режим
    if (globalBgVideo) {
      globalBgVideo.classList.toggle("intro-mode", isAtHeroIntro);
    }
    if (bgVignetteOverlay) {
      bgVignetteOverlay.classList.toggle("intro-mode", isAtHeroIntro);
    }
    if (bgMemoryCrossfade) {
      bgMemoryCrossfade.classList.toggle("intro-hidden", isAtHeroIntro);
    }

    if (!isMotionPaused && globalBgVideo) {
      const scale = isAtHeroIntro ? 1.02 : 1.04 + scrollProgress * 0.1;
      const translateY = isAtHeroIntro ? 0 : (scrollProgress - 0.5) * -35;
      globalBgVideo.style.transform = `scale(${scale.toFixed(3)}) translate3d(0, ${translateY.toFixed(1)}px, 0)`;

      if (bgAmbientGlow) {
        const glowX = Math.sin(scrollProgress * Math.PI * 2) * 60;
        const glowY = scrollProgress * 120;
        bgAmbientGlow.style.transform = `translate3d(${glowX.toFixed(1)}px, ${glowY.toFixed(1)}px, 0)`;
      }
    }

    tickingScroll = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!tickingScroll) {
        requestAnimationFrame(onScrollUpdate);
        tickingScroll = true;
      }
    },
    { passive: true }
  );

  // Засичане коя секция (глава) е на екрана за смяна на фоновата атмосфера и активния линк
  const chapters = document.querySelectorAll(".story-chapter");
  const navLinks = document.querySelectorAll(".desktop-nav .nav-link");

  const chapterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const chapterKey = entry.target.getAttribute("data-chapter");
          const sectionId = entry.target.id;

          if (chapterBgPhotos[chapterKey]) {
            crossfadeBackgroundMemory(chapterBgPhotos[chapterKey]);
          }

          navLinks.forEach((link) => {
            link.classList.toggle("active", link.getAttribute("href") === `#${sectionId}`);
          });
        }
      });
    },
    { threshold: 0.28 }
  );

  chapters.forEach((ch) => chapterObserver.observe(ch));

  // Бутон за пауза/пускане на движението
  function updateMotionState(paused) {
    isMotionPaused = paused;
    document.body.classList.toggle("motion-paused", isMotionPaused);
    if (motionToggleBtn) {
      motionToggleBtn.setAttribute("aria-pressed", String(isMotionPaused));
    }
    if (motionLabel) {
      motionLabel.textContent = isMotionPaused ? "Движение: Пауза" : "Движение: Вкл.";
    }
    if (globalBgVideo) {
      if (isMotionPaused) {
        globalBgVideo.pause();
      } else {
        playVideoSafely(globalBgVideo);
      }
    }
  }

  if (prefersReducedMotion) {
    updateMotionState(true);
  }

  if (motionToggleBtn) {
    motionToggleBtn.addEventListener("click", () => {
      updateMotionState(!isMotionPaused);
    });
  }

  // Бутон за звук от видеофона
  if (audioToggleBtn && globalBgVideo) {
    audioToggleBtn.addEventListener("click", () => {
      globalBgVideo.muted = !globalBgVideo.muted;
      const muted = globalBgVideo.muted;
      iconSoundMuted.classList.toggle("hidden", !muted);
      iconSoundUnmuted.classList.toggle("hidden", muted);
      audioToggleBtn.classList.toggle("active", !muted);
      if (!muted && globalBgVideo.paused) {
        globalBgVideo.play().catch(() => {});
      }
    });
  }

  // ==========================================================================
  // 3. МОБИЛНА НАВИГАЦИЯ
  // ==========================================================================

  const mobileMenuOpenBtn = document.getElementById("mobileMenuOpenBtn");
  const mobileMenuCloseBtn = document.getElementById("mobileMenuCloseBtn");
  const mobileNavDrawer = document.getElementById("mobileNavDrawer");
  const mobileDrawerBackdrop = document.getElementById("mobileDrawerBackdrop");

  function toggleMobileMenu(open) {
    if (!mobileNavDrawer || !mobileDrawerBackdrop) return;
    mobileNavDrawer.classList.toggle("open", open);
    mobileDrawerBackdrop.classList.toggle("open", open);
    mobileNavDrawer.setAttribute("aria-hidden", String(!open));
    if (mobileMenuOpenBtn) {
      mobileMenuOpenBtn.setAttribute("aria-expanded", String(open));
    }
  }

  if (mobileMenuOpenBtn) {
    mobileMenuOpenBtn.addEventListener("click", () => toggleMobileMenu(true));
  }
  if (mobileMenuCloseBtn) {
    mobileMenuCloseBtn.addEventListener("click", () => toggleMobileMenu(false));
  }
  if (mobileDrawerBackdrop) {
    mobileDrawerBackdrop.addEventListener("click", () => toggleMobileMenu(false));
  }
  document.querySelectorAll(".mobile-nav-link").forEach((link) => {
    link.addEventListener("click", () => toggleMobileMenu(false));
  });

  // ==========================================================================
  // 4. АЛБУМИ, КОМБИНИРАНИ ФИЛТРИ И АДАПТИВНА 3D ГАЛЕРИЯ (Приоритети 3 и 4)
  // ==========================================================================

  const albumsCardsGrid = document.getElementById("albumsCardsGrid");
  const mainGalleryGrid = document.getElementById("mainGalleryGrid");
  const emptyAlbumState = document.getElementById("emptyAlbumState");
  const activeFilterSummary = document.getElementById("activeFilterSummary");
  const resetFiltersBtn = document.getElementById("resetFiltersBtn");
  const emptyStateResetBtn = document.getElementById("emptyStateResetBtn");
  const yearFilterPills = document.querySelectorAll("#yearFilterPills .filter-pill");
  const categoryFilterPills = document.querySelectorAll("#categoryFilterPills .filter-pill");

  function getPhotoById(id) {
    return CONFIG.photos.find((p) => p.id === id) || CONFIG.photos[0];
  }

  function countPhotosForAlbum(album) {
    if (album.type === "reset") return CONFIG.photos.length;
    if (album.type === "year") {
      return CONFIG.photos.filter((p) => p.year === album.value).length;
    }
    if (album.type === "category") {
      return CONFIG.photos.filter((p) => p.categories.includes(album.value)).length;
    }
    return 0;
  }

  function renderAlbumCards() {
    if (!albumsCardsGrid) return;
    albumsCardsGrid.innerHTML = "";

    CONFIG.albums.forEach((album) => {
      const coverPhoto = getPhotoById(album.coverPhotoId);
      const count = countPhotosForAlbum(album);
      const countLabel =
        album.id === "video"
          ? `${count} кадъра + 1 видео`
          : count === 1
          ? "1 снимка"
          : `${count} снимки`;

      const isActive =
        (album.type === "reset" && activeYearFilter === "all" && activeCategoryFilter === "all") ||
        (album.type === "year" && activeYearFilter === album.value) ||
        (album.type === "category" && activeCategoryFilter === album.value);

      const card = document.createElement("button");
      card.type = "button";
      card.className = `album-card-3d${isActive ? " active" : ""}`;
      card.setAttribute("data-album-id", album.id);
      card.setAttribute("data-tilt-card", "");

      card.innerHTML = `
        <img
          src="${coverPhoto.src}"
          alt="${album.title}"
          class="album-card-cover"
          loading="lazy"
          style="object-position: ${coverPhoto.focalPoint || "50% 40%"};"
        />
        <div class="album-card-shade"></div>
        <div class="album-card-shine"></div>
        <div class="album-card-content">
          <span class="album-count-badge">${countLabel}</span>
          <h3 class="album-card-title">${album.title}</h3>
          <p class="album-card-sub">${album.subtitle}</p>
        </div>
      `;

      card.addEventListener("click", () => {
        if (album.type === "reset") {
          activeYearFilter = "all";
          activeCategoryFilter = "all";
        } else if (album.type === "year") {
          activeYearFilter = activeYearFilter === album.value ? "all" : album.value;
        } else if (album.type === "category") {
          activeCategoryFilter = activeCategoryFilter === album.value ? "all" : album.value;
        }
        syncFiltersAndRender(true);
      });

      albumsCardsGrid.appendChild(card);
    });

    bind3DTiltEffects();
  }

  function getFilteredPhotos() {
    return CONFIG.photos.filter((photo) => {
      const matchesYear = activeYearFilter === "all" || photo.year === activeYearFilter;
      const matchesCat =
        activeCategoryFilter === "all" || photo.categories.includes(activeCategoryFilter);
      return matchesYear && matchesCat;
    });
  }

  function getFilterLabelText() {
    const yearNames = {
      all: "Всички години",
      "2026": "2026 г.",
      "2025": "2025 г.",
      "2024": "2024 г.",
      unspecified: "Без посочена година"
    };
    const catNames = {
      all: "Всички категории",
      family: "Семейни снимки",
      travel: "Пътувания",
      special: "Специални моменти",
      favorites: "Любими спомени",
      video: "Видео спомени"
    };

    if (activeYearFilter === "all" && activeCategoryFilter === "all") {
      return `Показване на: <strong>Всички снимки (${CONFIG.photos.length})</strong>`;
    }
    return `Активен филтър: <strong>${yearNames[activeYearFilter]}</strong> • <strong>${catNames[activeCategoryFilter]}</strong>`;
  }

  function renderMainGallery() {
    if (!mainGalleryGrid) return;
    const filtered = getFilteredPhotos();
    currentLightboxList = filtered.length > 0 ? filtered : [...CONFIG.photos];

    mainGalleryGrid.innerHTML = "";

    if (filtered.length === 0) {
      mainGalleryGrid.classList.add("hidden");
      emptyAlbumState.classList.remove("hidden");
    } else {
      mainGalleryGrid.classList.remove("hidden");
      emptyAlbumState.classList.add("hidden");

      filtered.forEach((photo, idx) => {
        const spanClass =
          filtered.length >= 6 && photo.gridSpan ? `span-${photo.gridSpan}` : "span-normal";

        const article = document.createElement("article");
        article.className = `gallery-item-card ${spanClass} reveal-on-scroll revealed`;
        article.setAttribute("tabindex", "0");
        article.setAttribute("role", "button");
        article.setAttribute("aria-label", `${photo.title} — ${photo.dateLabel}. Отвори на цял екран`);
        article.setAttribute("data-tilt-card", "");

        article.innerHTML = `
          <div class="gallery-img-box">
            <img
              src="${photo.src}"
              alt="${photo.title}"
              loading="${idx < 3 ? "eager" : "lazy"}"
              style="object-position: ${photo.focalPoint || "50% 45%"};"
            />
            <div class="gallery-card-badges">
              <span class="year-pill-badge">${photo.dateLabel}</span>
              ${photo.isFavorite ? `<span class="fav-heart-badge" title="Любим спомен">♥</span>` : ""}
            </div>
            <div class="gallery-card-overlay">
              <h3 class="gallery-card-title">${photo.title}</h3>
              <p class="gallery-card-caption">${photo.caption}</p>
            </div>
          </div>
        `;

        const openHandler = () => openLightboxById(photo.id, filtered);
        article.addEventListener("click", openHandler);
        article.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openHandler();
          }
        });

        mainGalleryGrid.appendChild(article);
      });
    }

    if (activeFilterSummary) {
      activeFilterSummary.innerHTML = getFilterLabelText();
    }
    if (resetFiltersBtn) {
      const hasFilter = activeYearFilter !== "all" || activeCategoryFilter !== "all";
      resetFiltersBtn.classList.toggle("hidden", !hasFilter);
    }

    bind3DTiltEffects();
  }

  function syncFiltersAndRender(scrollToGallery = false) {
    yearFilterPills.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-year") === activeYearFilter);
    });
    categoryFilterPills.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-category") === activeCategoryFilter);
    });

    renderAlbumCards();
    renderMainGallery();

    if (scrollToGallery) {
      const galleryEl = document.getElementById("gallery");
      if (galleryEl) {
        galleryEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  yearFilterPills.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeYearFilter = btn.getAttribute("data-year");
      syncFiltersAndRender(false);
    });
  });

  categoryFilterPills.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategoryFilter = btn.getAttribute("data-category");
      syncFiltersAndRender(false);
    });
  });

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      activeYearFilter = "all";
      activeCategoryFilter = "all";
      syncFiltersAndRender(false);
    });
  }

  if (emptyStateResetBtn) {
    emptyStateResetBtn.addEventListener("click", () => {
      activeYearFilter = "all";
      activeCategoryFilter = "all";
      syncFiltersAndRender(false);
    });
  }

  // Вторият Hero бутон „Семейният ни албум“ отваря директно категория family
  const heroSecondaryBtn = document.getElementById("heroSecondaryBtn");
  if (heroSecondaryBtn) {
    heroSecondaryBtn.addEventListener("click", (e) => {
      e.preventDefault();
      activeYearFilter = "all";
      activeCategoryFilter = "family";
      syncFiltersAndRender(true);
    });
  }

  // ==========================================================================
  // 5. СЕКЦИЯ „НАШЕТО СЕМЕЙСТВО“ И СЕКЦИЯ „ЛЮБИМИ МОМЕНТИ“
  // ==========================================================================

  const familyShowcaseGrid = document.getElementById("familyShowcaseGrid");
  const familySelectorDrawer = document.getElementById("familySelectorDrawer");
  const familySelectorThumbs = document.getElementById("familySelectorThumbs");
  const toggleFamilyCuratorBtn = document.getElementById("toggleFamilyCuratorBtn");
  const favoritesMosaicGrid = document.getElementById("favoritesMosaicGrid");

  function renderFamilySection() {
    if (!familyShowcaseGrid) return;
    const familyPhotos = CONFIG.photos.filter((p) => p.isFamily);
    familyShowcaseGrid.innerHTML = "";

    familyPhotos.forEach((photo) => {
      const card = document.createElement("article");
      card.className = "gallery-item-card reveal-on-scroll revealed";
      card.setAttribute("data-tilt-card", "");
      card.innerHTML = `
        <div class="gallery-img-box">
          <img
            src="${photo.src}"
            alt="${photo.title}"
            loading="lazy"
            style="object-position: ${photo.focalPoint || "50% 50%"};"
          />
          <div class="gallery-card-badges">
            <span class="year-pill-badge">Нашето семейство • ${photo.dateLabel}</span>
          </div>
          <div class="gallery-card-overlay">
            <h3 class="gallery-card-title">${photo.title}</h3>
            <p class="gallery-card-caption">${photo.caption}</p>
          </div>
        </div>
      `;
      card.addEventListener("click", () => openLightboxById(photo.id, familyPhotos));
      familyShowcaseGrid.appendChild(card);
    });

    // Рендериране на селектора за избиране кои снимки са семейни
    if (familySelectorThumbs) {
      familySelectorThumbs.innerHTML = "";
      CONFIG.photos.forEach((photo) => {
        const thumbBtn = document.createElement("button");
        thumbBtn.type = "button";
        thumbBtn.className = `selector-thumb-btn${photo.isFamily ? " selected" : ""}`;
        thumbBtn.title = `${photo.title} — Кликни за включване/изключване`;
        thumbBtn.innerHTML = `
          <img src="${photo.src}" alt="${photo.title}" loading="lazy" style="object-position: ${photo.focalPoint || "50% 40%"};" />
          ${photo.isFamily ? `<span class="selector-check">✓</span>` : ""}
        `;
        thumbBtn.addEventListener("click", () => {
          photo.isFamily = !photo.isFamily;
          if (photo.isFamily && !photo.categories.includes("family")) {
            photo.categories.push("family");
          } else if (!photo.isFamily) {
            photo.categories = photo.categories.filter((c) => c !== "family");
          }
          const currentFamIds = CONFIG.photos.filter((p) => p.isFamily).map((p) => p.id);
          try {
            localStorage.setItem(STORAGE_KEY_FAMILY, JSON.stringify(currentFamIds));
          } catch (err) {}
          renderFamilySection();
          syncFiltersAndRender(false);
        });
        familySelectorThumbs.appendChild(thumbBtn);
      });
    }
  }

  if (toggleFamilyCuratorBtn && familySelectorDrawer) {
    toggleFamilyCuratorBtn.addEventListener("click", () => {
      const isHidden = familySelectorDrawer.classList.toggle("hidden");
      toggleFamilyCuratorBtn.setAttribute("aria-expanded", String(!isHidden));
    });
  }

  function renderFavoritesSection() {
    if (!favoritesMosaicGrid) return;
    const favPhotos = CONFIG.photos.filter((p) => p.isFavorite);
    favoritesMosaicGrid.innerHTML = "";

    favPhotos.forEach((photo) => {
      const card = document.createElement("article");
      card.className = "gallery-item-card reveal-on-scroll revealed";
      card.setAttribute("data-tilt-card", "");
      card.innerHTML = `
        <div class="gallery-img-box">
          <img
            src="${photo.src}"
            alt="${photo.title}"
            loading="lazy"
            style="object-position: ${photo.focalPoint || "50% 45%"};"
          />
          <div class="gallery-card-badges">
            <span class="year-pill-badge">${photo.dateLabel}</span>
            <span class="fav-heart-badge">♥</span>
          </div>
          <div class="gallery-card-overlay">
            <h3 class="gallery-card-title">${photo.title}</h3>
            <p class="gallery-card-caption">${photo.caption}</p>
          </div>
        </div>
      `;
      card.addEventListener("click", () => openLightboxById(photo.id, favPhotos));
      favoritesMosaicGrid.appendChild(card);
    });
  }

  // ==========================================================================
  // 6. СЕКЦИЯ „МОМЕНТИ В ДВИЖЕНИЕ“ — Анимирана фотоистория + Видео
  // ==========================================================================

  const cinemaSlideViewport = document.getElementById("cinemaSlideViewport");
  const cinemaStoryBg = document.getElementById("cinemaStoryBg");
  const cinemaStepCounter = document.getElementById("cinemaStepCounter");
  const cinemaSlideTitle = document.getElementById("cinemaSlideTitle");
  const cinemaSlideDesc = document.getElementById("cinemaSlideDesc");
  const cinemaProgressFill = document.getElementById("cinemaProgressFill");
  const cinemaPrevBtn = document.getElementById("cinemaPrevBtn");
  const cinemaNextBtn = document.getElementById("cinemaNextBtn");
  const cinemaPlayPauseBtn = document.getElementById("cinemaPlayPauseBtn");

  const storyPhotos = CONFIG.photos.filter((p) => p.categories.includes("video"));
  let currentStoryIdx = 0;
  let isStoryPlaying = !prefersReducedMotion;
  let storyTimer = null;

  function initPhotoStory() {
    if (!cinemaSlideViewport || storyPhotos.length === 0) return;
    cinemaSlideViewport.innerHTML = "";

    storyPhotos.forEach((photo, idx) => {
      const slide = document.createElement("div");
      slide.className = `cinema-slide-item${idx === 0 ? " active" : ""}`;
      slide.innerHTML = `
        <img
          src="${photo.src}"
          alt="${photo.title}"
          class="cinema-slide-img"
          loading="lazy"
        />
      `;
      cinemaSlideViewport.appendChild(slide);
    });

    showStorySlide(0);
    startStoryAutoplay();
  }

  function showStorySlide(index) {
    if (storyPhotos.length === 0) return;
    currentStoryIdx = (index + storyPhotos.length) % storyPhotos.length;
    const targetPhoto = storyPhotos[currentStoryIdx];

    const slides = cinemaSlideViewport.querySelectorAll(".cinema-slide-item");
    slides.forEach((sl, i) => sl.classList.toggle("active", i === currentStoryIdx));

    if (cinemaStoryBg) {
      cinemaStoryBg.style.backgroundImage = `url("${targetPhoto.src}")`;
    }
    if (cinemaStepCounter) {
      cinemaStepCounter.textContent = `${String(currentStoryIdx + 1).padStart(2, "0")} / ${String(
        storyPhotos.length
      ).padStart(2, "0")}`;
    }
    if (cinemaSlideTitle) {
      cinemaSlideTitle.textContent = targetPhoto.title;
    }
    if (cinemaSlideDesc) {
      cinemaSlideDesc.textContent = targetPhoto.caption;
    }
    if (cinemaProgressFill) {
      const pct = ((currentStoryIdx + 1) / storyPhotos.length) * 100;
      cinemaProgressFill.style.width = `${pct}%`;
    }
  }

  function startStoryAutoplay() {
    clearInterval(storyTimer);
    if (!isStoryPlaying) return;
    storyTimer = setInterval(() => {
      if (!isMotionPaused && isStoryPlaying) {
        showStorySlide(currentStoryIdx + 1);
      }
    }, 4500);
  }

  if (cinemaPrevBtn) {
    cinemaPrevBtn.addEventListener("click", () => {
      showStorySlide(currentStoryIdx - 1);
      startStoryAutoplay();
    });
  }
  if (cinemaNextBtn) {
    cinemaNextBtn.addEventListener("click", () => {
      showStorySlide(currentStoryIdx + 1);
      startStoryAutoplay();
    });
  }
  if (cinemaPlayPauseBtn) {
    cinemaPlayPauseBtn.addEventListener("click", () => {
      isStoryPlaying = !isStoryPlaying;
      cinemaPlayPauseBtn.textContent = isStoryPlaying ? "Пауза" : "Пусни";
      startStoryAutoplay();
    });
  }

  // Превключване между Анимирана Фотоистория и Реален Видео Филм
  const motionTabs = document.querySelectorAll(".motion-tab");
  const photoStoryStageWrap = document.getElementById("photoStoryStageWrap");
  const videoFilmStageWrap = document.getElementById("videoFilmStageWrap");
  const dedicatedSectionVideo = document.getElementById("dedicatedSectionVideo");

  motionTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const mode = tab.getAttribute("data-motion-tab");
      motionTabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("active", active);
        t.setAttribute("aria-selected", String(active));
      });

      if (mode === "videofilm") {
        photoStoryStageWrap.classList.add("hidden");
        videoFilmStageWrap.classList.remove("hidden");
        if (dedicatedSectionVideo) {
          dedicatedSectionVideo.play().catch(() => {});
        }
      } else {
        videoFilmStageWrap.classList.add("hidden");
        photoStoryStageWrap.classList.remove("hidden");
        if (dedicatedSectionVideo) {
          dedicatedSectionVideo.pause();
        }
      }
    });
  });

  // ==========================================================================
  // 7. LIGHTBOX НА ЦЯЛ ЕКРАН (Клавиатура, Escape, Swipe, Брояч, Възстановяване на фокус)
  // ==========================================================================

  const lightboxModal = document.getElementById("lightboxModal");
  const lightboxBackdrop = document.getElementById("lightboxBackdrop");
  const lightboxCloseBtn = document.getElementById("lightboxCloseBtn");
  const lightboxPrevBtn = document.getElementById("lightboxPrevBtn");
  const lightboxNextBtn = document.getElementById("lightboxNextBtn");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCounter = document.getElementById("lightboxCounter");
  const lightboxDateBadge = document.getElementById("lightboxDateBadge");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxDesc = document.getElementById("lightboxDesc");
  const lightboxFavBtn = document.getElementById("lightboxFavBtn");
  const lightboxSwipeArea = document.getElementById("lightboxSwipeArea");

  function openLightboxById(photoId, list = CONFIG.photos) {
    lastFocusedElement = document.activeElement;
    currentLightboxList = list && list.length > 0 ? list : CONFIG.photos;
    const idx = currentLightboxList.findIndex((p) => p.id === photoId);
    currentLightboxIndex = idx >= 0 ? idx : 0;

    updateLightboxContent();
    lightboxModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    if (lightboxCloseBtn) {
      lightboxCloseBtn.focus();
    }
  }

  function closeLightbox() {
    if (!lightboxModal || lightboxModal.classList.contains("hidden")) return;
    lightboxModal.classList.add("hidden");
    document.body.style.overflow = "";
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  function updateLightboxContent() {
    const photo = currentLightboxList[currentLightboxIndex];
    if (!photo) return;

    lightboxImg.src = photo.src;
    lightboxImg.alt = photo.title;
    lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${currentLightboxList.length}`;
    lightboxDateBadge.textContent = photo.dateLabel;
    lightboxTitle.textContent = photo.title;
    lightboxDesc.textContent = photo.caption;

    if (lightboxFavBtn) {
      lightboxFavBtn.classList.toggle("active", Boolean(photo.isFavorite));
      lightboxFavBtn.textContent = photo.isFavorite ? "♥ В Любими" : "♡ Добави в Любими";
    }
  }

  function stepLightbox(dir) {
    currentLightboxIndex =
      (currentLightboxIndex + dir + currentLightboxList.length) % currentLightboxList.length;
    updateLightboxContent();
  }

  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener("click", closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener("click", closeLightbox);
  if (lightboxPrevBtn) lightboxPrevBtn.addEventListener("click", () => stepLightbox(-1));
  if (lightboxNextBtn) lightboxNextBtn.addEventListener("click", () => stepLightbox(1));

  if (lightboxFavBtn) {
    lightboxFavBtn.addEventListener("click", () => {
      const photo = currentLightboxList[currentLightboxIndex];
      if (!photo) return;
      photo.isFavorite = !photo.isFavorite;
      if (photo.isFavorite && !photo.categories.includes("favorites")) {
        photo.categories.push("favorites");
      } else if (!photo.isFavorite) {
        photo.categories = photo.categories.filter((c) => c !== "favorites");
      }
      const favIds = CONFIG.photos.filter((p) => p.isFavorite).map((p) => p.id);
      try {
        localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(favIds));
      } catch (e) {}
      updateLightboxContent();
      renderFavoritesSection();
      syncFiltersAndRender(false);
    });
  }

  // Клавиатурна навигация (Escape, ArrowLeft, ArrowRight, Tab trap)
  window.addEventListener("keydown", (e) => {
    if (!lightboxModal || lightboxModal.classList.contains("hidden")) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeLightbox();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      stepLightbox(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      stepLightbox(1);
    }
  });

  // Swipe поддръжка за мобилни екрани
  let touchStartX = 0;
  let touchStartY = 0;
  if (lightboxSwipeArea) {
    lightboxSwipeArea.addEventListener(
      "touchstart",
      (e) => {
        if (!e.touches[0]) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      },
      { passive: true }
    );

    lightboxSwipeArea.addEventListener(
      "touchend",
      (e) => {
        if (!e.changedTouches[0]) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) stepLightbox(1);
          else stepLightbox(-1);
        }
      },
      { passive: true }
    );
  }

  // Връзване на статичните елементи с data-lightbox-id
  document.querySelectorAll("[data-lightbox-id]").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-lightbox-id");
      openLightboxById(id, CONFIG.photos);
    });
  });

  // ==========================================================================
  // 8. ИНТЕРАКТИВЕН ТЕКСТОВ ПОРТРЕТ (LILY HOME) В „НЕЙНИЯТ СВЯТ“
  // ==========================================================================

  const portraitStage = document.getElementById("portraitStage");
  const founderImg = document.getElementById("founderSourceImg");
  const typoCanvas = document.getElementById("typoPortraitCanvas");
  const pmodePills = document.querySelectorAll(".pmode-pill");

  if (portraitStage && founderImg && typoCanvas) {
    const ctx = typoCanvas.getContext("2d");
    const phrase = "LILYHOME•ЛЮБОВ•СЕМЕЙСТВО•";
    let charCells = [];
    let canvasW = 0;
    let canvasH = 0;

    function buildTypoPortrait() {
      const rect = portraitStage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasW = Math.floor(rect.width * dpr);
      canvasH = Math.floor(rect.height * dpr);
      typoCanvas.width = canvasW;
      typoCanvas.height = canvasH;

      const offCanvas = document.createElement("canvas");
      offCanvas.width = canvasW;
      offCanvas.height = canvasH;
      const offCtx = offCanvas.getContext("2d");

      const imgW = founderImg.naturalWidth || 768;
      const imgH = founderImg.naturalHeight || 1024;
      const scale = Math.max(canvasW / imgW, canvasH / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const offsetX = (canvasW - drawW) / 2;
      const offsetY = (canvasH - drawH) * 0.25;

      offCtx.drawImage(founderImg, offsetX, offsetY, drawW, drawH);
      const imgData = offCtx.getImageData(0, 0, canvasW, canvasH).data;

      charCells = [];
      const stepX = Math.max(8, Math.floor(10 * dpr));
      const stepY = Math.max(9, Math.floor(11 * dpr));
      let cIdx = 0;

      for (let y = Math.floor(stepY / 2); y < canvasH; y += stepY) {
        for (let x = Math.floor(stepX / 2); x < canvasW; x += stepX) {
          const pIdx = (y * canvasW + x) * 4;
          const r = imgData[pIdx];
          const g = imgData[pIdx + 1];
          const b = imgData[pIdx + 2];
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

          const warmR = Math.min(255, Math.round(r * 0.72 + 216 * 0.28 + 15));
          const warmG = Math.min(255, Math.round(g * 0.72 + 183 * 0.28 + 10));
          const warmB = Math.min(255, Math.round(b * 0.72 + 134 * 0.28 + 8));

          charCells.push({
            x,
            y,
            ch: phrase[cIdx++ % phrase.length],
            lum,
            color: `rgb(${warmR},${warmG},${warmB})`,
            fontSize: Math.max(6 * dpr, (5.5 + lum * 6.5) * dpr)
          });
        }
      }

      drawTypoStatic();
    }

    function drawTypoStatic() {
      if (!charCells.length) return;
      ctx.fillStyle = "#09080b";
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 0; i < charCells.length; i++) {
        const cell = charCells[i];
        if (cell.lum < 0.06) continue;
        ctx.font = `600 ${cell.fontSize.toFixed(1)}px "Cormorant Garamond", serif`;
        ctx.fillStyle = cell.color;
        ctx.globalAlpha = Math.min(1, cell.lum * 1.15);
        ctx.fillText(cell.ch, cell.x, cell.y);
      }
      ctx.globalAlpha = 1;
    }

    if (founderImg.complete && founderImg.naturalWidth > 0) {
      buildTypoPortrait();
    } else {
      founderImg.addEventListener("load", buildTypoPortrait);
    }
    window.addEventListener("resize", buildTypoPortrait);

    portraitStage.addEventListener("mousemove", (e) => {
      if (portraitStage.getAttribute("data-mode") !== "split") return;
      const rect = portraitStage.getBoundingClientRect();
      const pct = Math.min(95, Math.max(5, ((e.clientX - rect.left) / rect.width) * 100));
      portraitStage.style.setProperty("--split-pos", `${pct.toFixed(1)}%`);
    });

    portraitStage.addEventListener(
      "touchmove",
      (e) => {
        if (portraitStage.getAttribute("data-mode") !== "split" || !e.touches[0]) return;
        const rect = portraitStage.getBoundingClientRect();
        const pct = Math.min(95, Math.max(5, ((e.touches[0].clientX - rect.left) / rect.width) * 100));
        portraitStage.style.setProperty("--split-pos", `${pct.toFixed(1)}%`);
      },
      { passive: true }
    );

    pmodePills.forEach((pill) => {
      pill.addEventListener("click", () => {
        const mode = pill.getAttribute("data-pmode");
        portraitStage.setAttribute("data-mode", mode);
        pmodePills.forEach((p) => p.classList.toggle("active", p === pill));
        if (mode === "split") {
          portraitStage.style.setProperty("--split-pos", "52%");
        }
      });
    });
  }

  // ==========================================================================
  // 9. 3D НАКЛОН (TILT), КУРСОР И ПЛАВНО ПОЯВЯВАНЕ ПРИ СКРОЛ
  // ==========================================================================

  function bind3DTiltEffects() {
    if (!window.matchMedia("(pointer: fine)").matches || isMotionPaused) return;

    document.querySelectorAll("[data-tilt-card]").forEach((card) => {
      if (card.dataset.tiltBound === "true") return;
      card.dataset.tiltBound = "true";

      card.addEventListener("mousemove", (e) => {
        if (isMotionPaused) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const pctX = (x / rect.width) * 100;
        const pctY = (y / rect.height) * 100;

        const rotateY = ((x / rect.width) - 0.5) * 7;
        const rotateX = (0.5 - (y / rect.height)) * 7;

        card.style.setProperty("--mx", `${pctX.toFixed(1)}%`);
        card.style.setProperty("--my", `${pctY.toFixed(1)}%`);
        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }

  // Scroll Reveal Observer
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
        }
      });
    },
    { threshold: 0.12 }
  );

  // Стартиране на всички динамични секции
  syncFiltersAndRender(false);
  renderFamilySection();
  renderFavoritesSection();
  initPhotoStory();
  bind3DTiltEffects();

  // ==========================================================================
  // 10. ЕЛЕМЕНТАРЕН АДМИН ПАНЕЛ ЗА СЪПРУГАТА ВИ (Работи локално + в GitHub Pages)
  // ==========================================================================

  const adminModal = document.getElementById("adminModal");
  const openAdminModalBtn = document.getElementById("openAdminModalBtn");
  const mobileOpenAdminBtn = document.getElementById("mobileOpenAdminBtn");
  const inlineOpenAdminBtn = document.getElementById("inlineOpenAdminBtn");
  const closeAdminModalBtn = document.getElementById("closeAdminModalBtn");
  const adminBackdrop = document.getElementById("adminBackdrop");

  const adminFileInput = document.getElementById("adminFileInput");
  const uploadDropzone = document.getElementById("uploadDropzone");
  const uploadPreviewsWrap = document.getElementById("uploadPreviewsWrap");
  const uploadPreviewsGrid = document.getElementById("uploadPreviewsGrid");
  const selectedFilesCount = document.getElementById("selectedFilesCount");

  const adminYearChips = document.querySelectorAll("#adminYearChips .admin-chip");
  const adminCatChips = document.querySelectorAll("#adminCategoryChips .admin-cat-chip");
  const adminPhotoTitle = document.getElementById("adminPhotoTitle");
  const adminPhotoCaption = document.getElementById("adminPhotoCaption");
  const adminSaveUploadBtn = document.getElementById("adminSaveUploadBtn");
  const adminStatusMsg = document.getElementById("adminStatusMsg");
  const adminExistingList = document.getElementById("adminExistingList");

  const ghTokenInput = document.getElementById("ghTokenInput");
  const saveGhTokenBtn = document.getElementById("saveGhTokenBtn");
  const ghTokenStatus = document.getElementById("ghTokenStatus");

  const STORAGE_KEY_GH_TOKEN = "lily_home_gh_token_v1";
  const STORAGE_KEY_LOCAL_DELETED = "lily_home_deleted_ids_v1";
  const GH_REPO = CONFIG.githubRepo || "gyursel/lily-home";

  let pendingUploads = []; // [{ fileName, imageData, focalPoint: "50% 35%" }]
  let selectedAdminYear = "2026";
  const initialBasePhotos = CONFIG.photos.map((p) => ({ ...p }));

  if (ghTokenInput) {
    ghTokenInput.value = localStorage.getItem(STORAGE_KEY_GH_TOKEN) || "";
  }
  if (saveGhTokenBtn && ghTokenInput) {
    saveGhTokenBtn.addEventListener("click", () => {
      const val = ghTokenInput.value.trim();
      if (val) {
        localStorage.setItem(STORAGE_KEY_GH_TOKEN, val);
        if (ghTokenStatus) ghTokenStatus.textContent = "✓ Ключът за синхронизация е запазен!";
      } else {
        localStorage.removeItem(STORAGE_KEY_GH_TOKEN);
        if (ghTokenStatus) ghTokenStatus.textContent = "Ключът е премахнат.";
      }
      loadServerCustomPhotos();
    });
  }

  // IndexedDB помощник за GitHub Pages (когато няма локален Python сървър или токен)
  function openPhotosIDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return resolve(null);
      const req = indexedDB.open("lily_home_uploads_db", 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("photos")) {
          db.createObjectStore("photos", { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }

  async function getIDBPhotos() {
    const db = await openPhotosIDB();
    if (!db) return [];
    return new Promise((resolve) => {
      const tx = db.transaction("photos", "readonly");
      const req = tx.objectStore("photos").getAll();
      req.onsuccess = () => {
        const list = Array.isArray(req.result) ? req.result : [];
        list.sort((a, b) => String(b.id).localeCompare(String(a.id)));
        resolve(list);
      };
      req.onerror = () => resolve([]);
    });
  }

  async function saveIDBPhoto(photoObj) {
    const db = await openPhotosIDB();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction("photos", "readwrite");
      tx.objectStore("photos").put(photoObj);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }

  async function deleteIDBPhoto(id) {
    const db = await openPhotosIDB();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction("photos", "readwrite");
      tx.objectStore("photos").delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }

  // Компресиране на големи мобилни снимки за бързо зареждане и качване
  function compressImageDataUrl(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1800;
          let w = img.naturalWidth;
          let h = img.naturalHeight;
          if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const c = canvas.getContext("2d");
          c.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.86));
        };
        img.onerror = () => resolve(ev.target.result);
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function refreshAllGalleryViews() {
    syncFiltersAndRender(false);
    renderFamilySection();
    renderFavoritesSection();
    renderAdminExistingPhotos();
  }

  const isLocalServer =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  // Зареждане на качените снимки (от локален сървър, GitHub или IndexedDB)
  async function loadServerCustomPhotos() {
    let remoteUploaded = [];
    let remoteDeleted = [];

    if (isLocalServer) {
      try {
        const res = await fetch("/api/photos", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            remoteUploaded = data.uploadedPhotos || [];
            remoteDeleted = data.deletedIds || [];
          }
        }
      } catch (err) {}
    } else {
      // Онлайн режим (GitHub Pages)
      const ghToken = localStorage.getItem(STORAGE_KEY_GH_TOKEN) || "";
      let loadedFromGhApi = false;
      if (ghToken) {
        try {
          const ghRes = await fetch(
            `https://api.github.com/repos/${GH_REPO}/contents/custom_photos.json?t=${Date.now()}`,
            {
              headers: {
                Authorization: `Bearer ${ghToken}`,
                Accept: "application/vnd.github.v3.raw"
              }
            }
          );
          if (ghRes.ok) {
            const data = await ghRes.json();
            remoteUploaded = (data.uploadedPhotos || []).map((p) => ({
              ...p,
              src: p.rawUrl || p.src
            }));
            remoteDeleted = data.deletedIds || [];
            loadedFromGhApi = true;
          }
        } catch (e) {}
      }

      if (!loadedFromGhApi) {
        try {
          const staticRes = await fetch(`custom_photos.json?t=${Date.now()}`, { cache: "no-store" });
          if (staticRes.ok) {
            const data = await staticRes.json();
            remoteUploaded = data.uploadedPhotos || [];
            remoteDeleted = data.deletedIds || [];
          }
        } catch (e) {}
      }
    }

    const idbPhotos = await getIDBPhotos();
    let localDeleted = [];
    try {
      localDeleted = JSON.parse(localStorage.getItem(STORAGE_KEY_LOCAL_DELETED) || "[]");
    } catch (e) {}

    const deletedSet = new Set([...remoteDeleted, ...localDeleted]);
    const existingIds = new Set(remoteUploaded.map((p) => p.id));
    const uniqueIdb = idbPhotos.filter((p) => !existingIds.has(p.id) && !deletedSet.has(p.id));
    const activeRemote = remoteUploaded.filter((p) => !deletedSet.has(p.id));
    const activeBase = initialBasePhotos.filter((p) => !deletedSet.has(p.id));

    CONFIG.photos = [...uniqueIdb, ...activeRemote, ...activeBase];
    refreshAllGalleryViews();
  }

  loadServerCustomPhotos();

  function openAdminModal() {
    if (!adminModal) return;
    toggleMobileMenu(false);
    renderAdminExistingPhotos();
    adminModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeAdminModal() {
    if (!adminModal) return;
    adminModal.classList.add("hidden");
    document.body.style.overflow = "";
    if (adminStatusMsg) adminStatusMsg.textContent = "";
  }

  if (openAdminModalBtn) openAdminModalBtn.addEventListener("click", openAdminModal);
  if (mobileOpenAdminBtn) mobileOpenAdminBtn.addEventListener("click", openAdminModal);
  if (inlineOpenAdminBtn) inlineOpenAdminBtn.addEventListener("click", openAdminModal);
  if (closeAdminModalBtn) closeAdminModalBtn.addEventListener("click", closeAdminModal);
  if (adminBackdrop) adminBackdrop.addEventListener("click", closeAdminModal);

  // Обработка на избрани файлове (от диалог или Drag & Drop)
  async function handleFilesSelected(fileList) {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;

    for (const file of files) {
      const compressedDataUrl = await compressImageDataUrl(file);
      pendingUploads.push({
        fileName: file.name,
        imageData: compressedDataUrl,
        focalPoint: "50% 35%"
      });
      renderUploadPreviews();
    }
  }

  if (adminFileInput) {
    adminFileInput.addEventListener("change", (e) => {
      handleFilesSelected(e.target.files);
      adminFileInput.value = "";
    });
  }

  if (uploadDropzone) {
    uploadDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadDropzone.classList.add("dragover");
    });
    uploadDropzone.addEventListener("dragleave", () => {
      uploadDropzone.classList.remove("dragover");
    });
    uploadDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadDropzone.classList.remove("dragover");
      if (e.dataTransfer && e.dataTransfer.files) {
        handleFilesSelected(e.dataTransfer.files);
      }
    });
  }

  function renderUploadPreviews() {
    if (!uploadPreviewsWrap || !uploadPreviewsGrid) return;

    if (pendingUploads.length === 0) {
      uploadPreviewsWrap.classList.add("hidden");
      if (adminSaveUploadBtn) adminSaveUploadBtn.disabled = true;
      return;
    }

    uploadPreviewsWrap.classList.remove("hidden");
    if (adminSaveUploadBtn) adminSaveUploadBtn.disabled = false;
    if (selectedFilesCount) {
      selectedFilesCount.textContent = `Избрани: ${pendingUploads.length} ${
        pendingUploads.length === 1 ? "снимка" : "снимки"
      }`;
    }

    uploadPreviewsGrid.innerHTML = "";
    pendingUploads.forEach((item, idx) => {
      const [fx, fy] = item.focalPoint.split(" ");
      const card = document.createElement("div");
      card.className = "preview-thumb-card";
      card.title = "Кликни върху лицето, за да зададеш центъра на снимката";
      card.innerHTML = `
        <img src="${item.imageData}" alt="${item.fileName}" style="object-position: ${item.focalPoint};" />
        <span class="focal-marker" style="left: ${fx}; top: ${fy};"></span>
        <button type="button" class="remove-preview-btn" title="Премахни">✕</button>
      `;

      card.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-preview-btn")) return;
        const rect = card.getBoundingClientRect();
        const px = Math.round(((e.clientX - rect.left) / rect.width) * 100);
        const py = Math.round(((e.clientY - rect.top) / rect.height) * 100);
        item.focalPoint = `${px}% ${py}%`;
        renderUploadPreviews();
      });

      const removeBtn = card.querySelector(".remove-preview-btn");
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        pendingUploads.splice(idx, 1);
        renderUploadPreviews();
      });

      uploadPreviewsGrid.appendChild(card);
    });
  }

  adminYearChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      selectedAdminYear = chip.getAttribute("data-admin-year");
      adminYearChips.forEach((c) => c.classList.toggle("active", c === chip));
    });
  });

  adminCatChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("active");
    });
  });

  // Качване директно в GitHub хранилището (ако е въведен GitHub Token за синхронизация между градове)
  async function uploadItemsToGitHubRepo(itemsPayload, ghToken) {
    // 1. Вземаме текущия custom_photos.json и неговото SHA
    let currentJson = { uploadedPhotos: [], deletedIds: [] };
    let jsonSha = undefined;

    const metaRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/custom_photos.json`, {
      headers: { Authorization: `Bearer ${ghToken}` }
    });
    if (metaRes.ok) {
      const meta = await metaRes.json();
      jsonSha = meta.sha;
      try {
        const decoded = decodeURIComponent(escape(atob(meta.content.replace(/\n/g, ""))));
        currentJson = JSON.parse(decoded);
      } catch (e) {}
    }

    for (let i = 0; i < itemsPayload.length; i++) {
      const item = itemsPayload[i];
      const b64Content = item.imageData.split(",")[1];
      const ts = Date.now() + i;
      const filePath = `uploads/${ts}_lily.jpg`;

      const upRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${filePath}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${ghToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `Add family photo ${ts}`,
          content: b64Content
        })
      });
      if (!upRes.ok) throw new Error("GitHub upload failed");

      const dateLabel =
        item.year === "unspecified" ? "Без посочена година" : `${item.year} г.`;
      const entry = {
        id: `gh-${ts}`,
        src: filePath,
        rawUrl: `https://raw.githubusercontent.com/${GH_REPO}/main/${filePath}`,
        title: item.title,
        caption: item.caption,
        year: item.year,
        dateLabel,
        categories: item.categories,
        isFamily: item.categories.includes("family"),
        isFavorite: item.categories.includes("favorites"),
        focalPoint: item.focalPoint,
        aspectRatio: "3/4",
        gridSpan: "normal",
        isCustomUpload: true
      };
      currentJson.uploadedPhotos.unshift(entry);
    }

    const updatedStr = JSON.stringify(currentJson, null, 2);
    const encodedJson = btoa(unescape(encodeURIComponent(updatedStr)));

    const updateBody = {
      message: "Update custom_photos.json",
      content: encodedJson
    };
    if (jsonSha) updateBody.sha = jsonSha;

    const putJsonRes = await fetch(
      `https://api.github.com/repos/${GH_REPO}/contents/custom_photos.json`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${ghToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updateBody)
      }
    );
    if (!putJsonRes.ok) throw new Error("GitHub JSON update failed");
  }

  // Запазване на новите снимки
  if (adminSaveUploadBtn) {
    adminSaveUploadBtn.addEventListener("click", async () => {
      if (!pendingUploads.length) return;

      const chosenCategories = Array.from(adminCatChips)
        .filter((c) => c.classList.contains("active"))
        .map((c) => c.getAttribute("data-admin-cat"));

      if (chosenCategories.length === 0) {
        chosenCategories.push("special");
      }

      const customTitle = adminPhotoTitle ? adminPhotoTitle.value.trim() : "";
      const customCaption = adminPhotoCaption ? adminPhotoCaption.value.trim() : "";

      adminSaveUploadBtn.disabled = true;
      adminSaveUploadBtn.innerHTML = "<span>Запазване...</span>";

      const itemsPayload = pendingUploads.map((u, i) => ({
        fileName: u.fileName,
        imageData: u.imageData,
        focalPoint: u.focalPoint,
        year: selectedAdminYear,
        categories: [...chosenCategories],
        title:
          customTitle && pendingUploads.length > 1
            ? `${customTitle} (${i + 1})`
            : customTitle || "Нов спомен",
        caption: customCaption || "Красив момент от нашия семеен албум."
      }));

      try {
        const ghToken = localStorage.getItem(STORAGE_KEY_GH_TOKEN) || "";

        if (isLocalServer) {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: itemsPayload })
          });
          const data = await res.json();
          if (!data.ok) throw new Error("Local upload failed");
          if (adminStatusMsg) {
            adminStatusMsg.textContent = "✓ Снимките са качени успешно в албумите!";
          }
        } else if (ghToken) {
          await uploadItemsToGitHubRepo(itemsPayload, ghToken);
          if (adminStatusMsg) {
            adminStatusMsg.textContent =
              "✓ Снимките са качени в GitHub и са видими за всички устройства!";
          }
        } else {
          // Запазване в IndexedDB на устройството (работи мигновено в GitHub Pages без сървър)
          for (let i = 0; i < itemsPayload.length; i++) {
            const it = itemsPayload[i];
            const ts = Date.now() + i;
            await saveIDBPhoto({
              id: `idb-${ts}`,
              src: it.imageData,
              title: it.title,
              caption: it.caption,
              year: it.year,
              dateLabel: it.year === "unspecified" ? "Без посочена година" : `${it.year} г.`,
              categories: it.categories,
              isFamily: it.categories.includes("family"),
              isFavorite: it.categories.includes("favorites"),
              focalPoint: it.focalPoint,
              aspectRatio: "3/4",
              gridSpan: "normal",
              isCustomUpload: true
            });
          }
          if (adminStatusMsg) {
            adminStatusMsg.textContent = "✓ Снимките са запазени успешно в албумите!";
          }
        }

        pendingUploads = [];
        if (adminPhotoTitle) adminPhotoTitle.value = "";
        if (adminPhotoCaption) adminPhotoCaption.value = "";
        renderUploadPreviews();
        await loadServerCustomPhotos();
      } catch (err) {
        if (adminStatusMsg) {
          adminStatusMsg.textContent = "Грешка при запазване. Проверете връзката или ключа.";
        }
      } finally {
        adminSaveUploadBtn.innerHTML = "<span>✦ Запази снимките в сайта</span>";
        adminSaveUploadBtn.disabled = pendingUploads.length === 0;
      }
    });
  }

  // Списък с всички налични снимки в Админ Панела с бутон „Изтрий“
  function renderAdminExistingPhotos() {
    if (!adminExistingList) return;
    adminExistingList.innerHTML = "";

    CONFIG.photos.forEach((photo) => {
      const row = document.createElement("div");
      row.className = "admin-existing-item";
      row.innerHTML = `
        <img src="${photo.src}" alt="${photo.title}" loading="lazy" style="object-position: ${photo.focalPoint || "50% 35%"};" />
        <div class="admin-existing-info">
          <div class="admin-existing-title">${photo.title}</div>
          <div class="admin-existing-meta">${photo.dateLabel}</div>
        </div>
        <button type="button" class="admin-delete-photo-btn" title="Премахни снимката от сайта">Изтрий</button>
      `;

      const delBtn = row.querySelector(".admin-delete-photo-btn");
      delBtn.addEventListener("click", async () => {
        if (isLocalServer) {
          try {
            await fetch("/api/delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: photo.id })
            });
          } catch (err) {}
        } else {
          if (String(photo.id).startsWith("idb-")) {
            await deleteIDBPhoto(photo.id);
          } else {
            let localDel = [];
            try {
              localDel = JSON.parse(localStorage.getItem(STORAGE_KEY_LOCAL_DELETED) || "[]");
            } catch (e) {}
            if (!localDel.includes(photo.id)) localDel.push(photo.id);
            localStorage.setItem(STORAGE_KEY_LOCAL_DELETED, JSON.stringify(localDel));
          }
        }
        await loadServerCustomPhotos();
      });

      adminExistingList.appendChild(row);
    });
  }

  document.querySelectorAll(".reveal-on-scroll").forEach((el) => revealObserver.observe(el));

  // Деликатен курсор на десктоп
  const cursorDot = document.getElementById("cursorDot");
  const cursorRing = document.getElementById("cursorRing");
  if (cursorDot && cursorRing && window.matchMedia("(pointer: fine)").matches) {
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      cursorDot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });

    function loopCursor() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      cursorRing.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loopCursor);
    }
    requestAnimationFrame(loopCursor);
  }
});
