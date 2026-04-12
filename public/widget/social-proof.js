(function () {
  var SHOW_MS = 9000
  var HIDE_MS = 6600

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
  var logoUrl = apiBase + "/images/twooky-logo.png"

  var stylesId = "twooki-spw-styles"
  var containerId = "twooki-spw-container"
  var sessionDismissKey = "twooki-spw-dismissed:" + provider

  if (!document.getElementById(stylesId)) {
    var styleEl = document.createElement("style")
    styleEl.id = stylesId
    styleEl.textContent =
      ".twooki-spw{position:fixed;left:20px;bottom:20px;z-index:2147483000;width:min(520px,calc(100vw - 32px));background:#fff;color:#1f2937;border:1px solid rgba(15,23,42,.12);border-radius:18px;box-shadow:0 18px 45px rgba(2,6,23,.24);padding:12px;transform:translateY(120%);opacity:0;transition:transform .28s ease,opacity .28s ease;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;cursor:pointer}.twooki-spw.twooki-spw-show{transform:translateY(0);opacity:1}.twooki-spw-card{position:relative;display:flex;gap:12px;align-items:flex-start}.twooki-spw-close{position:absolute;top:-6px;right:-4px;width:28px;height:28px;border-radius:999px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;font-size:18px;line-height:1;cursor:pointer}.twooki-spw-close:hover{color:#111827}.twooki-spw-avatar-wrap{width:106px;height:106px;flex:none;border-radius:13px;overflow:hidden;background:#e5e7eb}.twooki-spw-avatar,.twooki-spw-avatar-video{width:100%;height:100%;display:block;object-fit:cover}.twooki-spw-avatar-video{background:#000}.twooki-spw-content{min-width:0;flex:1;padding-right:18px}.twooki-spw-stars{display:flex;gap:2px;color:#f97316;font-size:30px;line-height:1;margin-bottom:6px}.twooki-spw-text{color:#111827;line-height:1.35;font-size:17px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.twooki-spw-author{margin-top:7px;font-size:14px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.twooki-spw-footer{margin-top:10px;display:flex;justify-content:flex-end}.twooki-spw-verified{font-size:12px;color:#5b21b6;background:#ede9fe;border:1px solid #ddd6fe;border-radius:999px;padding:4px 10px;font-weight:700}.twooki-spw-modal-backdrop{position:fixed;inset:0;z-index:2147483001;background:rgba(15,23,42,.58);display:none;align-items:center;justify-content:center;padding:20px}.twooki-spw-modal-backdrop.twooki-spw-modal-show{display:flex}.twooki-spw-modal{position:relative;width:min(510px,calc(100vw - 40px));max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:14px;border:1px solid rgba(15,23,42,.12);box-shadow:0 24px 70px rgba(2,6,23,.45)}.twooki-spw-modal-close{position:absolute;top:12px;right:14px;border:0;background:transparent;color:#fff;font-size:36px;line-height:1;cursor:pointer;z-index:3}.twooki-spw-modal-head{height:84px;background:linear-gradient(135deg,#a855f7,#8b5cf6)}.twooki-spw-modal-body{padding:0 24px 22px}.twooki-spw-modal-avatar-wrap{margin-top:-42px}.twooki-spw-modal-avatar,.twooki-spw-modal-avatar-video{width:84px;height:84px;border-radius:999px;object-fit:cover;border:4px solid #fff;background:#e5e7eb;box-shadow:0 8px 22px rgba(2,6,23,.25);display:block}.twooki-spw-modal-avatar-video{background:#000}.twooki-spw-modal-title{font-size:18px;line-height:1.3;color:#111827;font-weight:700;margin-top:10px}.twooki-spw-modal-author{font-size:14px;color:#64748b;margin-top:3px}.twooki-spw-modal-stars{display:flex;gap:2px;color:#f97316;font-size:34px;line-height:1;margin:10px 0 8px}.twooki-spw-modal-feature-media{margin:14px 0 12px}.twooki-spw-modal-feature-video,.twooki-spw-modal-feature-image{width:100%;max-height:320px;border-radius:10px;display:block}.twooki-spw-modal-feature-video{background:#000}.twooki-spw-modal-feature-image{object-fit:cover;background:#e5e7eb}.twooki-spw-modal-text{font-size:16px;line-height:1.56;color:#374151}.twooki-spw-modal-row{margin-top:16px;display:flex;justify-content:flex-start}.twooki-spw-modal-verified{border:0;background:#111827;color:#fff;padding:11px 16px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer}.twooki-spw-modal-verified:hover{background:#1f2937}@media (max-width:640px){.twooki-spw-avatar-wrap{width:84px;height:84px}.twooki-spw-content{padding-right:10px}.twooki-spw-stars{font-size:25px}.twooki-spw-text{font-size:15px}.twooki-spw-modal-body{padding:0 16px 18px}}"
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
      '<div class="twooki-spw-avatar-wrap"></div>' +
      '<div class="twooki-spw-content">' +
      '<div class="twooki-spw-stars"></div>' +
      '<div class="twooki-spw-text"></div>' +
      '<div class="twooki-spw-author"></div>' +
      '<div class="twooki-spw-footer"><span class="twooki-spw-verified">Verified by Twooky</span></div>' +
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
        var cardAvatarWrap = card.querySelector(".twooki-spw-avatar-wrap")
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
          if (item.type === "video" && item.videoUrl) {
            cardAvatarWrap.innerHTML =
              '<video class="twooki-spw-avatar-video" src="' +
              escapeHtml(item.videoUrl) +
              '" muted autoplay loop playsinline preload="metadata"' +
              (item.imageUrl ? ' poster="' + escapeHtml(item.imageUrl) + '"' : "") +
              "></video>"
          } else {
            cardAvatarWrap.innerHTML =
              '<img class="twooki-spw-avatar" src="' +
              escapeHtml(buildAvatar(item)) +
              '" alt="Social proof" loading="lazy" />'
          }
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

          var providerName = payload.providerName || "Twooky Customer"

          var avatarMediaHtml =
            '<img class="twooki-spw-modal-avatar" src="' +
            escapeHtml(logoUrl) +
            '" alt="Twooky logo" loading="lazy" />'
          var featureMediaHtml = ""
          if (item.type === "video" && item.videoUrl) {
            featureMediaHtml =
              '<div class="twooki-spw-modal-feature-media"><video class="twooki-spw-modal-feature-video" src="' +
              escapeHtml(item.videoUrl) +
              '" controls playsinline preload="metadata"' +
              (item.imageUrl ? ' poster="' + escapeHtml(item.imageUrl) + '"' : "") +
              "></video></div>"
          } else if (item.type === "image") {
            featureMediaHtml =
              '<div class="twooki-spw-modal-feature-media"><img class="twooki-spw-modal-feature-image" src="' +
              escapeHtml(buildAvatar(item)) +
              '" alt="Social proof image" loading="lazy" /></div>'
          }

          modalBody.innerHTML =
            '<div class="twooki-spw-modal-avatar-wrap">' +
            avatarMediaHtml +
            "</div>" +
            '<div class="twooki-spw-modal-profile">' +
            '<div class="twooki-spw-modal-title">' +
            escapeHtml(item.authorName || providerName) +
            "</div></div>" +
            renderModalStars(item.rating) +
            featureMediaHtml +
            '<div class="twooki-spw-modal-text">&ldquo;' +
            escapeHtml(item.content || "") +
            "&rdquo;</div>" +
            '<div class="twooki-spw-modal-row"><button type="button" class="twooki-spw-modal-verified">Verified by Twooky</button></div>'

          var modalVerified = modalBody.querySelector(".twooki-spw-modal-verified")
          if (modalVerified) {
            modalVerified.addEventListener("click", function () {
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
