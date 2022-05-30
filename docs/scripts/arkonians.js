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

  //------------------------------------------------------------------//
  // Functions

  const connected = async function(newstate) {
    //update state
    Object.assign(state, newstate)
    //toggle html state
    document.querySelectorAll('.connected').forEach(
      el => (el.style.display = 'block')
    )
    document.querySelectorAll('.disconnected').forEach(
      el => (el.style.display = 'none')
    )
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