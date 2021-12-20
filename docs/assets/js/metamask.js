(async () => {
  const { ethereum } = window;
  let mintValue = 1;
  let petValue = 400;
  let totalValue = 400;

  const metamaskBtn = document.getElementById("metamask");
  const mintBtn = document.getElementById("mint");
  const minusBtn = document.getElementById("minus");
  const plusBtn = document.getElementById("plus");

  const mint = document.getElementById("mintValue");
  const pet = document.getElementById("petValue");
  const total = document.getElementById("totalValue");

  mint.innerHTML = mintValue;
  pet.innerHTML = petValue;
  total.innerHTML = petValue * mintValue;

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
      metamaskBtn.innerHTML = account;
    }
  }

  const add = async () => {
    if (mintValue !== 5 && mintValue > 0) mintValue++;
    mint.innerHTML = mintValue;
    total.innerHTML = petValue * mintValue;
  };

  const deduct = async () => {
    if (mintValue !== 1 && mintValue < 6) mintValue--;
    mint.innerHTML = mintValue;
    total.innerHTML = petValue * mintValue;
  };

  plusBtn.addEventListener("click", add);
  minusBtn.addEventListener("click", deduct);
  metamaskBtn.addEventListener("click", mintAction); 
  mintBtn.addEventListener("click", mintAction); 
})();
