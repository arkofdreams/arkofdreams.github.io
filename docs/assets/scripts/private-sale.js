(async () => {
  const { ethereum } = window;

  const connectWallet = document.getElementById("connectWallet");

  const mintAction = async() => {
    if (typeof ethereum === "undefined") {
      window.open(
        "https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en",
        "_blank"
      );
    } else {
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = accounts[0];
      connectWallet.innerHTML = account;
    }
  }

  connectWallet.addEventListener("click", mintAction); 
})();
