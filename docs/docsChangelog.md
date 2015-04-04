#Changelog for svgcanvas.js#

######We will use this doc to track changes to svgcanvas.js in order to update docs######

######Only for experimental changes that haven't been officially commited yet######


##Phase 2##

####Feature Pivots####

- setRotationAngle now accepts pivot arguments and allows rotation around pivot points via emulation
- moveSingleElement was there from previous project but undocumented 
- aircraft object must get updated 



####Feature Beam-Rider####

- new function snapToBeam() has been defined - maybe it's more appropriate to move it in math.js?
- mousemove has changed - it's section before going into switch case and within the switch case 'select' - look for beamRiding variable
- exposed curConfig as svgCanvas.curConfig where we can put as many svgCanvas scoped vars we want to - accessible by svgCanvas.[var-name-here]

