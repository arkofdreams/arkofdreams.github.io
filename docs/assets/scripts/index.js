(function() {
  function countdown(element) {
    const to = new Date(element.getAttribute('data-date'))
    const days = element.querySelector('span.days')
    const hours = element.querySelector('span.hours')
    const minutes = element.querySelector('span.minutes')
    const seconds = element.querySelector('span.seconds')
    setInterval(() => {
      const diff = to.getTime() - Date.now()
      if (diff < 0) {
        diff = 0
      }

      const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor(diff / (1000 * 60 * 60) % 24)
      const diffMinutes = Math.floor(diff / (1000 * 60) % 60)
      const diffSeconds = Math.floor(diff / 1000 % 60)

      days.innerText = diffDays < 10 ? '0' + diffDays : diffDays
      hours.innerText = diffHours < 10 ? '0' + diffHours : diffHours
      minutes.innerText = diffMinutes < 10 ? '0' + diffMinutes : diffMinutes
      seconds.innerText = diffSeconds < 10 ? '0' + diffSeconds : diffSeconds
    }, 1000)
  }

  countdown(document.getElementById('private-timer'))
  countdown(document.getElementById('mystery-chest-timer'))
})()