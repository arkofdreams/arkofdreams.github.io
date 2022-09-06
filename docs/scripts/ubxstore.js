(async() => {
  const getURLParams = function() {
    const params = {}
    const query = new URLSearchParams(window.location.search)
    for (const parameters of query) {
      params[parameters[0]] = isNaN(parseFloat(parameters[1])) 
        ? parseFloat(parameters[1])
        : parameters[1]
    }
    return params
  }

  const { item, amount, recipient, proof } = getURLParams()
  if (item && amount && recipient && proof && !window.ethereum) {
    window.location.href = 'https://metamask.app.link/dapp/www.arkofdreams.io/ubxstore.html' + window.location.search
  }
  //sets up the MM SDK
  MetaMaskSDK.setup(blocknet)

  //------------------------------------------------------------------//
  // Variables
  let populated = false
  const state = { connected: false }
  const network = MetaMaskSDK.network('polygon')
  const store = network.contract('ubxstore')
  const token = network.contract('crystal')
  const items = document.querySelector('div.items')
  const template = {
    item: document.getElementById('tpl-item').innerHTML,
    modal: document.getElementById('tpl-modal').innerHTML
  }

  //------------------------------------------------------------------//
  // Functions

  const connected = async function(newstate, session) {
    //update state
    Object.assign(state, newstate, { connected: true })
    //update HTML state
    document.querySelectorAll('.connected').forEach(
      el => (el.style.display = 'block')
    )
    document.querySelectorAll('.disconnected').forEach(
      el => (el.style.display = 'none')
    )
    //if not connected via session
    if (!session) {
      notify('success', 'Wallet connected')
    }

    if (item && amount && recipient && proof) {
      //gas check
      try {
        await store.gas(state.account, 0)['mint(address,uint256,uint256,bytes,bytes)'](
          recipient,
          item,
          amount,
          proof,
          []
        )
      } catch(e) {
        const pattern = /have (\d+) want (\d+)/
        const matches = e.message.match(pattern)
        if (matches && matches.length === 3) {
          e.message = e.message.replace(pattern, `have ${
            MetaMaskSDK.toEther(matches[1], 'int').toFixed(5)
          } ETH want ${
            MetaMaskSDK.toEther(matches[2], 'int').toFixed(5)
          } ETH`)
        }
        notify('error', e.message.replace('err: i', 'I'))
        console.error(e)
        return
      }
      //now redeem
      try {
        await store.write(state.account, 0, 2)['mint(address,uint256,uint256,bytes,bytes)'](
          recipient,
          item,
          amount,
          proof,
          []
        )
      } catch(e) {
        notify('error', e.message.replace('err: i', 'I'))
        console.error(e)
        return
      }
    }
  }

  const populate = async function() {
    //if it's already populated, do nothing
    if (populated) return
    //reset the items html
    items.innerHTML = ''
    const lastItemId = await store.read().lastItemId()
    //now start populating it
    for (let i = 0; i < lastItemId; i++) {
      try {
        //get metadata
        const response = await fetch(`/data/ubx/${i + 1}.json`)
        const json = await response.json()
        //get info
        const info = await store.read().item(i + 1)
        //get erc20 price
        const tokenPrice = await store.read()['priceOf(uint256,address)'](i + 1, token.address);
        const name = json.attributes[0]?.value ? json.name + ' - ' + json.attributes[0].value : json.name
        //render item template with actual values
        const item = toElement(template.item
          .replace('{IMAGE}', `/images/ubxstore/${i + 1}.jpg`)
          .replace('{ID}', i + 1)
          .replace('{NAME}', name)
          .replace('{MATIC_HIDE}', info.itemPrice > 0 ? '' : ' hide')
          .replace('{MATIC_PRICE}', info.itemPrice > 0 ? MetaMaskSDK.toEther(info.itemPrice) : 0)
          .replace('{TOKEN_HIDE}', tokenPrice > 0 ? '' : ' hide')
          .replace('{TOKEN_PRICE}', tokenPrice > 0 ? MetaMaskSDK.toEther(tokenPrice): 0)
          .replace('{SUPPLY}', info.itemMaxSupply > 0 
            ? (info.itemTotalSupply < info.itemMaxSupply ? `${info.itemMaxSupply - info.itemTotalSupply}/${info.itemMaxSupply} remaining`: '')
            : (info.itemTotalSupply > 0 ? `${info.itemTotalSupply} sold`: '')
          )
        )
        //append the item to the items container
        items.appendChild(item)
        //register html events
        window.doon(item)
      } catch(e) {
        break
      }
    }

    //flag as populated
    populated = true
  }

  const disconnected = async function() {
    document.querySelectorAll('.connected').forEach(el => (el.style.display = 'none'))
    document.querySelectorAll('.disconnected').forEach(el => (el.style.display = 'block'))
    state.connected = false
  }

  const toElement = function(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
  }

  //------------------------------------------------------------------//
  // Events

  window.addEventListener('connect-click', async(e) => {
    if (!store.address) {
      return notify(
        'error', 
        'Store is offline at the moment. Please check back later.'
      )
    }
    network.connectCB(connected, disconnected)
  })

  window.addEventListener('buy-matic-click', async function buyMatic(e) {
    //if no account
    if (!state.account) {
      //connect the wallet and try again
      return network.connectCB((newstate) => {
        connected(newstate)
        buyMatic(e)
      }, disconnected)
    }
    //get item info
    const id = parseInt(e.for.getAttribute('data-id'))
    const max = parseInt(e.for.getAttribute('data-max'))
    const price = e.for.getAttribute('data-price')
    const supply = parseInt(e.for.getAttribute('data-supply'))

    //validation
    if (price == 0) {
      return notify('error', 'Item is unavailable right now')
    } else if (max > 0 && max <= supply) {
      return notify('error', 'Item is sold out')
    }

    //update button state
    const original = e.for.innerHTML
    e.for.innerHTML = 'Minting...'
    e.for.classList.add('disabled')
    //report
    notify('info', 'Minting item...')
    try {//to buy from the smart contract
      await (
        store
          .write(state.account, price, 6)
          .buy(state.account, id, 1)
      )
    } catch(error) {
      //update button state
      e.for.innerHTML = original
      e.for.classList.remove('disabled')
      //report
      return notify('error', error.message)
    }

    //update button state
    e.for.innerHTML = original
    e.for.classList.remove('disabled')
    //report
    notify(
      'success', 
      `Minting is now complete. You can view your item on <a href="${network.config.chain_marketplace}/${store._address}/${id}" target="_blank">
        opensea.io
      </a>.`,
      1000000
    )
  })

  window.addEventListener('buy-token-click', async function buyToken(e) {
    //if no account
    if (!state.account) {
      //connect the wallet and try again
      return network.connectCB((newstate) => {
        connected(newstate)
        buyToken(e)
      }, disconnected)
    }
     //get item info
    const id = parseInt(e.for.getAttribute('data-id'))
    const max = parseInt(e.for.getAttribute('data-max'))
    const price = e.for.getAttribute('data-price')
    const supply = parseInt(e.for.getAttribute('data-supply'))
    //validate
    if (price == 0) {
      return notify('error', 'Item is unavailable right now')
    } else if (max > 0 && max <= supply) {
      return notify('error', 'Item is sold out')
    }
    //check balance
    const balance = await token.read().balanceOf(state.account)
    if ((balance - price) < 0) {
      return notify('error', 'Not enough Arkon in your wallet')
    }
    //update button state
    const original = e.for.innerHTML
    e.for.innerHTML = 'Minting...'
    e.for.classList.add('disabled')
    //report
    notify('info', 'Minting item...')
    try {//to buy from the smart contract
      await (
        store
          .write(state.account, false, 6)
          .buyWithToken(token.address, state.account, id, 1)
      )
    } catch(error) {
      //update button state
      e.for.innerHTML = original
      e.for.classList.remove('disabled')
      //report
      return notify('error', error.message)
    }

    //update button state
    e.for.innerHTML = original
    e.for.classList.remove('disabled')
    //report
    notify(
      'success', 
      `Minting is now complete. You can view your item on <a href="${network.config.chain_marketplace}/${store._address}/${id}" target="_blank">
        opensea.io
      </a>.`,
      1000000
    )
  })

  window.addEventListener('modal-open-click', async (e) => {
    //get id
    const id = parseInt(e.for.getAttribute('data-id'))
    //get metadata
    const response = await fetch(`/data/ubx/${id}.json`)
    const json = await response.json()
    //get info
    const info = await store.read().item(id)
    //get erc20 price
    const tokenPrice = await store.read()['priceOf(uint256,address)'](id, token.address);
    const name = json.attributes[0]?.value ? json.name + ' - ' + json.attributes[0].value : json.name
    //render modal template with actual values
    const modal = toElement(template.modal
      .replace('{IMAGE}', `/images/ubxstore/${id}.jpg`)
      .replace('{ID}', id)
      .replace('{ID}', id)
      .replace('{NAME}', name)
      .replace('{MATIC_HIDE}', info.itemPrice > 0 ? '' : ' hide')
      .replace('{MATIC_PRICE}', info.itemPrice > 0 ? info.itemPrice : 0)
      .replace('{MATIC_PRICE}', info.itemPrice > 0 ? MetaMaskSDK.toEther(info.itemPrice) : 0)
      .replace('{TOKEN_HIDE}', tokenPrice > 0 ? '' : ' hide')
      .replace('{TOKEN_PRICE}', tokenPrice > 0 ? tokenPrice : 0)
      .replace('{TOKEN_PRICE}', tokenPrice > 0 ? MetaMaskSDK.toEther(tokenPrice): 0)
      .replace('{SUPPLY}', info.itemMaxSupply > 0 
        ? (info.itemTotalSupply < info.itemMaxSupply ? `${info.itemMaxSupply - info.itemTotalSupply}/${info.itemMaxSupply} remaining`: '')
        : (info.itemTotalSupply > 0 ? `${info.itemTotalSupply} sold`: '')
      )
      .replace('{MAX}', info.itemMaxSupply)
      .replace('{MAX}', info.itemMaxSupply)
      .replace('{SUPPLY}', info.itemTotalSupply)
      .replace('{SUPPLY}', info.itemTotalSupply)
    )
    //append modal to the body
    document.body.appendChild(modal)
    //register html events
    window.doon(modal)
  })

  window.addEventListener('modal-overlay-close-click', (e) => {
    if (e.originalEvent.target.classList.contains('modal')) {
      document.body.removeChild(e.for)
    }
  })

  window.addEventListener('modal-close-click', (e) => {
    const modal = document.querySelector(e.for.getAttribute('data-target'))
    modal.parentNode.removeChild(modal)
  })

  //------------------------------------------------------------------//
  // Initialize

  window.doon('body')
  network.startSession(connected, disconnected, true)

  //populate the store
  populate()

  if (item) {
    const trigger = document.createElement('div')
    trigger.setAttribute('data-id', item)
    trigger.setAttribute('data-do', 'modal-open')
    trigger.setAttribute('data-on', 'click')
    window.doon(trigger)
    trigger.click()
  }
})()