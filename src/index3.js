// import './styles.css'
// window.$ = require('jquery')

// import {$,jQuery} from 'jquery';
// export for others scripts to use
// window.$ = $;
// window.jQuery = jQuery;

// import jquery from "jquery";
// export default (window.$ = window.jQuery = jquery);

// $( () => {
//   Place();
// });

// $( window ).on( "resize", (() => {
//   Place();
// }));

// const Place = () => {
//   let widthId = $( window ).width();
//   let heightId = $( window ).height();
//   if ( widthId / 4 < heightId / 9) [widthId, heightId] = [widthId / 4, widthId / 4]
//   else [widthId, heightId] = [heightId / 9, heightId / 9]
//   $('#back').text($( window ).width() + " " + $( window ).height());
//   $('#back').css({'top': 0 + 'px', 'left': widthId + 'px', 'width': widthId + 'px','height': heightId + 'px' });
//   $('#left').css({'top': heightId + 'px', 'left': 0 + 'px', 'width': widthId + 'px','height': heightId + 'px' });
//   $('#bottom').css({'top': heightId + 'px', 'left': widthId + 'px', 'width': widthId + 'px','height': heightId + 'px' });
//   $('#right').css({'top': heightId + 'px', 'left': 2 * widthId + 'px', 'width': widthId + 'px','height': heightId + 'px' });
//   $('#top').css({'top': heightId + 'px', 'left': 3 * widthId + 'px', 'width': widthId + 'px','height': heightId + 'px' });
//   $('#front').css({'top': 2 * heightId + 'px', 'left': widthId + 'px', 'width': widthId + 'px','height': heightId + 'px' });

//   $('#all').css({'top': 3 * heightId + 'px', 'left': 0 + 'px', 'width': $( window ).width() + 'px','height': $( window ).height() - 3 * heightId + 'px' });
// }

// $(document).ready(function() {
//   $('body').text('youpi!');

// });

const Place1 = () => {
  let widthId = window.innerWidth;
  let heightId = window.innerHeight;
  console.log(widthId, heightId)
  if ( widthId / 4 < heightId / 9) [widthId, heightId] = [widthId / 4, widthId / 4]
  else [widthId, heightId] = [heightId / 9, heightId / 9]
  console.log(widthId, heightId)
  let element = document.querySelector('#back');
  element.style.cssText  =
    'top: ' + 0 + 'px;' +	'left: ' + widthId + 'px;' + 'width: ' + widthId + 'px;' + 'height: ' + heightId + 'px;'

  element = document.querySelector('#left');
  element.style.cssText  =
    'top: ' + heightId + 'px;' +	'left: ' + 0 + 'px;' + 'width: ' + widthId + 'px;' + 'height: ' + heightId + 'px;'

  element = document.querySelector('#bottom');
  element.style.cssText  =
    'top: ' + heightId + 'px;' +	'left: ' + widthId + 'px;' + 'width: ' + widthId + 'px;' + 'height: ' + heightId + 'px;'

  element = document.querySelector('#right');
  element.style.cssText  =
    'top: ' + heightId + 'px;' +	'left: ' + 2 * widthId + 'px;' + 'width: ' + widthId + 'px;' + 'height: ' + heightId + 'px;'

  element = document.querySelector('#top');
  element.style.cssText  =
    'top: ' + heightId + 'px;' +	'left: ' + 3 * widthId + 'px;' + 'width: ' + widthId + 'px;' + 'height: ' + heightId + 'px;'
          
  element = document.querySelector('#front');
  element.style.cssText  =
    'top: ' + 2 * heightId + 'px;' +	'left: ' + widthId + 'px;' + 'width: ' + widthId + 'px;' + 'height: ' + heightId + 'px;'

  element = document.querySelector('#all');
  element.style.cssText  =
    'top: ' + 3 * heightId + 'px;' +	'left: ' + 0 + 'px;' + 'width: ' + window.innerWidth + 'px;' + 'height: ' + (window.innerHeight - 3 * heightId) + 'px;'
}
Place1();
window.addEventListener('resize', Place1);
