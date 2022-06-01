(async() => {
  //sets up the MM SDK
  MetaMaskSDK.setup(blocknet)

  //------------------------------------------------------------------//
  // Variables
  
  const state = { connected: false }
  const network = MetaMaskSDK.network('polygon')
  const arkonian = network.contract('arkonian')
  const token = network.contract('crystal')
  //chest variables
  const chestProof = document.getElementById('chest-proof')
  const chestButton = document.getElementById('chest-button')
  const apiURL = 'http://139.59.233.80:4000'

  //------------------------------------------------------------------//
  // Functions

  const connected = async function(newstate) {
    //update state
    Object.assign(state, newstate)

    // get user details
    var detailsRequest = new XMLHttpRequest()
    detailsRequest.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        // layout user details
        var user = JSON.parse(this.responseText).results

        // balance
        document.getElementById('crystal-balance').innerText = user.crystals.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        // name
        document.getElementById('avatar-name').innerText = user.display_name
        // level
        document.getElementById('avatar-level').innerText = user.level
        // account class
        document.getElementById('account-class').innerText = user.class ?? 'Arkonian'
        // experience percentage
        var percentage = (parseInt(user.experience) / user.next_level_experience) * 100
        document.querySelector('#experience-bar .progress-bar-fill').style.width = percentage + '%'
        // experience meter
        document.getElementById('experience-meter').innerText = user.experience + ' / ' + user.next_level_experience

        // hunger percentage
        document.querySelector('#hunger-bar .progress-bar-fill').style.width = user.hunger + '%'
        // hygiene percentage
        document.querySelector('#hygiene-bar .progress-bar-fill').style.width = user.hygiene + '%'
        // energy percentage
        document.querySelector('#energy-bar .progress-bar-fill').style.width = user.energy + '%'
        // fun percentage
        document.querySelector('#fun-bar .progress-bar-fill').style.width = user.fun + '%'
        // social percentage
        document.querySelector('#social-bar .progress-bar-fill').style.width = user.social + '%'
        // happiness percentage
        document.querySelector('#happiness-bar .progress-bar-fill').style.width = user.happiness + '%'
      }

      //toggle html state
      document.querySelectorAll('.connected').forEach(
        el => (el.style.display = 'block')
      )
      document.querySelectorAll('.disconnected').forEach(
        el => (el.style.display = 'none')
      )
    }
    
    detailsRequest.open("GET", apiURL + '/profile/details?wallet_address=' + state.account, true)
    detailsRequest.send()

    // get user inventory
    var inventoryRequest = new XMLHttpRequest()
    inventoryRequest.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        // layout user inventory
        var items = JSON.parse(this.responseText).results

        var table = ''
        for (var i in items) {
          if (items[i].item == 'crystal' || parseInt(items[i].qty) <= 0) { continue }
          table += '<tr>'
          table += '<td>'+items[i].item+'</td>'
          table += '<td>'+items[i].qty+'</td>'
          table += '</tr>'
        }

        if (table == '') {
          document.querySelector('#inventory-table').style.display = 'none'
        } else {
          document.querySelector('#inventory-table tbody').innerHTML = table
        }
      }
    }
    
    inventoryRequest.open("GET", apiURL + '/profile/inventory?wallet_address=' + state.account, true)
    inventoryRequest.send()
  }

  const disconnected = function(newstate, error) {
    //update state
    Object.assign(state, newstate)
    delete state.account
    //if error, report it
    if (error) notify('error', error.message)
    //toggle html state
    document.querySelectorAll('.connected').forEach(
      el => (el.style.display = 'none')
    )
    document.querySelectorAll('.disconnected').forEach(
      el => (el.style.display = 'block')
    )
  }

  //------------------------------------------------------------------//
  // Events

  window.addEventListener('connect-click', async(e) => {
    if (!arkonian.address) {
      return notify(
        'error', 
        'Player realm is currently offline. Please check back later.'
      )
    }
    network.connectCB(connected, disconnected)
  })

  window.addEventListener('watch-click', async(e) => {
    await token.addToWallet()
  })

  window.addEventListener('chest-open-click', async(e) => {
    //disable button
    chestButton.setAttribute('disabled', true);
    chestButton.disabled = true
    //if proof is not valid
    if (!chestProof.value?.length || !/^[0-9]+x/.test(chestProof.value)) {
      //enable button
      chestButton.setAttribute('disabled', false)
      chestButton.disabled = false
      //report
      return notify('error', 'Invalid key.')
    }

    //ensure the wallet is connected
    network.connectCB(async (newstate) => {
      //update state
      await connected(newstate)
      //split proof to get the token id and proof
      const [ tokenId, key ] = chestProof.value.split('x', 2)

      try {//to redeem the chest via smart contract
        await (
          network
            .contract('chest')
            .write(state.account, 0, 2)
            .redeem(tokenId, state.account, `0x${key}`)
        )
      } catch(e) {
        //enable button
        chestButton.setAttribute('disabled', false)
        chestButton.disabled = false
        //report
        return notify('error', e.message)
      }
    })
  })

  //------------------------------------------------------------------//
  // Initialize

  window.doon(document.body)

  network.startSession(connected, disconnected, true)
})()