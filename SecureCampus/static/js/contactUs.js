 // ==== Preloader
 window.onload = function () {
    window.setTimeout(fadeout, 500);
  };

  function fadeout() {
    document.querySelector(".preloader").style.opacity = "0";
    document.querySelector(".preloader").style.display = "none";
  }

  window.onscroll = function () {

  // show or hide the back-top-top button
  const backToTop = document.querySelector(".back-to-top");
  if (
    document.body.scrollTop > 50 ||
    document.documentElement.scrollTop > 50
  ) {
    backToTop.style.display = "flex";
  } else {
    backToTop.style.display = "none";
  }
  };


