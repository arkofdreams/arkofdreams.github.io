;(function () {
  function countdown(element) {
    const date = element.getAttribute("data-date").replace(/-/g, "/")
    const to = new Date(date)
    const days = element.querySelector("span.days")
    const hours = element.querySelector("span.hours")
    const minutes = element.querySelector("span.minutes")
    const seconds = element.querySelector("span.seconds")
    setInterval(function () {
      const diff = to.getTime() - Date.now()
      if (diff < 0) {
        diff = 0
      }

      const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const diffMinutes = Math.floor((diff / (1000 * 60)) % 60)
      const diffSeconds = Math.floor((diff / 1000) % 60)

      days.innerText = diffDays < 10 ? "0" + diffDays : diffDays
      hours.innerText = diffHours < 10 ? "0" + diffHours : diffHours
      minutes.innerText = diffMinutes < 10 ? "0" + diffMinutes : diffMinutes
      seconds.innerText = diffSeconds < 10 ? "0" + diffSeconds : diffSeconds
    }, 1000)
  }

  countdown(document.getElementById("private-timer"))
  countdown(document.getElementById("mystery-chest-timer"))

  window.addEventListener("scroll", function (event) {
    var topDistance = window.pageYOffset
    var layers = document.querySelectorAll("[data-type='parallax']")
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i]
      var depth = layer.getAttribute("data-depth")
      var translate3d = "translate3d(0, " + -(topDistance * depth) + "px, 0)"
      layer.style["-webkit-transform"] = translate3d
      layer.style["-moz-transform"] = translate3d
      layer.style["-ms-transform"] = translate3d
      layer.style["-o-transform"] = translate3d
      layer.style.transform = translate3d
    }
  })

  const barMenu = document.getElementById('bar-menu')
  const barList = document.getElementById('bar-list')

  const toggle = async (event) => {
    const elem = event.target;
    if(elem.className.includes('fa-bars')){
      elem.className = "fa fa-times"
      barList.classList.remove('hidden')
    }else{
      elem.className = "fa fa-bars"
      barList.classList.add('hidden')
    }

  }

  barMenu.addEventListener('click', toggle)
})()
