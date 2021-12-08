(() => {
  const contractJSON = JSON.parse(document.getElementById('contract').innerText)
  const form = document.getElementById('claim')
  const input = document.getElementById('key')
  const error = document.getElementById('error')
  const button = form.getElementsByTagName('button')[0]
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    button.setAttribute('disabled', true);
    input.style.border = '1px solid #000000'
    error.innerText = ''

    if (!input.value?.length || !/^[0-9]+x/.test(input.value)) {
      input.style.border = '2px solid #DF0000'
      error.innerText = 'Invalid Key'
      button.setAttribute('disabled', false);
      return false
    }

    const { connected, message, account, contract } = await install(contractJSON)

    if (!connected) {
      error.innerText = message
      button.setAttribute('disabled', false);
      return false
    }

    const [tokenId, key] = input.value.split('x', 2)

    console.log(tokenId, account, `0x${key}`)

    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        to: contractJSON.address,
        from: account,
        data: contract.methods
          .lazyMint(tokenId, account, `0x${key}`)
          .encodeABI(),
      }]
    });

    form.innerHTML = `<p class="success">
      Congrats! You should be receiving your mystery chest shortly. 
      <br />Please check 
      <a href="https://testnet.bscscan.com/tx/${txHash}" target="_blank">
        https://testnet.bscscan.com/tx/${txHash}
      </a>
      <br />for your status.
    </p>`
    return false
  })

  const install = async(contractJSON) => {
    if (!window.ethereum.isMetaMask) {
      return { connected: false, message: 'Please install MetaMask' }
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
        message: `Please change network to ${contractJSON.chain}.` 
      }
    } catch (e) {
      return { connected: false, message: e.message }
    }
  }
})()