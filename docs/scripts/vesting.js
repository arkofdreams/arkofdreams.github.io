(async() => {
  //sets up the MM SDK
  MetaMaskSDK.setup(blocknet)

  //------------------------------------------------------------------//
  // Variables

  const state = { connected: false }
  const network = MetaMaskSDK.network('ethereum')
  const vesting = network.contract('vesting')
  const token = network.contract('token')

  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 
    'MAY', 'JUN', 'JUL', 'AUG', 
    'SEP', 'OCT', 'NOV', 'DEC'
  ]

  //------------------------------------------------------------------//
  // Functions

  const connected = async function(newstate) {
    //check if vesting
    const info = await (vesting.read().vesting(newstate.account))
    if (info.total == 0) {
      return disconnected(
        { connected: false }, 
        new Error('Address is not vested')
      )
    }
    //update state
    Object.assign(state, newstate)
    //update html state
    document.querySelectorAll('.connected').forEach(
      el => (el.style.display = 'block')
    )
    document.querySelectorAll('.disconnected').forEach(
      el => (el.style.display = 'none')
    )
    //update state vesting
    const now = Math.floor(Date.now() / 1000)
    state.vesting = info
    state.paused = await (vesting.read().paused())
    state.totalReleasableAmount = await (
      vesting.read().totalReleasableAmount(state.account, now)
    )
    state.totalVestedAmount = await (
      vesting.read().totalVestedAmount(state.account, now)
    )
    //update UI
    populate()
  }

  const populate = function() {
    //determine all the final formatted values
    const vestedStartDate = new Date(state.vesting.startDate * 1000)
    const vestedEndDate = new Date(state.vesting.endDate * 1000)
    const totalVesting = parseFloat(
      MetaMaskSDK.toEther(state.vesting.total)
    ).toLocaleString('en')
    const totalReleaseable = MetaMaskSDK.toEther(state.totalReleasableAmount) < 100
      ? MetaMaskSDK.toEther(state.totalReleasableAmount)
      : parseFloat(
        MetaMaskSDK.toEther(state.totalReleasableAmount)
      ).toLocaleString('en')
    const totalReleased = MetaMaskSDK.toEther(state.vesting.released) 
      ? MetaMaskSDK.toEther(state.vesting.released)
      : parseFloat(
        MetaMaskSDK.toEther(state.vesting.released)
      ).toLocaleString('en')

    let progress = `${(state.totalVestedAmount / state.vesting.total) * 100}%`
    let totalVested = MetaMaskSDK.toEther(state.totalVestedAmount)

    //update HTML values
    document.getElementById('progress').style.width = progress
    document.getElementById('progress-total-vested').innerHTML = parseFloat(totalVested).toLocaleString('en')
    document.getElementById('progress-total-vesting').innerHTML = totalVesting
    document.getElementById('total-vesting').innerHTML = totalVesting
    document.getElementById('claimable').innerHTML = state.paused ? 'Waiting on TGE': 'Now'
    document.getElementById('total-releaseable').innerHTML = !state.paused ? totalReleaseable: 'Nothing right now.'
    document.getElementById('total-released').innerHTML = totalReleased
    document.getElementById('vesting-start-date').innerHTML = [
      months[vestedStartDate.getMonth()],
      vestedStartDate.getDate(),
      vestedStartDate.getFullYear()
    ].join(' ')
    document.getElementById('vesting-end-date').innerHTML = [
      months[vestedEndDate.getMonth()],
      vestedEndDate.getDate(),
      vestedEndDate.getFullYear()
    ].join(' ')

    if (!state.paused && state.totalReleasableAmount > 0) {
      document.getElementById('claim').style.display = 'inline-block'
    }

    const duration = state.vesting.endDate - state.vesting.startDate
    const increment = MetaMaskSDK.toEther(state.vesting.total) / duration
    setInterval(() => {
      totalVested = parseFloat(totalVested) + parseFloat(increment)
      progress = `${(totalVested / MetaMaskSDK.toEther(state.vesting.total)) * 100}%`

      document.getElementById('progress').style.width = progress
      document.getElementById('progress-total-vested').innerHTML = parseFloat(totalVested).toLocaleString('en')
    }, 1000)
  }

  const disconnected = function(newstate, error) {
    //update state
    Object.assign(state, newstate)
    delete state.account
    delete state.paused
    delete state.vesting
    delete state.totalReleasableAmount
    delete state.totalVestedAmount
    //if error, report it
    if (error) notify('error', error.message)
    //update HTML state
    document.querySelectorAll('.connected').forEach(
      el => (el.style.display = 'none')
    )
    document.querySelectorAll('.disconnected').forEach(el => (
      el.style.display = 'block')
    )
  }

  //------------------------------------------------------------------//
  // Events

  window.addEventListener('connect-click', async(e) => {
    if (!vesting.address) {
      return notify(
        'error', 
        'Vesting information is not available right now. Please check back later.'
      )
    }
    network.connectCB(connected, disconnected)
  })

  window.addEventListener('claim-click', async(e) => {
    if (!state.account) {
      return notify('Wallet is not connected')
    }

    try {
      await (vesting.write(state.account, false, 2).release(state.account))
    } catch(e) {
      return notify('error', e.message)
    }
  })

  window.addEventListener('watch-click', async(e) => {
    await token.addToWallet()
  })

  //------------------------------------------------------------------//
  // Initialize

  network.startSession(connected, disconnected, true)

  window.doon(document.body)
})()