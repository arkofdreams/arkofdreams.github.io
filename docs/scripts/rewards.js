(async() => {
  //sets up the MM SDK
  MetaMaskSDK.setup(blocknet)
  
  let populated = false
  const state = { connected: false }
  const network = MetaMaskSDK.network('polygon')
  const store = network.contract('rewards')
  const token = network.contract('crystal')
  const items = document.querySelector('div.items')
  const template = {
    item: document.getElementById('tpl-item').innerHTML,
    modal: document.getElementById('tpl-modal').innerHTML
  }

  const connected = function(newstate, session) {
    Object.assign(state, newstate, { connected: true })
    document.querySelectorAll('.connected').forEach(el => (el.style.display = 'block'))
    document.querySelectorAll('.disconnected').forEach(el => (el.style.display = 'none'))
    if (!session) {
      notify('success', 'Wallet connected')
    }

    if (window.location.hash) {
      const trigger = document.createElement('div')
      trigger.setAttribute('data-do', 'modal-open')
      trigger.setAttribute('data-id', window.location.hash.substring(1))
      trigger.setAttribute('data-on', 'click')
      window.doon(trigger)
      trigger.click()
    }

    populate()
  }

  const populate = async function() {
    if (populated) return
    items.innerHTML = ''
    for (let i = 0; true; i++) {
      try {
        //get metadata
        const response = await fetch(`/data/store/${i + 1}.json`)
        const json = await response.json()
        //get info
        const info = await blockapi.read(store, 'tokenInfo', i + 1)

        const item = toElement(template.item
          .replace('{IMAGE}', `/images/rewards/${i + 1}-preview.jpg`)
          .replace('{ID}', i + 1)
          .replace('{NAME}', json.name)
          .replace('{MATIC_HIDE}', info.eth > 0 ? '' : ' hide')
          .replace('{MATIC_PRICE}', info.eth > 0 ? blockapi.toEther(info.eth) : 0)
          .replace('{TOKEN_HIDE}', info.gratis > 0 ? '' : ' hide')
          .replace('{TOKEN_PRICE}', info.gratis > 0 ? blockapi.toEther(info.gratis): 0)
          .replace('{SUPPLY}', info.max > 0 
            ? (info.supply > 0 || info.max < 26 ? `${info.max - info.supply}/${info.max} remaining`: '')
            : (info.supply > 0 ? `${info.supply} sold`: '')
          )
        )
        populated = true

        items.appendChild(item)
        window.doon(item)
      } catch(e) {
        break
      }
    }
  }

  const disconnected = async function(newstate) {
    //update state
    Object.assign(state, newstate)
    delete state.account
    //if error, report it
    if (error) notify('error', error.message)
    document.querySelectorAll('.connected').forEach(el => (el.style.display = 'none'))
    document.querySelectorAll('.disconnected').forEach(el => (el.style.display = 'block'))
  }

  const toElement = function(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
  }

  window.addEventListener('connect-click', async(e) => {
    if (!store.address) {
      return notify('error', 'Store is offline at the moment. Please check back later.')
    }
    network.connectCB(connected, disconnected)
  })

  window.addEventListener('buy-matic-click', async function buyMatic(e) {
    if (!state.account) {
      return network.connectCB((newstate) => {
        connected(newstate)
        buyMatic(e)
      }, disconnected)
    }
    const id = parseInt(e.for.getAttribute('data-id'))
    const max = parseInt(e.for.getAttribute('data-max'))
    const price = e.for.getAttribute('data-price')
    const supply = parseInt(e.for.getAttribute('data-supply'))

    if (price == 0) {
      return notify('error', 'Item is unavailable right now')
    } else if (max > 0 && max <= supply) {
      return notify('error', 'Item is sold out')
    }

    const original = e.for.innerHTML
    e.for.innerHTML = 'Minting...'
    e.for.classList.add('disabled')

    notify('info', 'Minting item...')
    try {
      await (
        store
          .write(state.account, price, 6)
          .buy(state.account, id, 1)
      )
    } catch(error) {
      notify('error', error.message)
      e.for.innerHTML = original
      e.for.classList.remove('disabled')
      return false
    }

    e.for.innerHTML = original
    e.for.classList.remove('disabled')
    notify(
      'success', 
      `Minting is now complete. You can view your item on <a href="${blockmetadata.chain_marketplace}/${store._address}/${id}" target="_blank">
        opensea.io
      </a>.`,
      1000000
    )
  })

  window.addEventListener('buy-token-click', async function buyToken(e) {
    if (!state.account) {
      return network.connectCB((newstate) => {
        connected(newstate)
        buyToken(e)
      }, disconnected)
    }

    const id = parseInt(e.for.getAttribute('data-id'))
    const max = parseInt(e.for.getAttribute('data-max'))
    const price = e.for.getAttribute('data-price')
    const supply = parseInt(e.for.getAttribute('data-supply'))

    if (price == 0) {
      return notify('error', 'Item is unavailable right now')
    } else if (max > 0 && max <= supply) {
      return notify('error', 'Item is sold out')
    }

    //check gratis balance
    const balance = await token.read().balanceOf(state.account)
    if ((balance - price) < 0) {
      return notify('error', 'Not enough Arkon in your wallet')
    }

    const original = e.for.innerHTML
    e.for.innerHTML = 'Minting...'
    e.for.classList.add('disabled')

    notify('info', 'Minting item...')
    try {
      await (
        store
          .write(state.account, false, 6)
          .support(state.account, id, 1)
      )
    } catch(error) {
      notify('error', error.message)
      e.for.innerHTML = original
      e.for.classList.remove('disabled')
      return false
    }

    e.for.innerHTML = original
    e.for.classList.remove('disabled')
    notify(
      'success', 
      `Minting is now complete. You can view your item on <a href="${blockmetadata.chain_marketplace}/${store._address}/${id}" target="_blank">
        opensea.io
      </a>.`,
      1000000
    )
  })

  window.addEventListener('modal-open-click', async (e) => {
    const id = parseInt(e.for.getAttribute('data-id'))
    //get metadata
    const response = await fetch(`/data/gifts/${id}.json`)
    const json = await response.json()
    //get info
    const info = await blockapi.read(store, 'tokenInfo', id)

    //if it's a song
    if ('song' in json && json.animation_url) {}

    const modal = toElement(template.modal
      .replace('{IMAGE}', `/images/rewards/${id}-preview.jpg`)
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
      .replace('{MATIC_PRICE}', info.eth > 0 ? blockapi.toEther(info.eth) : 0)
      .replace('{TOKEN_HIDE}', info.gratis > 0 ? '' : ' hide')
      .replace('{TOKEN_PRICE}', info.gratis > 0 ? info.gratis : 0)
      .replace('{TOKEN_PRICE}', info.gratis > 0 ? blockapi.toEther(info.gratis): 0)
      .replace('{SUPPLY}', info.max > 0 
        ? (info.supply > 0 || info.max < 26 ? `${info.max - info.supply}/${info.max} remaining`: '')
        : (info.supply > 0 ? `${info.supply} sold`: '')
      )
      .replace('{MAX}', info.max)
      .replace('{MAX}', info.max)
      .replace('{SUPPLY}', info.supply)
      .replace('{SUPPLY}', info.supply)
    )

    document.body.appendChild(modal)
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

  window.doon('body')
  if (store.address) {
    network.startSession(connected, disconnected, true)
  }
})()