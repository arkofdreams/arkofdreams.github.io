(() => {
  //calculator
  const rate = 0.025
  const web3 = new Web3(window.ethereum)
  window.aodToBusd = function(aod, toEther) {
    if (toEther) {
      return numToEther(aod * rate)
    }
    return aod * rate
  }
  window.numToEther = function(num) {
    console.log(num, web3.utils.toWei(String(num)).toString())
    return web3.utils.toWei(String(num)).toString()
  }
})();

(() => {
  //calculator
  const decimals = 1000
  const conversion = document.getElementById('conversion')
  const input = document.getElementById('amount')
  input.addEventListener('keyup', () => {
    setTimeout(() => {
      const busd = Math.round(aodToBusd(parseFloat(input.value)) * decimals) / decimals
      conversion.innerText = busd.toLocaleString()
    }, 1)
  })
})();

(() => {
  const busdJSON = JSON.parse(document.getElementById('busd').innerText)
  const contractJSON = JSON.parse(document.getElementById('contract').innerText)
  const form = document.getElementById('buy')
  const input = document.getElementById('amount')
  const error = document.getElementById('error')
  const button = form.getElementsByTagName('button')[0]

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    button.setAttribute('disabled', true);
    button.disabled = true
    input.style.border = '1px solid #000000'
    error.innerText = ''

    const amount = parseFloat(input.value)

    if (isNaN(amount) || amount < 100000 || amount > 500000) {
      input.style.border = '2px solid #DF0000'
      error.innerText = 'Invalid Amount'
      button.setAttribute('disabled', false)
      button.disabled = false
      return false
    }

    const busd = await install(busdJSON)
    if (!busd.connected) {
      error.innerHTML = busd.message
      button.setAttribute('disabled', false);
      button.disabled = false
      return false
    }

    try {
      await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          to: busdJSON.address,
          from: busd.account,
          data: busd.contract.methods
            .approve(contractJSON.address, aodToBusd(amount, true))
            .encodeABI(),
        }]
      });
    } catch(e) {
      error.innerHTML = e.message
      button.setAttribute('disabled', false);
      button.disabled = false
      return false
    }

    const contract = await install(contractJSON)
    if (!contract.connected) {
      error.innerHTML = contract.message
      button.setAttribute('disabled', false);
      button.disabled = false
      return false
    }

    const txHash = ''
    try {
      txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          to: contractJSON.address,
          from: contract.account,
          data: contract.contract.methods
            .buy(numToEther(amount))
            .encodeABI(),
        }]
      });
    } catch(e) {
      error.innerHTML = e.message
      button.setAttribute('disabled', false);
      button.disabled = false
      return false
    }

    form.innerHTML = `<p class="success">
      Congrats! You should be receiving your mystery chest shortly. 
      <br />Please check 
      <a href="https://testnet.bscscan.com/tx/${txHash}" target="_blank">
        https://bscscan.com/tx/${txHash}
      </a>
      <br />for your status.
    </p>`

    button.setAttribute('disabled', false);
    button.disabled = false
    return false
  })

  const install = async(contractJSON) => {
    if (!window.ethereum?.isMetaMask) {
      return { connected: false, message: 'Please install <a href="https://metamask.io/" target="_blank">MetaMask</a>' }
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const networkId = await window.ethereum.request({ method: 'net_version' });
      if (networkId == contractJSON.chain_id) {
        const web3 = new Web3(window.ethereum);
        return {
          connected: true,
          account: accounts[0],
          web3: web3,
          contract: new web3.eth.Contract(
            contractJSON.abi,
            contractJSON.address
          )
        }
      }
      
      return { 
        connected: false, 
        message: `Please change network to ${contractJSON.chain_name}.` 
      }
    } catch (e) {
      return { connected: false, message: e.message }
    }
  }
})()
