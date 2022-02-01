(async() => {
  const state = {}
  const connected = async function(newstate) {
    Object.assign(state, newstate, {
      //account: '0xe4d48122f4e3cc276480dc28db9e023fd66e39e8'
    })
    blockapi.notify('success', 'Wallet connected')

    document.getElementById('connected').classList.remove('hidden');
    document.getElementById('disconnected').classList.add('hidden');

    document.getElementById('wallet-address').innerHTML = [
      newstate.account.substr(0, 6),
      newstate.account.substr(newstate.account.length - 4)
    ].join('...')
  }

  const plan = async function(state) {
    const { web3, account, contract } = state

    const holder = await blockapi.read(contract, 'accounts', account)
    const totalVestingTokens = blockapi.toEther(web3, holder.lockedTokens, 'int') + blockapi.toEther(web3, holder.vestingTokens, 'int')

    if (totalVestingTokens == 0) {
      document.getElementsByClassName('plan')[0].classList.add('hidden')
      document.getElementsByClassName('noplan')[0].classList.remove('hidden')
      blockapi.notify('error', 'Your wallet was not found in this vesting plan')
      return
    }

    state.contract = state.contract

    document.getElementsByClassName('plan')[0].classList.remove('hidden')
    document.getElementsByClassName('noplan')[0].classList.add('hidden')

    const totalReleasable = await blockapi.read(contract, 'totalReleasableAmount', account, Math.floor(Date.now() / 1000))
    const totalReleased = blockapi.toEther(web3, holder.releasedTokens, 'int')

    Array.from(document.getElementsByClassName('total-releasable-percent')).forEach((el) => {
      el.style.width = `${Math.floor((totalReleasable / totalVestingTokens) * 100)}%`
    })
    Array.from(document.getElementsByClassName('total-released-percent')).forEach((el) => {
      el.style.width = `${Math.floor((totalReleased / totalVestingTokens) * 100)}%`
    })
    Array.from(document.getElementsByClassName('total-vesting-value')).forEach((el) => {
      el.innerHTML = totalVestingTokens.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    })
    Array.from(document.getElementsByClassName('total-released-value')).forEach((el) => {
      el.innerHTML = blockapi.toEther(web3, totalReleased, 'comma')
    })

    const VESTED_DATE = await blockapi.read(contract, 'VESTED_DATE')
    Array.from(document.getElementsByClassName('vested-date-value')).forEach((el) => {
      el.innerHTML = (new Date(VESTED_DATE * 1000)).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    })

    const tge = await blockapi.read(contract, 'tokenGeneratedEvent')
    if (tge > 0) {
      const lockPeriod = await blockapi.read(contract, 'lockPeriod')
      Array.from(document.getElementsByClassName('unlock-date-value')).forEach((el) => {
        el.innerHTML = (new Date((tge + lockPeriod) * 1000)).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      })
    }

    if (totalReleasable > 0) {
      document.getElementById('release').classList.add('inline-block')
      document.getElementById('release').classList.remove('hidden')
    } 
    Array.from(document.getElementsByClassName('total-releasable-value')).forEach((el) => {
      el.innerHTML = blockapi.toEther(web3, totalReleasable, 'comma')
    })
  }

  const disconnected = function(e) {
    if (e?.message) {
      blockapi.notify('error', e.message)
    } else {
      blockapi.notify('success', 'Wallet disconnected')
    }

    document.getElementById('disconnected').classList.remove('hidden');
    document.getElementById('connected').classList.add('hidden');
  }

  window.doon('body')
  window.addEventListener('disconnect-click', disconnected)
  window.addEventListener('connect-click', async(e) => {
    blockapi.connect(blockmetadata, connected, disconnected)
  })
  window.addEventListener('plan-change', async(e) => {
    if (!state.web3 || !state.account) {
      document.getElementsByClassName('plan')[0].classList.add('hidden')
      document.getElementsByClassName('noplan')[0].classList.remove('hidden')
      disconnected({ message: 'You are no longer connected' })
      return
    } else if (!state[e.originalEvent.target.value]) {
      document.getElementsByClassName('plan')[0].classList.add('hidden')
      document.getElementsByClassName('noplan')[0].classList.remove('hidden')
      disconnected({ message: 'Invalid option' })
      return
    }

    plan({
      web3: state.web3, 
      account: state.account, 
      contract: state[e.originalEvent.target.value]
    })
  })
  window.addEventListener('claim-click', async(e) => {
    if (!state.contract) {
      return blockapi.notify('error', 'No contract selected')
    }
    const tx = await blockapi.write(state.contract, state.account, 'release')
    blockapi.notify('success', `Funds are on the way! <a href="https://bscscan.com/tx/${tx}">View on Binance</a>`)
  })
})()

