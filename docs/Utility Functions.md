##SVG UTILITY FUNCTIONS##

This section illustrates new, added utility functions that can be used - found in **svgutils.js**

You can use any utility function by calling:

 **- svgedit.utilities.-function-name-here-();**


----------

    getBBoxCenter(elem)

> Returns the bbox of the element in respect to the CENTER of the
> element instead of top-left.

 **Arguments:**

- `elem` : Svg element: element to get the bbox for

**Returns:**

 - `x` : Float: X position of element's center
 - `y` : Float: Y position of element's center
 - `width` : Float: Width of the element
 - `height` : Float: Height of the element

----------

    getOriginOffset(elem,offsetElem) 

> Returns the bbox of the element in respect to the 0,0 of another element(usually the canvas)

 - Used where `getBBox()` is unreliable(e.g for objects inside <g>
   groups,rotated elems etc.)
 - Uses boundingClientRect() instead of getBBox()
 - Needs an element that is always at 0,0 of workarea - if not provided '#canvasBackground' is used instead

**Arguments:**

 - `elem` : Svg element : element to get the bbox for
 - `ignoreZoom`:Boolean:  If 'true' canvas zooming is not taken into account . Uses `svgCanvas.getZoom()`
 - `offsetElem` : Svg element: Optional element to use as offset elem - bbox returned is relative to this element's top-left position - If not provided '#canvasBackground' element is used instead

**Returns:**

 - `x` : Float: X position of element's center relative to the offset elem 0,0
 - `y` : Float: Y position of element's center relative to the offset elem 0,0
 - `width` : Float: Width of the element
 - `height` : Float: Height of the element

----------

    getLineDistance(x1,y1,x2,y2) 

> Returns length of line between 2 points

**Arguments:**

 - `x1` : Float : X position of 1st point
 - `y1` : Float:  Y position of 1st point
 - `x2` : Float : X position of 2nd point
 - `y2` : Float:  Y position of 2nd point

**Returns:**

 - `distance` : Float: distance of 2 points

