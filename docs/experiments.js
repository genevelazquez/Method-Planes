//Experimental code snippets


/*

----moveSingleElementAnim(x,y)-----

- Allows to move an element in x,y steps.
- The movements are animated.
- The origin is consiered the current elements position
- This function is a duplication of the steps to move an element by dragging with the mouse - The original method
  was to create a dummy transform on the element onMouseDown, onMousedrag we create a transform list object and apply it to the elem
  (with dx,dy the mouse offset from the elements current position and onMouseUp we finalize this by calling recalculateAllSelectedDimensions etc)
- I recreated those steps in a single function below.

---TODO's---

-Refactor so it also accepts as argument the element to animate instead of assuming that the elem is the currently selected
-Allow optional parameter 'rotate' so it animates rotations
-Handle possible errors
-Test comprehensively
-Use requestAnimationFrame() instead of setInterval

*/



function moveSingleElementAnim(element,x,y,rotate,angle){

	var dx=0;
	var dy=0;

	var realX,realY;

	var selected = selectedElements[0];

	//create transform lists
	var xform = svgroot.createSVGTransform();
	var tlist = getTransformList(selected);

	//append the transform lists(dummy transform at this stage)
	if(tlist.numberOfItems) {
		tlist.insertItemBefore(xform, 0);
	} else {
		tlist.appendItem(xform);
	}

	//interval for animation(could use var in interval to simulate speed)
	var interval = setInterval(function(){


		//if both axis have been reached stop the whole animation
		if(Math.abs(dx)>=Math.abs(x) && Math.abs(dy)>=Math.abs(y)){
			clearInterval(interval);
			recalculateAllSelectedDimensions();
			selectorManager.requestSelector(selected).showGrips(true);

			return false;
		}

		//handle negative translation arguments
		if(x<0){
			realX = -dx;
		}
		else{
			realX = dx;
		}

		if(y<0){
			realY = -dy;
		}
		else{
			realY = dy;
		}

		//stop moving in either axis if that axis movement has been completed
		if(Math.abs(dx)>=Math.abs(x)) 
			realX = 0;
		if(Math.abs(dy)>=Math.abs(y))
			realY = 0;

		//apply translation on transform
		xform.setTranslate(realX,realY);

		//apply transform on elem
		if(tlist.numberOfItems) {
			tlist.replaceItem(xform,0);
		} else {
			tlist.appendItem(xform);
		}

		//dunno what this does
		selectorManager.requestSelector(selected).resize();

		dx++;
		dy++;

	},10)
}


$('.clearfix').click(function(){ 
	setTimeout(function(){moveSingleElementAnim(100,0)},100);
	setTimeout(function(){moveSingleElementAnim(0,100)},3000);
	setTimeout(function(){moveSingleElementAnim(-100,0)},5000);
	setTimeout(function(){moveSingleElementAnim(0,-100)},8000);
});
