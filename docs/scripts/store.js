(async() => {
  //sets up the MM SDK
  MetaMaskSDK.setup(blocknet)

  //------------------------------------------------------------------//
  // Variables
  let populated = false
  const itemMetadataUri = 'https://gateway.pinata.cloud/ipfs/QmTkuQYw7noSPHRfPAh7VXE6kgX2qdi6PPJMUTzAXMfYbe/'
  const state = { connected: false }
  const network = MetaMaskSDK.network('polygon')
  const store = network.contract('store')
  const token = network.contract('crystal')
  const items = document.querySelector('div.items')
  const template = {
    item: document.getElementById('tpl-item').innerHTML,
    modal: document.getElementById('tpl-modal').innerHTML
  }

  //------------------------------------------------------------------//
  // Functions

  const connected = function(newstate, session) {
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
    //if url has hash
    if (window.location.hash) {
      //open the modal
      const trigger = document.createElement('div')
      trigger.setAttribute('data-do', 'modal-open')
      trigger.setAttribute('data-id', window.location.hash.substring(1))
      trigger.setAttribute('data-on', 'click')
      window.doon(trigger)
      trigger.click()
    }
    //populate the store
    populate()
  }

  const populate = async function() {
    //if it's already populated, do nothing
    if (populated) return
    //reset the items html
    items.innerHTML = ''
    //now start populating it
    for (let i = 0; true; i++) {
      try {
        //get metadata
        const response = await fetch(`${itemMetadataUri}${i + 1}.json`)
        const json = await response.json()
        //get info
        const info = await store.read().tokenInfo(i + 1)
        //render item template with actual values
        const item = toElement(template.item
          .replace('{IMAGE}', json.preview)
          .replace('{ID}', i + 1)
          .replace('{NAME}', json.name)
          .replace('{MATIC_HIDE}', info.eth > 0 ? '' : ' hide')
          .replace('{MATIC_PRICE}', info.eth > 0 ? MetaMaskSDK.toEther(info.eth) : 0)
          .replace('{TOKEN_HIDE}', info.gratis > 0 ? '' : ' hide')
          .replace('{TOKEN_PRICE}', info.gratis > 0 ? MetaMaskSDK.toEther(info.gratis): 0)
          .replace('{SUPPLY}', info.max > 0 
            ? (info.supply > 0 || info.max < 26 ? `${info.max - info.supply}/${info.max} remaining`: '')
            : (info.supply > 0 ? `${info.supply} sold`: '')
          )
        )

        console.log(item)
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

  const disconnected = async function(newstate) {
    //update state
    Object.assign(state, newstate)
    delete state.account
    //if error, report it
    if (error) notify('error', error.message)
    //update html state
    document.querySelectorAll('.connected').forEach(
      el => (el.style.display = 'none')
    )
    document.querySelectorAll('.disconnected').forEach(
      el => (el.style.display = 'block')
    )
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
    const response = await fetch(`${itemMetadataUri}${id}.json`)
    const json = await response.json()
    //get info
    const info = await store.read().tokenInfo(id)
    //render modal template with actual values
    const modal = toElement(template.modal
      .replace('{IMAGE}', json.image)
      .replace('{ID}', id)
      .replace('{ID}', id)
      .replace('{NAME}', json.name)
      .replace('{DESCRIPTION}', json.description
        .replace(/(https?:\/\/[^\s]+)/g, url => {
          return `<a href="${url}" target="_blank">${url}</a>`;
        })
        .replace(/\n/g, '<br />')
      )
      .replace('{MATIC_HIDE}', info.eth > 0 ? '' : ' hide')
      .replace('{MATIC_PRICE}', info.eth > 0 ? info.eth : 0)
      .replace('{MATIC_PRICE}', info.eth > 0 ? MetaMaskSDK.toEther(info.eth) : 0)
      .replace('{TOKEN_HIDE}', info.gratis > 0 ? '' : ' hide')
      .replace('{TOKEN_PRICE}', info.gratis > 0 ? info.gratis : 0)
      .replace('{TOKEN_PRICE}', info.gratis > 0 ? MetaMaskSDK.toEther(info.gratis): 0)
      .replace('{SUPPLY}', info.max > 0 
        ? (info.supply > 0 || info.max < 26 ? `${info.max - info.supply}/${info.max} remaining`: '')
        : (info.supply > 0 ? `${info.supply} sold`: '')
      )
      .replace('{MAX}', info.max)
      .replace('{MAX}', info.max)
      .replace('{SUPPLY}', info.supply)
      .replace('{SUPPLY}', info.supply)
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
  if (store.address) {
    network.startSession(connected, disconnected, true)
  }
})()