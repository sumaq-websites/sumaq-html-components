const goUpButton = document.getElementById("go-up");

goUpButton.addEventListener("click", () => {
  document.body.scrollTop = 0;
});

function check(scrollProgress, scrollMin, scrollMax) {
  if (scrollProgress === scrollMin) {
    goUpButton.style.visibility = "hidden";
  }

  if (scrollProgress > scrollMax) {
    goUpButton.style.visibility = "visible";
  }
}

export { check };
