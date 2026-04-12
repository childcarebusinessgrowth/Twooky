(function () {
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

  if (!document.getElementById(stylesId)) {
    var styleEl = document.createElement("style")
    styleEl.id = stylesId
    styleEl.textContent =
      ".twooki-spw{position:fixed;left:24px;bottom:24px;z-index:2147483000;width:min(460px,calc(100vw - 32px));background:#fff;color:#1f2937;border:1px solid rgba(15,23,42,.12);border-radius:16px;box-shadow:0 14px 40px rgba(2,6,23,.28);padding:14px;transform:translateY(120%);opacity:0;transition:transform .35s ease,opacity .35s ease;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;cursor:pointer}.twooki-spw.twooki-spw-show{transform:translateY(0);opacity:1}.twooki-spw-body{display:flex;gap:12px;align-items:flex-start}.twooki-spw-avatar{flex:none;width:98px;height:98px;border-radius:12px;object-fit:cover;background:#e5e7eb}.twooki-spw-content{min-width:0;flex:1}.twooki-spw-stars{display:flex;gap:2px;color:#f97316;font-size:22px;line-height:1;margin-bottom:8px}.twooki-spw-text{font-size:32px;color:#111827;line-height:1.35;font-size:17px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.twooki-spw-author{margin-top:8px;font-size:14px;color:#6b7280}.twooki-spw-footer{margin-top:8px;display:flex;justify-content:space-between;align-items:center;gap:8px}.twooki-spw-verified{font-size:12px;color:#4b5563;font-weight:600}.twooki-spw-badge{font-size:11px;color:#4b5563;background:#f3f4f6;border-radius:999px;padding:3px 9px}"
    document.head.appendChild(styleEl)
  }

  function renderStars(value) {
    if (!value) return ""
    var stars = ""
    for (var i = 0; i < 5; i++) {
      stars += i < value ? "★" : "☆"
    }
    return '<div class="twooki-spw-stars" aria-label="Rating ' + value + ' out of 5">' + stars + "</div>"
  }

  function buildAvatar(item) {
    if (item.imageUrl) return item.imageUrl
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='100%25' height='100%25' fill='%23374151'/%3E%3Ctext x='50%25' y='55%25' fill='white' font-size='28' text-anchor='middle' font-family='Arial'%3E%E2%98%85%3C/text%3E%3C/svg%3E"
  }

  function createOrGetContainer() {
    var existing = document.getElementById(containerId)
    if (existing) return existing
    if (!document.body) return null
    var el = document.createElement("div")
    el.id = containerId
    el.className = "twooki-spw"
    el.setAttribute("role", "button")
    el.setAttribute("tabindex", "0")
    document.body.appendChild(el)
    return el
  }

  fetch(apiUrl, { credentials: "omit" })
    .then(function (response) {
      if (!response.ok) throw new Error("Request failed")
      return response.json()
    })
    .then(function (payload) {
      if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) return

      var items = payload.items
      var profileHref = apiBase + payload.profileUrl
      var container = null
      var eventsBound = false
      var index = 0
      var hideTimeout = null
      var cycleTimeout = null

      function openProfile() {
        window.open(profileHref, "_blank", "noopener,noreferrer")
      }

      function bindEvents() {
        if (!container || eventsBound) return
        eventsBound = true
        container.addEventListener("click", openProfile)
        container.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            openProfile()
          }
        })
      }

      function showItem(item) {
        if (!container) {
          container = createOrGetContainer()
          if (!container) return
          bindEvents()
        }
        container.innerHTML =
          '<div class="twooki-spw-body">' +
          '<img class="twooki-spw-avatar" src="' +
          buildAvatar(item) +
          '" alt="Social proof" loading="lazy" />' +
          '<div class="twooki-spw-content">' +
          renderStars(item.rating) +
          '<div class="twooki-spw-text">&ldquo;' +
          String(item.content || "").replace(/</g, "&lt;").replace(/>/g, "&gt;") +
          "&rdquo;</div>" +
          (item.authorName ? '<div class="twooki-spw-author">' + item.authorName + "</div>" : "") +
          '<div class="twooki-spw-footer"><span class="twooki-spw-verified">Verified by Twooki</span><span class="twooki-spw-badge">' +
          (item.type === "video" ? "Video" : "Testimonial") +
          "</span></div>" +
          "</div></div>"

        container.classList.add("twooki-spw-show")

        if (hideTimeout) clearTimeout(hideTimeout)
        if (cycleTimeout) clearTimeout(cycleTimeout)

        hideTimeout = setTimeout(function () {
          container.classList.remove("twooki-spw-show")
        }, 5200)
        cycleTimeout = setTimeout(function () {
          index = (index + 1) % items.length
          showItem(items[index])
        }, 7600)
      }

      setTimeout(function () {
        showItem(items[index])
      }, 800)
    })
    .catch(function () {
      // Silent fail: widget should never break host site.
    })
})()
