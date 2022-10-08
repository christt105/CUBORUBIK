import './styles.css'
const Place = () => {
  let widthId = window.innerWidth;
  let heightId = window.innerHeight;
  let marg = 10;
  if ( widthId / 4 < heightId / 9) [widthId, heightId] = [widthId / 4, widthId / 4];
  else [widthId, heightId] = [heightId / 9, heightId / 9];

  const Place1 = (id, t, l, w, h) => {
    document.querySelector("#" + id).style.cssText  =
      'top: ' + t + 'px;' +	'left: ' + l + 'px;' + 'width: ' + w + 'px;' + 'height: ' + h + 'px;'
  }
  // const config = [
//   //[eje, dir, color, faceName, face]
//     ["x", 1, "red", "right", true],
//     ["x", -1, "orange", "left", true],
//     ["y", 1, "yellow", "top", true],
//     ["y", -1, "white", "bottom", true],
//     ["z", 1, "blue", "front", true],
//     ["z", -1, "green", "back", true],
//     ["", 0, "", "all", false],
// ];
  Place1("back", 0, widthId + marg, heightId, widthId, heightId);
  Place1("left", heightId, marg, widthId, heightId);
  Place1("bottom", heightId, widthId + marg, widthId, heightId);
  Place1("right", heightId, 2 * widthId + marg, widthId, heightId);
  Place1("top", heightId, 3 * widthId + marg, widthId, heightId);
  Place1("front", 2 * heightId, widthId + marg, widthId, heightId);

  Place1("all", 3 * heightId, 0, window.innerWidth, window.innerHeight - 3 * heightId);
}
Place();
window.addEventListener('resize', Place);
