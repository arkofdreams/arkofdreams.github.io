(async() => {
  //sets up the MM SDK
  MetaMaskSDK.setup(blocknet)

  const state = { connected: false }
  const network = MetaMaskSDK.network('polygon')
  const sale = network.contract('sale')
  const vesting = network.contract('vesting')

  //chest variables
  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 
    'MAY', 'JUN', 'JUL', 'AUG', 
    'SEP', 'OCT', 'NOV', 'DEC'
  ]
  const amountOfAODToPurchase = document.getElementById('amount')
  const amountOfTotalMaticItCosts = document.getElementById('conversion') 

  const connected = function(newstate) {
    ///update state
    Object.assign(state, newstate)
    document.querySelectorAll('.connected').forEach(el => (el.style.display = 'block'))
    document.querySelectorAll('.disconnected').forEach(el => (el.style.display = 'none'))
    //update UI
    populate()
  }

  const populate = async function() {
    state.unitPrice = await (sale.read().currentTokenPrice())
    state.tokenLimit = await (sale.read().currentTokenLimit())
    state.tokenAllocated = await (sale.read().currentTokenAllocated())
    state.vestedDate = await (sale.read().currentVestedDate())

    const vestedDate = new Date(state.vestedDate * 1000)
    const percent = `${(state.tokenAllocated / state.tokenLimit) * 100}%`
    const currentAllocation = parseFloat(
      MetaMaskSDK.toEther(state.tokenAllocated)
    ).toLocaleString('en')
    const maxAllocation = parseFloat(
      MetaMaskSDK.toEther(state.tokenLimit)
    ).toLocaleString('en')
    const unitPrice = `${MetaMaskSDK.toEther(state.unitPrice)} MATIC`

    document.getElementById('progress').style.width = percent
    document.getElementById('current-allocation').innerHTML = currentAllocation
    document.getElementById('max-allocation').innerHTML = maxAllocation
    document.getElementById('unit-price').innerHTML = unitPrice
    document.getElementById('vested-date').innerHTML = [
      months[vestedDate.getMonth()],
      vestedDate.getDate(),
      vestedDate.getFullYear()
    ].join(' ')

    amountOfTotalMaticItCosts.innerHTML = (
      MetaMaskSDK.toEther(state.unitPrice
    ) * amountOfAODToPurchase.value).toLocaleString('en')
  }

  const disconnected = function() {
    document.querySelectorAll('.connected').forEach(el => (el.style.display = 'none'))
    document.querySelectorAll('.disconnected').forEach(el => (el.style.display = 'block'))
    //delete states
    delete state.account
    delete state.unitPrice
    delete state.tokenLimit
    delete state.tokenAllocated
    delete state.vestedDate
    state.connected = false

  }

  window.addEventListener('connect-click', async(e) => {
    if (!sale.address) {
      return notify('error', 'Sale is not available right now. Please check back later.')
    }
    network.connectCB(connected, disconnected)
  })

  window.addEventListener('calculate-keyup', async(e) => {
    if (!state.account) {
      return
    }

    setTimeout(() => {
      amountOfTotalMaticItCosts.innerHTML = (
        MetaMaskSDK.toEther(state.unitPrice
      ) * amountOfAODToPurchase.value).toLocaleString('en')
    }, 100)
  })

  window.addEventListener('buy-click', async(e) => {
    if (!state.account) {
      return notify('Wallet is not connected')
    }

    //check if vesting already
    const isVesting = await vesting.read().vesting(state.account)
    if (isVesting.total > 0) {
      return notify('error', 'Address is already vesting')
    }

    //gas check
    try {
      await (
        sale.gas(
          state.account,
          MetaMaskSDK
            .toBigNumber(state.unitPrice)
            .mul(MetaMaskSDK.toBigNumber(amountOfAODToPurchase.value))
            .toString()
        ).buy(state.account, MetaMaskSDK.toWei(amountOfAODToPurchase.value))
      )
    } catch(e) {
      const pattern = /have (\d+) want (\d+)/
      const matches = e.message.match(pattern)
      if (matches?.length === 3) {
        e.message = e.message.replace(pattern, `have ${
          MetaMaskSDK.toEther(matches[1], 'int').toFixed(5)
        } ETH want ${
          MetaMaskSDK.toEther(matches[2], 'int').toFixed(5)
        } ETH`)
      }
      return notify('error', e.message.replace('err: i', 'I'))
    }

    try {
      await (
        sale.write(
          state.account,
          MetaMaskSDK
            .toBigNumber(state.unitPrice)
            .mul(MetaMaskSDK.toBigNumber(amountOfAODToPurchase.value))
            .toString(),
          2
        ).buy(state.account, MetaMaskSDK.toWei(amountOfAODToPurchase.value))
      )
    } catch(e) {
      return notify('error', e.message)
    }
  })

  window.doon(document.body)
})()