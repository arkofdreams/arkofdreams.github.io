;(async () => {
  // Milestone
  const carouselPlaceholder = document.getElementById("swiper-wrapper")
  carouselPlaceholder.innerHTML = milestones
    .map((milestone) => {
      return `
                    <div class="flex flex-col p-10 rounded-xl bg-gray-50 swiper-slide">
                      <img src="${milestone.img}" alt="img-a" />
                      <h1 class="text-5xl mt-8 mb-4">${milestone.title}</h1>
                      <p class="text-xl">${milestone.description}</p>
                    </div>`
    })
    .join("")

  // Partners
  const partnerBlock = document.getElementById("partner-list")
  partnerBlock.innerHTML = partners
    .map((partner) => {
      return `
      <div class="w-1/3 px-20 py-10 border-white border-2 text-4xl bg-gray-50">
        <div class="flex flex-row justify-around">
          <img src="${partner.img}" alt="${partner.title}">
          ${partner.title}
        </div>
      </div>
    `
    })
    .join("")

  // Team
  const teamBlock = document.getElementById("team-list")
  teamBlock.innerHTML = teams.map((team) => {
    return `
                <div class="px-20 py-6">
                  <img src="${team.img}" alt="${team.name}" class="rounded-full border-2" />
                  <h1 class="text-xl font-bold my-2">${team.name}</h1>
                  <h1 class="text-xl my-2">${team.title}</h1>
                  <p class="space-x-4">
                    <span class="fa-brands fa-twitter fa-lg"></span>
                    <span class="fa-brands fa-linkedin fa-lg"></span>
                  </p>
                </div>`
  }).join('')
})(milestones)
