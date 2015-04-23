##Import/Export elements and layouts##

This section illustrates methods to import/export elements and layouts in and out of the application.  


----------

### Importing elements ###

    importAirfield(object)
  
> Imports an airfield layout background within the editor.  The airfield
> will be unclickable and not available for manipulation. This is done
> internally by appending a class with `pointer-events:none` CSS styling


**Arguments:**

 - `objects` : Object : An *airfield* object


----------


    importElements(objects)

> Imports an aircraft element at a specific position and rotation.  The plane is partly
> unclickable by default apart from a dot(SVG circle within the plane) which should have a class `.planeGrab`

**Arguments:**

 - `objects` : Array : An array with *aircraft* objects
