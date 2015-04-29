##Method-Draw/SVG-edit replaced functions and code changes##

This section illustrates the various replacements, bug fixings and code changes throughout the original Method-draw/SVG-edit code.

- Any work on this application takes on(continues) from this Method-Draw commit. Find it [here](https://github.com/duopixel/Method-Draw/tree/e99203c973edc69114ede228b443bab0b1ce5996)


----------


    setRotationAngle(val,preventUndo,pivotX,pivotY,specificElem)

> This function handles the element rotation either around the centre of
> element, or around a specified pivot point.

- `val` :  Integer: Amount of absolute rotation in degrees
- `preventUndo` :  BOOL: Undoable or not 
- `pivotX` : Float: Pivot point on X axis
- `pivotY` : Float: Pivot point on Y axis
- `specificElem` : Svg element: A specific elem to use here - if not provided the currently selected element is used instead


##### Found in: #####
- svgcanvas.js

##### Change reason: #####
- It now allows rotating around a pivot 
- It now allows overriding the elem being rotated from currently selected to a specific one provided

##### Notes: #####
- Pivot rotations DO NOT use the 'native SVG' command `transform=rotate(degrees,centerX,centerY)` command. - The pivot rotations are instead simulated - Method-draw get's confused when the rotation center is messed with - We keep the rotation center when rotating by pivot and we just translate the element appropriately so as to *simulate* pivot rotations whilst keeping the rotation center in the middle of the element.

----------


    zoomChanged(window,bbox,autoCenter)

> This function handles the zoom  It is called by any place in the code
> when a zoom is needed (e.g mouse scroll zoom, zoom input changes, zoom
> tool etc.)

- `window` : Unknown Type : the zooming window (missing info)
- `bbox` : Object: {x: number, y: number, width: number, height: number, zoom: float}` - the bbox to zoom to
- `autoCenter` : Boolean: if true it zooms to center, otherwise to the bbox.x/bbox.y


##### Found in: #####
- method-draw.js

##### Change reason: #####
- It now allows zooming-to-a-point if autoCenter is false/undefined

##### Notes: #####
- If `autoCenter` is undefined/false it zooms to `bbox.x/bbox.y`
- Zoom animation a.k.a `animatedZoom()` is removed
- This seems to be a robust and clean way of handling zoom-to-point without making large changes in the codebase

----------


`snapToBeam(elem,x1,y1,x2,y2)` -  ***new***

> Calculates new x,y positions to move the elem in order for it to move
> parallel to an imaginary line crossing it's center - e.g it returns
> values that will move the element only forward/backward to where it is
> facing - uses orthogonal projection in 2D formula
    
- `elem` : Svg element: the element we want to move
- `x1` : Float: x pos of initial point
- `y1` : Float: y pos of initial point
- `x2` : Float: x pos of new point 
- `y2` : Float: y pos of new point


##### Found in: #####
- svgcanvas.js

##### Notes: #####
- Needs the elem itself passed as an argument in order to fetch it's current rotation
- Returns values that will move the elem in x,y steps - e.g those are not absolute positions - the origin is the elem itself

----------
