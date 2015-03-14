    importAirfield(object)
object : an `airport` *object*

- Accepts an `airport` *object*
- Imports an airfield layout background within the editor. 
- The airport will be unclickable and not available for manipulation. This is done internally by appending a class with `pointer-events:none` CSS styling 

----------


    importElements(objects)

objects : *array* with `aircraft` *objects*

- Accepts an *array* with `aircraft` *objects*
- Imports an aircraft element at a specific position and rotation. 
- The plane is partly unclickable by default apart from a dot(SVG circle within the plane) which should have a class `.planeGrab`