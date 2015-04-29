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



##Phase 3##

####Feature Along-a-path animator####
- setRotationAngle now accepts specificElem arguments and allows custom elements to be rotated other than the currently selected
- insertElement function in ext-objectImporter now accepts prepend/append as well
- insertElemenet now resets the canvasBG width/height - needs refactoring
- fix setRotationAngle issue (it still uses selectedElement[0] in pivot code part so overriding with specific elem wont work)
- there are 2 commits back to back - one deals with separate tow/plane animation and other with unified - both are very, very rough but they seem to get it right
- getOriginOffset() is an often used function - it should definetely be moved in math.js or svg-edit-utils.js and be referenced from there always, remember to remove it from anywhere else
- Grab dot front should be a class attribute of the aircraft not an id 
-We need a utility function to calculate distance between 2 points

