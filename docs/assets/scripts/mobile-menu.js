(async() => {
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