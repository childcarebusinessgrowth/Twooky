(function () {
  var VISIBLE_MS = 5000
  var GAP_MS = 600

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
      ".twooki-spw{position:fixed;left:20px;bottom:20px;z-index:2147483000;width:min(540px,calc(100vw - 28px));background:linear-gradient(165deg,#ffffff 0%,#f8fbff 100%);color:#1f2937;border:1px solid rgba(32,62,104,.24);border-radius:20px;box-shadow:0 22px 48px rgba(2,6,23,.22),0 2px 12px rgba(32,62,104,.12);padding:14px;transform:translateY(120%);opacity:0;transition:transform .34s cubic-bezier(.2,.8,.2,1),opacity .3s ease,box-shadow .24s ease;border-left:4px solid #203e68;font-family:var(--font-sans,var(--font-dm-sans,'DM Sans',ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif));cursor:pointer}.twooki-spw.twooki-spw-show{transform:translateY(0);opacity:1}.twooki-spw:hover{box-shadow:0 26px 56px rgba(2,6,23,.24),0 4px 16px rgba(32,62,104,.16)}.twooki-spw:focus-visible{outline:3px solid rgba(32,62,104,.32);outline-offset:2px}.twooki-spw-card{position:relative;display:flex;gap:14px;align-items:flex-start}.twooki-spw-close{position:absolute;top:-7px;right:-5px;width:30px;height:30px;border-radius:999px;border:1px solid rgba(100,116,139,.35);background:rgba(255,255,255,.94);color:#64748b;font-size:18px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s ease}.twooki-spw-close:hover{background:#fff;color:#203e68;border-color:rgba(32,62,104,.34)}.twooki-spw-close:focus-visible{outline:3px solid rgba(32,62,104,.25);outline-offset:1px}.twooki-spw-avatar-wrap{width:112px;height:112px;flex:none;border-radius:14px;overflow:hidden;background:#d9dee7;box-shadow:inset 0 0 0 1px rgba(255,255,255,.3),0 6px 18px rgba(32,62,104,.15)}.twooki-spw-avatar,.twooki-spw-avatar-video{width:100%;height:100%;display:block;object-fit:cover}.twooki-spw-avatar-video{background:#000}.twooki-spw-content{min-width:0;flex:1;padding-right:18px}.twooki-spw-author{font-size:26px;line-height:1.06;color:#1e293b;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.01em}.twooki-spw-stars{display:flex;gap:2px;color:#F9BB11;font-size:32px;line-height:1;margin:2px 0 6px;text-shadow:0 1px 0 rgba(0,0,0,.05)}.twooki-spw-text{color:#334155;line-height:1.46;font-size:18px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.twooki-spw-footer{margin-top:12px;display:flex;justify-content:flex-end}.twooki-spw-verified{font-size:12px;color:#203e68;background:#F9BB11;border:1px solid rgba(249,187,17,.35);border-radius:999px;padding:6px 12px;font-weight:700;letter-spacing:.01em}.twooki-spw-modal-backdrop{position:fixed;inset:0;z-index:2147483001;background:rgba(15,23,42,.66);backdrop-filter:blur(2px);display:none;align-items:center;justify-content:center;padding:18px}.twooki-spw-modal-backdrop.twooki-spw-modal-show{display:flex}.twooki-spw-modal{position:relative;width:min(530px,calc(100vw - 28px));max-height:calc(100vh - 28px);overflow:auto;background:linear-gradient(180deg,#ffffff 0%,#f8fbff 100%);border-radius:18px;border:1px solid rgba(32,62,104,.2);box-shadow:0 30px 72px rgba(2,6,23,.46)}.twooki-spw-modal-close{position:absolute;top:12px;right:12px;border:1px solid rgba(100,116,139,.36);background:rgba(255,255,255,.96);color:#64748b;font-size:24px;line-height:1;width:34px;height:34px;border-radius:999px;cursor:pointer;z-index:3;display:flex;align-items:center;justify-content:center;transition:all .2s ease}.twooki-spw-modal-close:hover{color:#203e68;border-color:rgba(32,62,104,.34)}.twooki-spw-modal-close:focus-visible{outline:3px solid rgba(32,62,104,.24);outline-offset:1px}.twooki-spw-modal-body{padding:22px 24px 24px}.twooki-spw-modal-title{font-size:34px;line-height:1.04;color:#1e293b;font-weight:700;letter-spacing:-.015em;padding-right:42px}.twooki-spw-modal-subtitle{font-size:13px;color:#516178;margin-top:4px;font-weight:600;letter-spacing:.02em;text-transform:uppercase}.twooki-spw-modal-stars{display:flex;gap:2px;color:#F9BB11;font-size:35px;line-height:1;margin:12px 0 10px}.twooki-spw-modal-feature-media{margin:12px 0 14px}.twooki-spw-modal-feature-video,.twooki-spw-modal-feature-image{width:100%;max-height:336px;border-radius:12px;display:block;box-shadow:0 10px 28px rgba(2,6,23,.2)}.twooki-spw-modal-feature-video{background:#000}.twooki-spw-modal-feature-image{object-fit:cover;background:#e5e7eb}.twooki-spw-modal-text{font-size:16px;line-height:1.7;color:#334155;background:rgba(255,255,255,.66);border:1px solid rgba(226,232,240,.9);padding:14px 14px 13px;border-radius:12px}.twooki-spw-modal-row{margin-top:16px;display:flex;justify-content:flex-end}.twooki-spw-modal-verified{border:0;background:#F9BB11;color:#203e68;padding:11px 16px;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 8px 22px rgba(249,187,17,.34);transition:all .2s ease}.twooki-spw-modal-verified:hover{background:#efb30d;transform:translateY(-1px)}.twooki-spw-modal-verified:focus-visible{outline:3px solid rgba(32,62,104,.24);outline-offset:2px}@media (max-width:640px){.twooki-spw{left:12px;right:12px;width:auto;bottom:12px;padding:11px;border-radius:16px}.twooki-spw-card{gap:10px}.twooki-spw-avatar-wrap{width:82px;height:82px;border-radius:11px}.twooki-spw-content{padding-right:8px}.twooki-spw-author{font-size:22px}.twooki-spw-stars{font-size:24px;margin-top:1px}.twooki-spw-text{font-size:15px;-webkit-line-clamp:3;line-height:1.42}.twooki-spw-footer{margin-top:8px}.twooki-spw-verified{font-size:11px;padding:5px 10px}.twooki-spw-modal{border-radius:14px}.twooki-spw-modal-body{padding:16px}.twooki-spw-modal-title{font-size:30px;line-height:1.02}.twooki-spw-modal-subtitle{font-size:11px}.twooki-spw-modal-stars{font-size:28px;margin:8px 0 8px}.twooki-spw-modal-feature-video,.twooki-spw-modal-feature-image{max-height:260px}.twooki-spw-modal-text{font-size:15px;padding:12px}}@media (prefers-reduced-motion:reduce){.twooki-spw,.twooki-spw-close,.twooki-spw-modal-close,.twooki-spw-modal-verified{transition:none!important}}"
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
      '<div class="twooki-spw-author"></div>' +
      '<div class="twooki-spw-stars"></div>' +
      '<div class="twooki-spw-text"></div>' +
      '<div class="twooki-spw-footer"><span class="twooki-spw-verified">Verified by Twooky</span></div>' +
      "</div></div>"

    var modalBackdrop = document.createElement("div")
    modalBackdrop.id = containerId + "-modal"
    modalBackdrop.className = "twooki-spw-modal-backdrop"
    modalBackdrop.innerHTML =
      '<div class="twooki-spw-modal" role="dialog" aria-modal="true" aria-label="Social proof details">' +
      '<button type="button" class="twooki-spw-modal-close" aria-label="Close">×</button>' +
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

        function stopVideoPlayback(root) {
          if (!root) return
          var videos = root.querySelectorAll("video")
          for (var i = 0; i < videos.length; i++) {
            var video = videos[i]
            try {
              video.pause()
              video.currentTime = 0
            } catch (error) {
              // Some browsers block currentTime updates until metadata loads.
            }
          }
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
          cardAuthor.textContent = item.authorName || "Happy Parent"
          cardText.innerHTML = "&ldquo;" + escapeHtml(item.content || "") + "&rdquo;"
        }

        function openProfileNewTab() {
          window.open(profileHref, "_blank", "noopener,noreferrer")
        }

        function closeModal() {
          if (!modalOpen) return
          modalOpen = false
          stopVideoPlayback(modalBackdrop)
          modalBackdrop.classList.remove("twooki-spw-modal-show")
          clearTimers()
          loopTimer = setTimeout(function () {
            cycle()
          }, 200)
        }

        function openModal(item) {
          modalOpen = true
          modalBody.innerHTML = ""

          var providerName = payload.providerName || "Twooky Customer"

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
            '<div class="twooki-spw-modal-profile">' +
            '<div class="twooki-spw-modal-title">' +
            escapeHtml(item.authorName || providerName) +
            '</div><div class="twooki-spw-modal-subtitle">Verified review for ' +
            escapeHtml(providerName) +
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
            }, GAP_MS)
          }, VISIBLE_MS)
        }

        function dismissForSession(event) {
          event.preventDefault()
          event.stopPropagation()
          dismissed = true
          clearTimers()
          stopVideoPlayback(card)
          stopVideoPlayback(modalBackdrop)
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
