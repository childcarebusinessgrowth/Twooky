(function () {
  var current = document.currentScript
  if (!current) return
  var bridge = document.createElement("script")
  var scriptUrl = new URL(current.src, window.location.href)
  bridge.src = scriptUrl.origin + "/widget/social-proof.js"
  var provider = current.getAttribute("data-provider")
  if (provider) bridge.setAttribute("data-provider", provider)
  document.head.appendChild(bridge)
})()
