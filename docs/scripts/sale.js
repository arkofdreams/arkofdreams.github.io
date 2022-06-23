(async() => {
  //sets up the MM SDK
  MetaMaskSDK.setup(blocknet)

  //------------------------------------------------------------------//
  // Variables

  const state = { connected: false }
  const network = MetaMaskSDK.network('ethereum')
  const vesting = network.contract('vesting')
  const sale = network.contract('sale')

  //chest variables
  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 
    'MAY', 'JUN', 'JUL', 'AUG', 
    'SEP', 'OCT', 'NOV', 'DEC'
  ]
  const amountOfAODToPurchase = document.getElementById('amount')
  const amountOfTotalEthItCosts = document.getElementById('conversion') 

  //------------------------------------------------------------------//
  // Functions

  const connected = async function(newstate) {
    ///update state
    Object.assign(state, newstate)
    document.querySelectorAll('.connected').forEach(el => (el.style.display = 'block'))
    document.querySelectorAll('.disconnected').forEach(el => (el.style.display = 'none'))

    state.tokenLimit = await (sale.read().currentTokenLimit())
    state.tokenAllocated = await (vesting.read().totalAllocated())
    state.vestedDate = await (sale.read().currentVestedDate())
    
    state.erc20 = erc20Contract()
    if (state.erc20) {
      state.decimals = await (state.erc20.read().decimals())
      state.price = await (sale.read().currentERC20Price(state.erc20.address))
      populateERC20()
    } else {
      state.decimals = 18
      state.price = await (sale.read().currentTokenPrice())
      populateETH()
    }
  }

  const populateERC20 = async function() {
    const unitPrice = state.price / Math.pow(10, state.decimals)
    const vestedDate = new Date(state.vestedDate * 1000)
    const percent = `${(state.tokenAllocated / state.tokenLimit) * 100}%`
    const currentAllocation = parseFloat(
      MetaMaskSDK.toEther(state.tokenAllocated)
    ).toLocaleString('en')
    const maxAllocation = parseFloat(
      MetaMaskSDK.toEther(state.tokenLimit)
    ).toLocaleString('en')
    
    document.getElementById('progress').style.width = percent
    document.getElementById('current-allocation').innerHTML = currentAllocation
    document.getElementById('max-allocation').innerHTML = maxAllocation
    document.getElementById('unit-price').innerHTML = `${unitPrice} ${state.erc20.label}`
    document.getElementById('vested-date').innerHTML = [
      months[vestedDate.getMonth()],
      vestedDate.getDate(),
      vestedDate.getFullYear()
    ].join(' ')

    amountOfTotalEthItCosts.innerHTML = `${
      (unitPrice * amountOfAODToPurchase.value).toLocaleString('en')
    } ${state.erc20.label}`
  }

  const populateETH = async function() {
    const unitPrice = MetaMaskSDK.toEther(state.price)
    const vestedDate = new Date(state.vestedDate * 1000)
    const percent = `${(state.tokenAllocated / state.tokenLimit) * 100}%`
    const currentAllocation = parseFloat(
      MetaMaskSDK.toEther(state.tokenAllocated)
    ).toLocaleString('en')
    const maxAllocation = parseFloat(
      MetaMaskSDK.toEther(state.tokenLimit)
    ).toLocaleString('en')
    
    document.getElementById('progress').style.width = percent
    document.getElementById('current-allocation').innerHTML = currentAllocation
    document.getElementById('max-allocation').innerHTML = maxAllocation
    document.getElementById('unit-price').innerHTML = `${unitPrice.substring(0, 9)} ETH`
    document.getElementById('vested-date').innerHTML = [
      months[vestedDate.getMonth()],
      vestedDate.getDate(),
      vestedDate.getFullYear()
    ].join(' ')

    amountOfTotalEthItCosts.innerHTML = `${
      (unitPrice * amountOfAODToPurchase.value).toLocaleString('en')
    } ETH`
  }

  const buyERC20 = async function() {
    //approved value in wei
    const approved = MetaMaskSDK.toBigNumber(state.price).mul(
      MetaMaskSDK.toBigNumber(amountOfAODToPurchase.value)
    )

    const allowance = await (state.erc20.read().allowance(state.account, sale.address))
    //if no allowance
    if (allowance < approved) {
      //gas check
      try {
        await (
          state.erc20.gas(state.account).approve(
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
        await state.erc20.write(state.account, false, 6).approve(
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
          state.erc20.address,
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
          state.erc20.address,
          state.account, 
          MetaMaskSDK.toWei(amountOfAODToPurchase.value)
        )
      )
    } catch(e) {
      return notify('error', e.message)
    }
  }

  const buyETH = async function() {
    //gas check
    try {
      await (
        sale.gas(
          state.account,
          MetaMaskSDK.toBigNumber(state.price).mul(
            MetaMaskSDK.toBigNumber(amountOfAODToPurchase.value)
          ).toString()
        )['buy(address,uint256)'](
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
          MetaMaskSDK.toBigNumber(state.price).mul(
            MetaMaskSDK.toBigNumber(amountOfAODToPurchase.value)
          ).toString(),
          2
        )['buy(address,uint256)'](
          state.account, 
          MetaMaskSDK.toWei(amountOfAODToPurchase.value)
        )
      )
    } catch(e) {
      return notify('error', e.message)
    }
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

  const erc20Contract = function() {
    const option = document.querySelector('input.token-option:checked')
    if (!option.value.length) return false
    const contract = network.addContract(
      option.value, 
      blocknet.network.ethereum.contracts[option.value].address,
      blocknet.abi.erc20,
      blocknet.network.ethereum.contracts[option.value]
    ).contract(option.value)

    contract.label = option.value.toUpperCase()
    return contract
  }

  const countdown = function(element) {
    const date = element.getAttribute('data-date').replace(/-/g, "/")
    const to = new Date(date)
    const days = element.querySelector('.days')
    const hours = element.querySelector('.hours')
    const minutes = element.querySelector('.minutes')
    const seconds = element.querySelector('.seconds')
    setInterval(function () {
      const diff = to.getTime() - Date.now()
      if (diff < 0) {
        diff = 0
      }

      const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const diffMinutes = Math.floor((diff / (1000 * 60)) % 60)
      const diffSeconds = Math.floor((diff / 1000) % 60)

      days.innerText = diffDays < 10 ? '0' + diffDays : diffDays
      hours.innerText = diffHours < 10 ? '0' + diffHours : diffHours
      minutes.innerText = diffMinutes < 10 ? '0' + diffMinutes : diffMinutes
      seconds.innerText = diffSeconds < 10 ? '0' + diffSeconds : diffSeconds
    }, 1000)
  }

  //------------------------------------------------------------------//
  // Events

  document.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault()
    return false
  })

  window.addEventListener('connect-click', async(e) => {
    if (!sale.address) {
      return notify('error', 'Sale is not available right now. Please check back later.')
    }
    network.connectCB(connected, disconnected)
  })

  window.addEventListener('select-token-change', async(e) => {
    state.erc20 = erc20Contract()
    if (state.erc20) {
      state.decimals = await (state.erc20.read().decimals())
      state.price = await (sale.read().currentERC20Price(state.erc20.address))
      populateERC20()
    } else {
      state.decimals = 18
      state.price = await (sale.read().currentTokenPrice())
      populateETH()
    }
  })

  window.addEventListener('calculate-keyup', (e) => {
    if (!state.account) {
      return
    }

    setTimeout(async () => {
      const unitPrice = state.price / Math.pow(10, state.decimals)
      amountOfTotalEthItCosts.innerHTML = `${
        (unitPrice * amountOfAODToPurchase.value).toLocaleString('en')
      } ${state.erc20?.label || 'ETH'}`
    }, 100)
  })

  window.addEventListener('buy-submit', async(e) => {
    if (!state.account) {
      return notify('Wallet is not connected')
    }

    //check if vesting already
    const isVesting = await vesting.read().vesting(state.account)
    if (isVesting.total > 0) {
      return notify('error', 'Address is already vesting')
    }

    if (state.erc20) {
      return buyERC20()
    }

    return buyETH()
  })

  window.addEventListener('countdown-init', (e) => {
    countdown(e.for)
  })
  
  //------------------------------------------------------------------//
  // Initialize

  network.startSession(connected, disconnected, true)

  window.doon(document.body)
})()