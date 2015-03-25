#Data Structures#

This section illustrates the various data structures that are used in the application. Generally JSON style formats are preffered over XML.  


----------

## Airfield ##

  `airfield(object)`

**Contains:**

- `"id"`: Unique id of the airfield
- `"width"`: Width of the airfield
- `"height"`: Height of the airfield
- `"svgString"`: The airfield parts grouped within an SVG `<g>` tag. The outermost `<g>` tag must have class `.airfield`

*Example:*

    var anAirfield = {
    	"id":"airfield1", //unique id
    	"width":"1500", 
    	"height":"1100",
    	"svgString":"<g class='airfield'>..rest of airport SVG strings go here..</g>"
    }
    
----------

## Aircraft ##

  `aircraft(object)`

**Contains:**

- `"id"`: Unique id of the aircraft
- `"width"`: Width of the aircraft 
- `"height"`:Height of the aircraft
- `"x"` : Position of aircraft on the X axis of the canvas
- `"y"`: Position of aircraft on the Y axis of the canvas
- `"rotation"`: Rotation of the aircraft in degrees
- `"label"`:String with label text- Generally used for tail numbers - (max:8 chars),(use `"null"` for no data)
- `"labelFontSize"` : Font size of label text
- `"labelYPos"`: Position of label text. 0 is top of the aircraft group, not the canvas. Tweak this amount until the label text is just above the wings. 
- `"svgString"` : The aircraft parts. Can be grouped already but they will be grouped again internally within an `<g`> with the aircrafts unique id

> Note: Label text should not in any way stretch the bounding box of the aircraft. It must not exceed in any way the width/height or x/y positions of the aircraft so as to distort the aircraft's width/height bounding box. Make sure the label text sits inside the aircraft's natural area(bounding box)
> 
> Note: The silhuette path of the aircraft(the outline) must be a single, uniform path with class `.silhouette`

*Example:*

    var aircraft = {
    "id":"svg_1332",
    "x" : "230",
    "y" : "300",
    "rotation": "90",
    "rx":"0",
    "ry":"0",
    "label":"LBA011", //use "null" if no data exists
    "labelFontSize":"6",
    "labelYPos":"16",
    "svgString": "<path id='rt_tail' d='M25.027,45.173l10.062,1.699v-1.838c0-0.16-0.049....aircraft parts SVG strings continue"
    }	
    