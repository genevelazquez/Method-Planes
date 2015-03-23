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


