#Method-Draw/SVG-edit replaced functions and code changes#

This section illustrates the various replacements, bug fixings and code changes throughout the original Method-draw/SVG-edit code.

- Any work on this application takes on from this Method-Draw commit. Find it [here](https://github.com/duopixel/Method-Draw/tree/e99203c973edc69114ede228b443bab0b1ce5996)


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

## setRotationAngle() ##

    setRotationAngle(val,preventUndo,byPivot,pivotX,pivotY)

- `val` : `bool` - Rotation angle value in degrees
- `preventUndo` : `bool` - Undoable or not
- `byPivot` : `bool`, - If true rotates around pivot, false around center
- `pivotX` : `INT`, - Pivot point in X axis
- `pivotY` : `INT`, - Pivot point in Y Axis

----------

This function handles element rotations around center of element

##### Found in: #####
- svgcanvas.js

##### Change reason: #####
- It now allows rotating around a custom center by emulating pivot rotations (rotating around center and apprpriately translating to simulate this - not by using SVG's transform=rotate(angle,pivotX,pivotY)

##### Notes: #####
- Uses 3 custom globals to keep previous rotation values

##### Replacement: #####

		this.currentPivotRotation = 0;
	    var pivotX = null;
	    var pivotY = null;

	    this.setRotationAngle = function(val,preventUndo,byPivot,pivotX,pivotY) {

		    //prevent max rotations
	    	if(val>(180)) 
	      		return false;
	     	if(val<(-180)) 
	      		return false;
	    
	    	// ensure val is the proper type
	    	var elem = selectedElements[0];
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
	    
	    	var selector = selectorManager.requestSelector(selectedElements[0]);
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
    		svgCanvas.moveSingleElement(selectedElements[0],steppingX, steppingY, true);
    	}
    
    	svgCanvas.recalculateAllSelectedDimensions();
    };

