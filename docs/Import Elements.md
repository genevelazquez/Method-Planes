#Import/Export elements and layouts#

This section illustrates the various data structures that are used in the application. Generally JSON style formats are preffered over XML.  


----------

## Importing elements ##

    importAirfield(object)

object : an `airfield` *object*

- Accepts an `airfield` *object*
- Imports an airfield layout background within the editor. 
- The airfield will be unclickable and not available for manipulation. This is done internally by appending a class with `pointer-events:none` CSS styling 

----------


    importElements(objects)

objects : *array* with `aircraft` *objects*

- Accepts an *array* with `aircraft` *objects*
- Imports an aircraft element at a specific position and rotation. 
- The plane is partly unclickable by default apart from a dot(SVG circle within the plane) which should have a class `.planeGrab`