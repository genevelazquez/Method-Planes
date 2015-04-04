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




/* -----------------BEAM MOVER EXPERIMENT---------------

Moving along a line orinted by the plane

By hijacking the snapToGrid function this is doable.


// STEP 1 - ADD THIS IN svgcanvas.js

/* 
-- Function: snapToBeam() --

- Allows calculating x/y movements for mousemove in order for the element to move only along the direction it is facing
- Similar to snapToAngle in math.js. However here, the elem can only move perpendicular to a line crossing it's center.


Parameters:
- elem : The elem we are tracking
- x1 : X pos of starting point of movement
- y1 : Y pos of starting point of movement
- x2 : X pos of ending point of movement
- y2 : Y pos of ending point of movement

Returns:
- x,y : vector describing next position as constrained by it's directional line 
- snapangle : angle of movement
- return values can be used to move the element accordingly by any function that moves an element

*/

this.snapToBeam = function(elem,x1,y1,x2,y2) {

	var dx = x2 - x1;
	var dy = y2 - y1;
	var dist = Math.sqrt(dx * dx + dy * dy);
	var snapangle= (svgCanvas.getRotationAngle(elem)-90)*(3.14/180); //radians used here
	var x = x1 - dist*Math.cos(snapangle);	
	var y = y1 - dist*Math.sin(snapangle);
	return {x:x, y:y, a:snapangle};
};


// STEP 2 - ADD THIS IN mousemove func() in svgCanvas.js in the 'select' case just below the 'if (evt.shiftKey) ... snapToAngle() etc'

if(curConfig.beamRiding){ 
	var xya = svgCanvas.snapToBeam(selectedElements[0],start_x,start_y,x,y); x=xya.x; y=xya.y;
}

// STEP 3 - Modify the curConfig object in svgCanvas to include a beamRiding variable  - also push the curConfig object to svgCanvas scope

// Default configuration options
var curConfig = this.curConfig = {
	show_outside_canvas: true,
	selectNew: true,
	dimensions: [640, 480],
	beamRiding : true
};



//--------------------End of beam follower experiment----------------------