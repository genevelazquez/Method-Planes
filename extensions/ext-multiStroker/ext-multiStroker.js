/*
 * ext-multiStroker.js
 *
 * Proprietary software
 *
 * Copyright(c) 2015 Nicholas Kyriakides
 *
 *
 * Dependencies:
 * 1) jQuery
 * 2) svgcanvas.js


-This extension is split in 5 sections

1) Defining extesion and jQuery helper function
2) Define global variables
3) Define static HTML elements needed for extension
4) Define functions needed for extension
5) Return object with ability to use svg-edit events

Note: This type of extensions must also be declared in method-draw.js in order to function properly. TODO: Fix this, I didn't declare that
I just copied and pasted this from ext-elementTracker.js and I forgot to redeclare it.

Extension Notes:
---

-----------------------

--------TODO's---------


-----------------------
*/

"use strict";



// Section 1) Define extension --------------------------------------------------------------------------------------------------------------------------------------

methodDraw.addExtension("multiStroker", function(S) {

    var svgcontent = S.svgcontent,
        svgns = "http://www.w3.org/2000/svg",
        svgdoc = S.svgroot.parentNode.ownerDocument,
        svgCanvas = methodDraw.canvas,
        ChangeElementCommand = svgedit.history.ChangeElementCommand,
        addToHistory = function(cmd) {
            svgCanvas.undoMgr.addCommandToHistory(cmd);
        };
        $.fn.attachToPanelAfter = function(i) {
        if(i===0){i=1};
        i=i-1; 
        var elems = this.find('> *');
        if (elems.length > i) return elems.eq(i);
        else return this;
    }


        

// Section 2) Global variables --------------------------------------------------------------------------------------------------------------------------------------


  var targetClass="silhouette"
  var safeDistanceColor = "#FF4B4B"
  var safeDistanceStroke = 3;



// Section 3) Append necessary HTML elements (if it's a left-toolbar button define it according to svg-edit extension docs in return object.)------------------------


  $('#tools_top').attachToPanelAfter(1).after("<div class='bigBtn' id='safeDistanceStroke'>Show safe distances</div>");;









//Section 4) Functions for extension-------------------------------------------------------------------------------------------------------------------------------


  function strokeAllPlanes(bool){
    var allPlanesSilhouettes = $("."+targetClass);
    if(bool){
      svgCanvas.changeSelectedAttributeNoUndo('stroke-width',safeDistanceStroke,allPlanesSilhouettes)
      svgCanvas.changeSelectedAttributeNoUndo('stroke', safeDistanceColor,allPlanesSilhouettes)
    }else{
      svgCanvas.changeSelectedAttributeNoUndo('stroke-width',0,allPlanesSilhouettes) 
    }
  }


  var safeDistancesToggle = false;
  $("#safeDistanceStroke").click(function(){

    safeDistancesToggle = !safeDistancesToggle;

    if(safeDistancesToggle){
      strokeAllPlanes(true)
    }else{
      strokeAllPlanes(false)     
    }

  });




// Section 5) Extension Return object----------------------------------------------------------------------------------------------------------------------------------
    return {
        name: "multiStroker",
        svgicons: "extensions/vectorText-icon.xml", //this is not needed since we don't need an icon but the extension throws error without it.



    }

});