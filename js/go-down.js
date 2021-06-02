const goDownButton = document.getElementById("go-down");

goDownButton.onclick = () => {
  document.body.scrollTop = screen.offsetHeight;
};

goDownButton.addEventListener("click", () => {
  document.body.scrollTop = document.body.offsetHeight;
});

function check(scrollProgress, scrollMin, scrollMax) {
  if (scrollProgress === scrollMin) {
    goDownButton.style.visibility = "visible";
  }

  if (scrollProgress > scrollMax) {
    goDownButton.style.visibility = "hidden";
  }
}

export { check };
