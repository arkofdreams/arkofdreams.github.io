(async() => {
  //sets up the MM SDK
  MetaMaskSDK.setup(blocknet)

  const state = { connected: false }
  const network = MetaMaskSDK.network('ethereum')
  const vesting = network.contract('vesting')
  const sale = network.contract('sale')
  const usdc = network.contract('usdc')

  //chest variables
  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 
    'MAY', 'JUN', 'JUL', 'AUG', 
    'SEP', 'OCT', 'NOV', 'DEC'
  ]
  const amountOfAODToPurchase = document.getElementById('amount')
  const amountOfTotalEthItCosts = document.getElementById('conversion') 

  const connected = function(newstate) {
    ///update state
    Object.assign(state, newstate)
    document.querySelectorAll('.connected').forEach(el => (el.style.display = 'block'))
    document.querySelectorAll('.disconnected').forEach(el => (el.style.display = 'none'))
    //update UI
    populate()
  }

  const populate = async function() {
    state.unitPrice = await (sale.read().currentERC20Price(usdc.address))
    state.tokenLimit = await (sale.read().currentTokenLimit())
    state.tokenAllocated = await (vesting.read().totalAllocated())
    state.vestedDate = await (sale.read().currentVestedDate())

    const vestedDate = new Date(state.vestedDate * 1000)
    const percent = `${(state.tokenAllocated / state.tokenLimit) * 100}%`
    const currentAllocation = parseFloat(
      MetaMaskSDK.toEther(state.tokenAllocated)
    ).toLocaleString('en')
    const maxAllocation = parseFloat(
      MetaMaskSDK.toEther(state.tokenLimit)
    ).toLocaleString('en')
    const unitPrice = `${MetaMaskSDK.toEther(state.unitPrice)} USDC`

    document.getElementById('progress').style.width = percent
    document.getElementById('current-allocation').innerHTML = currentAllocation
    document.getElementById('max-allocation').innerHTML = maxAllocation
    document.getElementById('unit-price').innerHTML = unitPrice
    document.getElementById('vested-date').innerHTML = [
      months[vestedDate.getMonth()],
      vestedDate.getDate(),
      vestedDate.getFullYear()
    ].join(' ')

    amountOfTotalEthItCosts.innerHTML = (
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
      amountOfTotalEthItCosts.innerHTML = (
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

    //approved value in wei
    const approved = MetaMaskSDK.toBigNumber(state.unitPrice).mul(
      MetaMaskSDK.toBigNumber(amountOfAODToPurchase.value)
    )

    const allowance = await (usdc.read().allowance(state.account, sale.address))
    //if no allowance
    if (allowance < approved) {
      //gas check
      try {
        await (
          usdc.gas(state.account).approve(
            sale.address,
            approved
          )
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

      try { //to approve
        await usdc.write(state.account, false, 6).approve(
          sale.address,
          approved
        )
      } catch(e) {
        return notify('error', e.message)
      }
    }

    //gas check
    try {
      await (
        sale.gas(state.account)['buy(address,address,uint256)'](
          usdc.address,
          state.account, 
          MetaMaskSDK.toWei(amountOfAODToPurchase.value)
        )
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
          false,
          2
        )['buy(address,address,uint256)'](
          usdc.address, 
          state.account, 
          MetaMaskSDK.toWei(amountOfAODToPurchase.value)
        )
      )
    } catch(e) {
      return notify('error', e.message)
    }

    state.tokenAllocated = await (sale.read().currentTokenAllocated())
    const percent = `${(state.tokenAllocated / state.tokenLimit) * 100}%`
    document.getElementById('progress').style.width = percent
    notify(
      'success', 
      `${
        parseFloat(amountOfAODToPurchase.value).toLocaleString('en')
      } AOD was successfully purchased`,
      1000000
    )
  })

  network.startSession(connected, disconnected, true)

  window.doon(document.body)
})()