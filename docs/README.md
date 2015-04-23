##Method-Planes ##
#### Plane-Positioning system for One Mile Up Inc ####
##### Annandale, Virginia USA #####


----------
> This is the front end of a larger system - The goal of this front-end SVG editor is to allow users to accurately position/park their planes in their respective positions, illustrate safe distances around each aircraft and in general aid in a safe and efficient way of deciding the final parking places of aircraft.

  **Authors**: 
  
 - Nicholas Kyriakides(@nicholaswmin)
 - Simon Reinwand
 - An extension of Mark McKay's / SVG-edit team : [Method-Draw SVG editor](https://github.com/duopixel/Method-Draw)


------------------------------------------------------------------

#### Code Repository is [here](https://github.com/nicholaswmin/Method-Planes). ####

#### Product Documentation is [here](http://method-planes.readthedocs.org/en/latest/). ####

----------

####Notes:####

- This front-end is an extensively modified SVG editor, originally created as Method-Draw. The original code can be found here [https://github.com/duopixel/Method-Draw](https://github.com/duopixel/Method-Draw)

- The application is designed to allow users to import/export and manipulate plane-like SVG elements within a Canvas(which usually is a schematic layout of an airport).

**How was this extended?**


- The core functionality exists in svgcanvas.js, found in `src` folder which holds all the 'core' functionality of the application. Some minor modifications where made there in order to fix some bugs that Method-draw had at the time this was copied.

- Most of the new functionality uses extensions written and placed in the `extensions` folder of this project. This ensures that a modular architecture is used throughout the project when extending it.

- When creating extensions it's generally best to grab an existing extension and study it's structure. Then you can follow that structure to build additional functionality. This ensures a common coding style throughout the project.

- Method-draw(the original editor), is in itself based upon SVG-edit. It would be wise to also study this guide before creating a new extension(https://code.google.com/p/svg-edit/wiki/ExtensionDocs)

- All changes in original source code should be marked in comments with the name of the author(e.g nicholaswmin in my case).

- Extensions are generally named `ext-[extensionNameHere].js` and must be contained in an identically named folder which should also contain all the needed JS libaries/CSS files. Extensions should be placed in the existing `extensions` folder of this app

