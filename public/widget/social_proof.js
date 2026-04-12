(function () {
  var current = document.currentScript
  if (!current) return
  var bridge = document.createElement("script")
  var scriptUrl = new URL(current.src, window.location.href)
  bridge.src = scriptUrl.origin + "/widget/social-proof.js"
  var provider = current.getAttribute("data-provider")
  var providerId = current.getAttribute("data-provider-id")
  if (provider) bridge.setAttribute("data-provider", provider)
  if (providerId) bridge.setAttribute("data-provider-id", providerId)
  document.head.appendChild(bridge)
})()
