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
