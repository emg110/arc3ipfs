const toBottomEl = document.querySelector('#to-bottom');

toBottomEl.addEventListener('click', function () {
  gsap.to(window, .7, {
    scrollTo: 4000
  });
});

function convertIpfsCidV0ToByte32(cid) {
  return `${bs58.decode(cid).slice(2).toString('hex')}`;
}
function convertByte32ToIpfsCidV0(str) {
  if (str.indexOf('0x') === 0) {
      str = str.slice(2);
  }
  return bs58.encode(bs58.Buffer.from(`1220${str}`, 'hex'));
}


pinataClient.pinList('fe8183e03b87acbe7c12', '6706d784fdec717857caae130fb76f26a84ac8d346fd37393b6f790a114dcac4').then((result) => {
  //handle successful authentication here
  console.log(result);
}).catch((err) => {
  //handle error here
  console.log(err);
});