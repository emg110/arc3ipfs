const toBottomEl = document.querySelector('#to-bottom');

toBottomEl.addEventListener('click', function () {
  gsap.to(window, .7, {
    scrollTo: 4000
  });
});