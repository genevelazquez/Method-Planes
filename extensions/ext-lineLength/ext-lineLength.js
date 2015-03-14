/*
 * ext-lineLength.js
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



Note: This is a left-toolbar extension which means it must strictly comply with the standards introduced here: https://code.google.com/p/svg-edit/wiki/ExtensionDocs
Note: This type of extensions must also be declared in method-draw.js in order to function properly. 

-----------------------
*/

"use strict";



// Section 1) Define extension --------------------------------------------------------------------------------------------------------------------------------------

methodDraw.addExtension("lineLength", function(S) {

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


        var lineLengthDec = 2 // decimals to trim for measurement



// Section 3) Append necessary HTML elements (if it's a left-toolbar button define it according to svg-edit extension docs in return object.)------------------------



            $('#selected_panel').attachToPanelAfter(1).after("<label><input id='lineLength'><span>Line Length</span></label>");
            $('#lineLength').dragInput({
                min: 5,
                max: 500,
                step: 1,
                callback: resizeLine,
                cursor: false
            }); //init a Method-draw drag input template. Do not remove/modify this 
            $('#lineLength').val(0);









//Section 4) Functions for extension-------------------------------------------------------------------------------------------------------------------------------
    

var singleSelected; //This gets filled with the single currently selected element. Popuplated by this extension bottom selectedChanged() method




//Measure a selected line and display it in the drag input

    function measureLine(){

        var currentX1 = parseInt(singleSelected[0].getAttributeNS(null,'x1'));
        var currentY1 = parseInt(singleSelected[0].getAttributeNS(null,'y1'));
        var currentX2 = parseInt(singleSelected[0].getAttributeNS(null,'x2'));
        var currentY2 = parseInt(singleSelected[0].getAttributeNS(null,'y2'));

        //distance of line is the distance between 2 points formula
        var distance = Math.sqrt((Math.pow((currentX2-currentX1), 2))+(Math.pow((currentY2-currentY1), 2)));

        $("#lineLength").val(parseInt(distance))
        return parseInt(distance);

    }


//Resize a line
    function resizeLine(){


        //intended new distance
        var newDistance = parseInt($('#lineLength').val());

        //current distance and endpoints
        var currentX1 = parseFloat(singleSelected[0].getAttributeNS(null,'x1'));
        var currentY1 = parseFloat(singleSelected[0].getAttributeNS(null,'y1'));
        var currentX2 = parseFloat(singleSelected[0].getAttributeNS(null,'x2'));
        var currentY2 = parseFloat(singleSelected[0].getAttributeNS(null,'y2'));
        var currentDistance = Math.sqrt((Math.pow((currentX2-currentX1), 2))+(Math.pow((currentY2-currentY1), 2)));

        if(Math.floor(currentDistance)===Math.floor(newDistance))return false;

        //new endpoints
        var x3 = currentX1 + (currentX2-currentX1) * newDistance/currentDistance
        var y3 = currentY1 + (currentY2-currentY1) * newDistance/currentDistance

        svgCanvas.changeSelectedAttributeNoUndo("x2",x3);
        svgCanvas.changeSelectedAttributeNoUndo("y2",y3);

        svgCanvas.addToSelection(singleSelected[0]); //hack to update the endX2,endY2 drag inputs UI

    }



// Section 5) Extension Return object----------------------------------------------------------------------------------------------------------------------------------
    return {
        name: "lineLength",
        svgicons: "extensions/vectorText-icon.xml", //this is not needed since we don't need an icon but the extension throws error without it.



        selectedChanged: function() {

            singleSelected = svgCanvas.getSelectedElems();
            var mode = svgCanvas.getMode();

            if (singleSelected.length === 1 && typeof singleSelected[0] !== "undefined" && singleSelected[0] !== null) {
                $('#lineLength').parent().css('display','block');
                if(singleSelected[0].nodeName==='line'){
                    measureLine()
                }

                return; //show input/val only when 1 single 'line' is selected

            } else {
                $('#lineLength').parent().css('display','none');
                return; 
            }


            return;
        }

    }

});