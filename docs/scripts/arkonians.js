(async() => {
  //sets up the MM SDK
  MetaMaskSDK.setup(blocknet)
  
  const state = { connected: false }
  const network = MetaMaskSDK.network('polygon')
  const arkonian = network.contract('arkonian')
  const token = network.contract('crystal')
  //chest variables
  const chestProof = document.getElementById('chest-proof')
  const chestButton = document.getElementById('chest-button')

  const connected = async function(newstate) {
    //update state
    Object.assign(state, newstate)
    document.querySelectorAll('.connected').forEach(el => (el.style.display = 'block'))
    document.querySelectorAll('.disconnected').forEach(el => (el.style.display = 'none'))
  }

  const disconnected = function(newstate, error) {
    //update state
    Object.assign(state, newstate)
    //if error, report it
    if (error) notify('error', error.message)
    document.querySelectorAll('.connected').forEach(el => (el.style.display = 'none'))
    document.querySelectorAll('.disconnected').forEach(el => (el.style.display = 'block'))
    //delete states
    delete state.account

  }

  window.addEventListener('connect-click', async(e) => {
    if (!arkonian.address) {
      return notify('error', 'Player realm is currently offline. Please check back later.')
    }
    network.connectCB(connected, disconnected)
  })

  window.addEventListener('watch-click', async(e) => {
    await token.addToWallet()
  })

  window.addEventListener('chest-open-click', async(e) => {
    chestButton.setAttribute('disabled', true);
    chestButton.disabled = true

    if (!chestProof.value?.length || !/^[0-9]+x/.test(chestProof.value)) {
      chestButton.setAttribute('disabled', false)
      chestButton.disabled = false
      notify('error', 'Invalid key.')
      return false
    }

    network.connectCB(async (newstate) => {
      //update state
      Object.assign(state, newstate)
      const [ tokenId, key ] = chestProof.value.split('x', 2)

      try {
        console.log(tokenId, state.account, `0x${key}`)
        await (
          network
            .contract('chest')
            .write(state.account, 0, 2)
            .redeem(tokenId, state.account, `0x${key}`)
        )
      } catch(e) {
        chestButton.setAttribute('disabled', false)
        chestButton.disabled = false
        notify('error', e.message)
        return false
      }
    })
  })

  window.doon(document.body)
})()