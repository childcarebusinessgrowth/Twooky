(function () {
  var scriptEl = document.currentScript
  if (!scriptEl) return

  var provider = (scriptEl.getAttribute("data-provider") || "").trim()
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
      ".twooki-spw{position:fixed;left:16px;bottom:16px;z-index:2147483000;max-width:320px;width:calc(100vw - 32px);background:#111827;color:#fff;border-radius:14px;box-shadow:0 16px 38px rgba(0,0,0,.28);padding:12px;transform:translateY(120%);opacity:0;transition:transform .35s ease,opacity .35s ease;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;cursor:pointer}.twooki-spw.twooki-spw-show{transform:translateY(0);opacity:1}.twooki-spw-top{display:flex;gap:10px;align-items:flex-start}.twooki-spw-avatar{flex:none;width:40px;height:40px;border-radius:10px;object-fit:cover;background:#374151}.twooki-spw-stars{display:flex;gap:2px;color:#fbbf24;margin-bottom:4px;font-size:13px;line-height:1}.twooki-spw-text{font-size:13px;line-height:1.4;color:#f9fafb}.twooki-spw-author{margin-top:6px;font-size:12px;color:#d1d5db}.twooki-spw-footer{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:11px;color:#9ca3af}.twooki-spw-pill{display:inline-flex;align-items:center;border:1px solid rgba(156,163,175,.35);border-radius:999px;padding:2px 8px;background:rgba(255,255,255,.06)}"
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
      var container = createOrGetContainer()
      var index = 0
      var hideTimeout = null
      var cycleTimeout = null

      function showItem(item) {
        container.innerHTML =
          '<div class="twooki-spw-top">' +
          '<img class="twooki-spw-avatar" src="' +
          buildAvatar(item) +
          '" alt="Social proof" loading="lazy" />' +
          '<div style="min-width:0;flex:1;">' +
          renderStars(item.rating) +
          '<div class="twooki-spw-text">"' +
          String(item.content || "").replace(/</g, "&lt;").replace(/>/g, "&gt;") +
          '"</div>' +
          (item.authorName ? '<div class="twooki-spw-author">- ' + item.authorName + "</div>" : "") +
          "</div></div>" +
          '<div class="twooki-spw-footer"><span class="twooki-spw-pill">Verified by Twooki</span><span>' +
          (item.type === "video" ? "Video testimonial" : "Recent parent feedback") +
          "</span></div>"

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

      function openProfile() {
        window.open(profileHref, "_blank", "noopener,noreferrer")
      }

      container.addEventListener("click", openProfile)
      container.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          openProfile()
        }
      })

      setTimeout(function () {
        showItem(items[index])
      }, 800)
    })
    .catch(function () {
      // Silent fail: widget should never break host site.
    })
})()
