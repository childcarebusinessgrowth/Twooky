(function () {
  var SHOW_MS = 3000
  var HIDE_MS = 2200

  function resolveScriptElement() {
    if (document.currentScript) return document.currentScript
    var scripts = document.getElementsByTagName("script")
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].getAttribute("src") || ""
      if (src.indexOf("/widget/social-proof.js") !== -1 || src.indexOf("/widget/social_proof.js") !== -1) {
        return scripts[i]
      }
    }
    return null
  }

  var scriptEl = resolveScriptElement()
  if (!scriptEl) return

  var provider = (scriptEl.getAttribute("data-provider-id") || scriptEl.getAttribute("data-provider") || "").trim()
  if (!provider) return

  var scriptUrl = new URL(scriptEl.src, window.location.href)
  var apiBase = scriptUrl.origin
  var apiUrl = apiBase + "/api/social-proof?provider=" + encodeURIComponent(provider)

  var stylesId = "twooki-spw-styles"
  var containerId = "twooki-spw-container"
  var sessionDismissKey = "twooki-spw-dismissed:" + provider

  if (!document.getElementById(stylesId)) {
    var styleEl = document.createElement("style")
    styleEl.id = stylesId
    styleEl.textContent =
      ".twooki-spw{position:fixed;left:20px;bottom:20px;z-index:2147483000;width:min(520px,calc(100vw - 32px));background:#fff;color:#1f2937;border:1px solid rgba(15,23,42,.12);border-radius:18px;box-shadow:0 18px 45px rgba(2,6,23,.24);padding:12px;transform:translateY(120%);opacity:0;transition:transform .28s ease,opacity .28s ease;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;cursor:pointer}.twooki-spw.twooki-spw-show{transform:translateY(0);opacity:1}.twooki-spw-card{position:relative;display:flex;gap:12px;align-items:flex-start}.twooki-spw-close{position:absolute;top:-6px;right:-4px;width:28px;height:28px;border-radius:999px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;font-size:18px;line-height:1;cursor:pointer}.twooki-spw-close:hover{color:#111827}.twooki-spw-avatar{flex:none;width:106px;height:106px;border-radius:13px;object-fit:cover;background:#e5e7eb}.twooki-spw-content{min-width:0;flex:1;padding-right:18px}.twooki-spw-stars{display:flex;gap:2px;color:#f97316;font-size:30px;line-height:1;margin-bottom:6px}.twooki-spw-text{color:#111827;line-height:1.35;font-size:17px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.twooki-spw-author{margin-top:7px;font-size:14px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.twooki-spw-footer{margin-top:10px;display:flex;justify-content:flex-end}.twooki-spw-verified{font-size:12px;color:#5b21b6;background:#ede9fe;border:1px solid #ddd6fe;border-radius:999px;padding:4px 10px;font-weight:700}.twooki-spw-modal-backdrop{position:fixed;inset:0;z-index:2147483001;background:rgba(15,23,42,.58);display:none;align-items:center;justify-content:center;padding:20px}.twooki-spw-modal-backdrop.twooki-spw-modal-show{display:flex}.twooki-spw-modal{position:relative;width:min(680px,calc(100vw - 40px));max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:16px;border:1px solid rgba(15,23,42,.12);box-shadow:0 24px 70px rgba(2,6,23,.45)}.twooki-spw-modal-head{padding:18px 18px 0}.twooki-spw-modal-close{position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:999px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;font-size:20px;line-height:1;cursor:pointer}.twooki-spw-modal-body{padding:18px;display:grid;grid-template-columns:140px 1fr;gap:16px}.twooki-spw-modal-media{width:140px;height:140px;border-radius:12px;object-fit:cover;background:#e5e7eb}.twooki-spw-modal-video{width:100%;border-radius:12px;background:#000}.twooki-spw-modal-stars{display:flex;gap:2px;color:#f97316;font-size:30px;line-height:1;margin:4px 0 8px}.twooki-spw-modal-text{font-size:16px;line-height:1.55;color:#111827}.twooki-spw-modal-author{margin-top:8px;font-size:14px;color:#6b7280}.twooki-spw-modal-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px}.twooki-spw-modal-verified{font-size:12px;color:#1d4ed8;background:#dbeafe;border:1px solid #bfdbfe;border-radius:999px;padding:4px 10px;font-weight:700}.twooki-spw-modal-cta{border:0;background:#111827;color:#fff;padding:10px 14px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer}.twooki-spw-modal-cta:hover{background:#1f2937}@media (max-width:640px){.twooki-spw-avatar{width:84px;height:84px}.twooki-spw-content{padding-right:10px}.twooki-spw-stars{font-size:25px}.twooki-spw-text{font-size:15px}.twooki-spw-modal-body{grid-template-columns:1fr}.twooki-spw-modal-media{width:100%;height:210px}}"
    document.head.appendChild(styleEl)
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
  }

  function renderStars(value) {
    if (!value) return ""
    var stars = ""
    for (var i = 0; i < 5; i++) {
      stars += i < value ? "★" : "☆"
    }
    return '<div class="twooki-spw-stars" aria-label="Rating ' + value + ' out of 5">' + stars + "</div>"
  }

  function renderModalStars(value) {
    if (!value) return ""
    var stars = ""
    for (var i = 0; i < 5; i++) {
      stars += i < value ? "★" : "☆"
    }
    return '<div class="twooki-spw-modal-stars" aria-label="Rating ' + value + ' out of 5">' + stars + "</div>"
  }

  function buildAvatar(item) {
    if (item.imageUrl) return item.imageUrl
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='56%25' fill='%236b7280' font-size='26' text-anchor='middle' font-family='Arial'%3E%F0%9F%8D%AD%3C/text%3E%3C/svg%3E"
  }

  function createUi() {
    var existingCard = document.getElementById(containerId)
    var existingModal = document.getElementById(containerId + "-modal")
    if (existingCard && existingModal) {
      return {
        card: existingCard,
        modalBackdrop: existingModal,
      }
    }
    if (!document.body) return null

    var card = document.createElement("div")
    card.id = containerId
    card.className = "twooki-spw"
    card.setAttribute("role", "button")
    card.setAttribute("tabindex", "0")
    card.innerHTML =
      '<div class="twooki-spw-card">' +
      '<button type="button" class="twooki-spw-close" aria-label="Close">×</button>' +
      '<img class="twooki-spw-avatar" alt="Social proof" loading="lazy" />' +
      '<div class="twooki-spw-content">' +
      '<div class="twooki-spw-stars"></div>' +
      '<div class="twooki-spw-text"></div>' +
      '<div class="twooki-spw-author"></div>' +
      '<div class="twooki-spw-footer"><span class="twooki-spw-verified">Verified by Twooki</span></div>' +
      "</div></div>"

    var modalBackdrop = document.createElement("div")
    modalBackdrop.id = containerId + "-modal"
    modalBackdrop.className = "twooki-spw-modal-backdrop"
    modalBackdrop.innerHTML =
      '<div class="twooki-spw-modal" role="dialog" aria-modal="true" aria-label="Social proof details">' +
      '<button type="button" class="twooki-spw-modal-close" aria-label="Close">×</button>' +
      '<div class="twooki-spw-modal-head"></div>' +
      '<div class="twooki-spw-modal-body"></div>' +
      "</div>"

    document.body.appendChild(card)
    document.body.appendChild(modalBackdrop)

    return {
      card: card,
      modalBackdrop: modalBackdrop,
    }
  }

  function startWidget() {
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(sessionDismissKey) === "1") {
      return
    }

    fetch(apiUrl, { credentials: "omit" })
      .then(function (response) {
        if (!response.ok) throw new Error("Request failed")
        return response.json()
      })
      .then(function (payload) {
        if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) return

        var ui = createUi()
        if (!ui) return

        var card = ui.card
        var modalBackdrop = ui.modalBackdrop
        var modalHead = modalBackdrop.querySelector(".twooki-spw-modal-head")
        var modalBody = modalBackdrop.querySelector(".twooki-spw-modal-body")
        var cardImage = card.querySelector(".twooki-spw-avatar")
        var cardStars = card.querySelector(".twooki-spw-stars")
        var cardText = card.querySelector(".twooki-spw-text")
        var cardAuthor = card.querySelector(".twooki-spw-author")
        var cardClose = card.querySelector(".twooki-spw-close")
        var modalClose = modalBackdrop.querySelector(".twooki-spw-modal-close")
        var items = payload.items
        var profileHref = apiBase + payload.profileUrl
        var index = 0
        var showTimer = null
        var hideTimer = null
        var loopTimer = null
        var dismissed = false
        var modalOpen = false
        var initialized = false

        function clearTimers() {
          if (showTimer) clearTimeout(showTimer)
          if (hideTimer) clearTimeout(hideTimer)
          if (loopTimer) clearTimeout(loopTimer)
          showTimer = null
          hideTimer = null
          loopTimer = null
        }

        function renderCard(item) {
          cardImage.src = buildAvatar(item)
          cardStars.innerHTML = renderStars(item.rating)
          cardText.innerHTML = "&ldquo;" + escapeHtml(item.content || "") + "&rdquo;"
          cardAuthor.textContent = item.authorName || ""
        }

        function openProfileNewTab() {
          window.open(profileHref, "_blank", "noopener,noreferrer")
        }

        function closeModal() {
          if (!modalOpen) return
          modalOpen = false
          modalBackdrop.classList.remove("twooki-spw-modal-show")
          clearTimers()
          loopTimer = setTimeout(function () {
            cycle()
          }, 200)
        }

        function openModal(item) {
          modalOpen = true
          modalHead.innerHTML = ""
          modalBody.innerHTML = ""

          var head = document.createElement("div")
          head.style.height = "12px"
          modalHead.appendChild(head)

          var mediaHtml = ""
          if (item.type === "video" && item.videoUrl) {
            mediaHtml =
              '<video class="twooki-spw-modal-video" src="' +
              escapeHtml(item.videoUrl) +
              '" controls playsinline preload="metadata"' +
              (item.imageUrl ? ' poster="' + escapeHtml(item.imageUrl) + '"' : "") +
              "></video>"
          } else {
            mediaHtml =
              '<img class="twooki-spw-modal-media" src="' +
              escapeHtml(buildAvatar(item)) +
              '" alt="Social proof media" loading="lazy" />'
          }

          modalBody.innerHTML =
            '<div>' +
            mediaHtml +
            "</div>" +
            '<div class="twooki-spw-modal-copy">' +
            renderModalStars(item.rating) +
            '<div class="twooki-spw-modal-text">&ldquo;' +
            escapeHtml(item.content || "") +
            "&rdquo;</div>" +
            (item.authorName ? '<div class="twooki-spw-modal-author">' + escapeHtml(item.authorName) + "</div>" : "") +
            '<div class="twooki-spw-modal-row"><span class="twooki-spw-modal-verified">Verified by Twooki</span><button type="button" class="twooki-spw-modal-cta">View on Twooky</button></div>' +
            "</div>"

          var modalCta = modalBody.querySelector(".twooki-spw-modal-cta")
          if (modalCta) {
            modalCta.addEventListener("click", function () {
              openProfileNewTab()
            })
          }

          modalBackdrop.classList.add("twooki-spw-modal-show")
        }

        function cycle() {
          if (dismissed || modalOpen) return
          renderCard(items[index])
          card.classList.add("twooki-spw-show")

          showTimer = setTimeout(function () {
            card.classList.remove("twooki-spw-show")
            hideTimer = setTimeout(function () {
              index = (index + 1) % items.length
              cycle()
            }, HIDE_MS)
          }, SHOW_MS)
        }

        function dismissForSession(event) {
          event.preventDefault()
          event.stopPropagation()
          dismissed = true
          clearTimers()
          card.classList.remove("twooki-spw-show")
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem(sessionDismissKey, "1")
          }
        }

        function bindEventsOnce() {
          if (initialized) return
          initialized = true

          cardClose.addEventListener("click", dismissForSession)
          card.addEventListener("click", function () {
            if (dismissed) return
            openModal(items[index])
          })
          card.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              if (!dismissed) openModal(items[index])
            }
          })

          modalClose.addEventListener("click", function (event) {
            event.preventDefault()
            closeModal()
          })
          modalBackdrop.addEventListener("click", function (event) {
            if (event.target === modalBackdrop) {
              closeModal()
            }
          })
          document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
              closeModal()
            }
          })
        }

        bindEventsOnce()
        loopTimer = setTimeout(function () {
          cycle()
        }, 500)
      })
      .catch(function () {
        // Silent fail: widget should never break host site.
      })
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startWidget, { once: true })
  } else {
    startWidget()
  }
})()
