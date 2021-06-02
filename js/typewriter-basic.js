// busca todos los elementos que tengan la clase .typewriter-simple
export default function typewriter(options) {
  function startTypeWriter(element, text, speed) {
    let i = 0
    function animate() {
      if (i < text.length) {
        element.textContent += text.charAt(i)
        i++
        setTimeout(animate, speed)
      }
    }
    animate()
  }

  const elements = document.getElementsByClassName('typewriter-simple')
  for (let index = 0; index < elements.length; index++) {
    const element = elements.item(index)
    const text = element.firstChild.textContent
    const child = element.firstChild
    child.textContent = ''
    startTypeWriter(child, text, 200)
  }

}
