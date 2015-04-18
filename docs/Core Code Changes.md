#Method-Draw/SVG-edit replaced functions and code changes#

This section illustrates the various replacements, bug fixings and code changes throughout the original Method-draw/SVG-edit code.

- Any work on this application takes on(continues) from this Method-Draw commit. Find it [here](https://github.com/duopixel/Method-Draw/tree/e99203c973edc69114ede228b443bab0b1ce5996)

## setRotationAngle() ##

    svgCanvas.setRotationAngle(val,preventUndo,byPivot,pivotX,pivotY,specificElem)

- `val` :  `INT: Amount of absolute rotation in degrees`
- `preventUndo` : `BOOL: Undoable or not `
- `pivotX` : `FLOAT: Pivot point on X axis`
- `pivotY` : `FLOAT: Pivot point on Y axis`
- `specificElem` : `Element Object: A specific elem to use here - if not provided the currently selected element is used instead`


----------

This function handles the element rotation either around the centre of element, or around a specified pivot point.

##### Found in: #####
- svgcanvas.js

##### Change reason: #####
- It now allows rotating around a pivot 
- It now allows overriding the elem being rotated from currently selected to a specific one provided

##### Notes: #####
- Pivot rotations DO NOT use the 'native SVG' command `transform=rotate(degrees,centerX,centerY)` command. - The pivot rotations are instead simulated - Method-draw get's confused when the rotation center is messed with - We keep the rotation center when rotating by pivot and we just translate the element appropriately so as to *simulate* pivot rotations whilst keeping the rotation center in the middle of the element.

##### Replacement: #####

	/* 
	-- Function: setRotationAngle() --
	
	- Allows rotation of an element either around it's center or around a pivot point
	- Pivot rotations do not use the regular svg rotate with custom centers command. Instead an emulation is made here,
	  by rotating an element around it's center and moving in certain x,y steps in order to simulate the pivot rotation
	
	
	Parameters:
	- val : Integer indicating the new rotation angle in degrees
	- preventUndo : Boolean indicating whether the action should be undoable or not
	- byPivot : Boolean indicating whether rotation is by pivot, if not given center rotation is assumed
	- pivotX : Integer indicating The x position of the pivot relative to the canvas
	- pivotY : Integer indicating. The y position of the pivot relative to the canvas
	- specificElem: element object - if provided it overrides the element being rotated from currently selected
	
	*/
	
		this.currentPivotRotation = 0;
		var pivotX = null;
		var pivotY = null;
		this.setRotationAngle = function(val,preventUndo,byPivot,pivotX,pivotY,specificElem) {
		
			//prevent max rotations
			if(val>(180)) 
		  		return false;
		 	if(val<(-180)) 
		  		return false;
		
			// ensure val is the proper type
			if(specificElem){
				var elem = specificElem;
			}else{
				var elem = selectedElements[0];		
			}
		
			if (!elem) return;
			var oldTransform = elem.getAttribute("transform");
			var bbox = svgedit.utilities.getBBox(elem);
			var cx = bbox.x+bbox.width/2, cy = bbox.y+bbox.height/2;
			var tlist = getTransformList(elem);
			
			// only remove the real rotational transform if present (i.e. at index=0)
			if (tlist.numberOfItems > 0) {
				var xform = tlist.getItem(0);
				if (xform.type == 4) {
					tlist.removeItem(0);
				}
			}
		
			// find R_nc and insert it
			if (val != 0) {
				var center = transformPoint(cx,cy,transformListToTransform(tlist).matrix);
				var R_nc = svgroot.createSVGTransform();
				R_nc.setRotate(val, center.x, center.y);
				if(tlist.numberOfItems) {
					tlist.insertItemBefore(R_nc, 0);
				} else {
					tlist.appendItem(R_nc);
				}
			}
			else if (tlist.numberOfItems == 0) {
				elem.removeAttribute("transform");
			}
			
			if (!preventUndo) {
				// we need to undo it, then redo it so it can be undo-able! :)
				// TODO: figure out how to make changes to transform list undo-able cross-browser?
				var newTransform = elem.getAttribute("transform");
				elem.setAttribute("transform", oldTransform);
				changeSelectedAttribute("transform",newTransform,selectedElements);
				call("changed", selectedElements);
		
			}
			var pointGripContainer = getElem("pathpointgrip_container");
		
			var selector = selectorManager.requestSelector(elem);
			selector.resize();
			selector.updateGripCursors(val);
		
		
			//End of regular rotations - now start moving in steps to offset and simulate pivot rotation
		  	if (pivotX == null) {
		  		pivotX = bbox.x;
				pivotY = bbox.y;
		  	}
		
			var rad = ((val - svgCanvas.currentPivotRotation) * 3.1415926 / 180)
		
			var centerx = bbox.width / 2 + bbox.x;
			var centery = bbox.height / 2 + bbox.y;
		
		
		 	var step_x = Math.cos(rad) * (centerx - pivotX) - Math.sin(rad) * (centery - pivotY);
		    var step_y = Math.sin(rad) * (centerx - pivotX) + Math.cos(rad) * (centery - pivotY);
		  
		    svgCanvas.currentPivotRotation = val;
		
		    steppingX = (step_x-centerx+pivotX)*current_zoom; 
		    steppingY = (step_y-centery+pivotY)*current_zoom; 
		
			if(byPivot){
				svgCanvas.moveSingleElement(elem,steppingX, steppingY, true);
			}
		
			svgCanvas.recalculateAllSelectedDimensions();
		};

----------

----------


## zoomChanged() ##

    zoomChanged(window, bbox, autoCenter)

- `window` : *the zooming window (missing info)*
- `bbox` : `Object {x: number, y: number, width: number, height: number, zoom: float}` - *the bbox to zoom to*
- `autoCenter` : `bool`, *if true it zooms to center, otherwise to the bbox.x/bbox.y*

----------

This function handles the zoom - 
It is called by any place in the code when a zoom is needed (e.g mouse scroll zoom, zoom input changes, zoom tool etc.)

##### Found in: #####
- method-draw.js

##### Change reason: #####
- It now allows zooming-to-a-point if autoCenter is false/undefined

##### Notes: #####
- If `autoCenter` is undefined/false it zooms to `bbox.x/bbox.y`
- Zoom animation a.k.a `animatedZoom()` is removed
- This seems to be a robust and clean way of handling zoom-to-point without making large changes in the codebase

##### Replacement: #####

			var zoomChanged = function(window, bbox, autoCenter) {
				var scrbar = 15,
					res = svgCanvas.getResolution(),
					w_area = workarea,
					canvas_pos = $('#svgcanvas').position();
				var z_info = svgCanvas.setBBoxZoom(bbox, w_area.width()-scrbar, w_area.height()-scrbar);
				if(!z_info) return;
				var zoomlevel = z_info.zoom,
					bb = z_info.bbox;
				
				if(zoomlevel < .001) {
					changeZoom({value: .1});
					return;
				}

				//if autoCenter not defined then we assume that we are zooming to a point
				if(!autoCenter) {
					updateCanvas(false, {x: bbox.x * zoomlevel + (bb.width * zoomlevel)/2, y: bbox.y * zoomlevel + (bb.height * zoomlevel)/2});
				} else { 
					updateCanvas();
				}

			    $("#zoom").val(parseInt(zoomlevel*100))
			    $("option", "#zoom_select").removeAttr("selected")
			    $("option[value="+ parseInt(zoomlevel*100) +"]", "#zoom_select").attr("selected", "selected")

				if(svgCanvas.getMode() == 'zoom' && bb.width) {
					// Go to select if a zoom box was drawn
					setSelectMode();
				}
				
				zoomDone();
			}

----------

----------


## snapToBeam() ***new*** ##

    snapToBeam(elem,x1,y1,x2,y2)
    
- `elem` : `Element object: the element we want to move`
- `x1` : `INT: x pos of initial point`
- `y1` : `INT: y pos of initial point`
- `x2` : `INT: x pos of new point` 
- `y2` : `INT: y pos of new point`

----------

Calculates new x,y positions to move the elem in order for it to move parallel to an imaginary line crossing it's center - e.g it returns values that will move the element only forward/backward to where it is facing - uses orthogonal projection in 2D formula

##### Found in: #####
- svgcanvas.js

##### Notes: #####
- Needs the elem itself passed as an argument in order to fetch it's current rotation
- Returns values that will move the elem in x,y steps - e.g those are not absolute positions - the origin is the elem itself

##### Function Code: #####

		/* 
		-- Function: snapToBeam() --
		
		- Allows calculating x/y movements for mousemove in order for the element to move only along the direction it is facing
		- Uses 'orthogonal projection of point onto a line in 2D' formula: http://de.wikipedia.org/wiki/Orthogonalprojektion#Projektion_auf_eine_Gerade
		
		
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
			var snapangle = (svgCanvas.getRotationAngle(elem)-90)*(3.14/180); //radians used here
			var u = {'x':Math.cos(snapangle),'y':Math.sin(snapangle)};
			var a = (x2-x1) * u.x + (y2-y1) * u.y;
			return {x: x1+a*u.x, y:y1+a*u.y};
		};

----------

----------
