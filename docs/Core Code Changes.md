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
