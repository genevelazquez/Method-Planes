/*
 * ext-pivotRotation.js
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

methodDraw.addExtension("pivotRotation", function(S) {

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

    var pivotLeftClass = "Rotation_dot_left_1_";
    var pivotRightClass = "Rotation_dot_right_1_";
    var coordinatesOriginId = "canvasBackground";

    var presetRotationOptions= {
    'selRotationAngle' : 15,
    'rotationLimit' : 180
    }




// Section 3) Append necessary HTML elements (if it's a left-toolbar button define it according to svg-edit extension docs in return object.)------------------------


    $('#selected_panel').attachToPanelAfter(1).after("<label id='tool_angle_pivot' data-title='Change rotation pivot angle' class='draginput'><input id='angle_pivot' class='attr_changer' size='2' value='0' data-attr='transform' data-min='-180' data-max='180' type='text'/><span class='icon_label'>Rotation</span><div id='tool_angle_pivot_indicator'> <div id='tool_angle_pivot_indicator_cursor'></div></div></label>");
    $('#angle_pivot').dragInput({
        min: -180,
        max: 180,
        step: 1,
        callback: rotateByPivot,
        cursor: false,
        dragAdjust: 0.5
    }); //init a Method-draw drag input template. Do not remove/modify this 


    $('#selected_panel').attachToPanelAfter(1).after('<div id="centerPivot" class="toolBtn fullToolBtn toolBtnActive">Pivot On</div>');
    $('#selected_panel').attachToPanelAfter(1).after('<div id="engageRight" class="toolBtn halfToolBtn rotationDirBtn toolBtnActive" data-attr="right">Turn Right</div>');
    $('#selected_panel').attachToPanelAfter(1).after('<div id="engageLeft"  class="toolBtn halfToolBtn rotationDirBtn" data-attr="left">Turn Left</div>');

    $('#selected_panel').attachToPanelAfter(1).after("<div class='toolBtn halfToolBtn' id='rotateL45Btn'>Right "+String(presetRotationOptions.selRotationAngle)+"°</div>");
    $('#selected_panel').attachToPanelAfter(1).after("<div class='toolBtn halfToolBtn' id='rotateR45Btn'>Left "+String(presetRotationOptions.selRotationAngle)+"°</div>");


    $('#selected_panel').attachToPanelAfter(1).after('<h4>Rotation</h4>');

//Section 4) Functions for extension-------------------------------------------------------------------------------------------------------------------------------
    

    var singleSelected;

    var byPivot = true;
    $("#centerPivot").click(function(){
        if($(this).hasClass('toolBtnActive')){
            $(this).removeClass('toolBtnActive')
            $(this).text('Pivot Off');
            byPivot = false;
        }else{
            $(this).addClass('toolBtnActive')
            $(this).text('Pivot On');
            byPivot = true;
        }
    })

    var rotationDirection = 'right';
    $(".rotationDirBtn").click(function(){

        $(".rotationDirBtn").removeClass('toolBtnActive');

        if($(this).hasClass('toolBtnActive')){
            $(this).removeClass('toolBtnActive')
        }else{
            $(this).addClass('toolBtnActive')
        }
        rotationDirection = $(this).attr('data-attr');
    })

    $( "#rotateL45Btn" ).click(function() {
        rotationDirection = 'left';
        var currAngle = svgCanvas.getRotationAngle(); 
        if(currAngle+presetRotationOptions.selRotationAngle>presetRotationOptions.rotationLimit) return false;
        rotateByPivot(false,currAngle + presetRotationOptions.selRotationAngle);
    });

    $( "#rotateR45Btn" ).click(function() {
        rotationDirection = 'right';
        var currAngle = svgCanvas.getRotationAngle(); 
        if(currAngle+presetRotationOptions.selRotationAngle<(-presetRotationOptions.rotationLimit)) return false;
        rotateByPivot(false,currAngle - presetRotationOptions.selRotationAngle);
    });


    //rotate angle pivot UI cursor
    var anglePivotIndicatorElem = $("#tool_angle_pivot_indicator");
    rotateCursor = function(angle){
        var rotate_string = 'rotate('+ angle + 'deg)'
        $(anglePivotIndicatorElem).css({
          '-webkit-transform': rotate_string,
          '-moz-transform': rotate_string,
          '-o-transform': rotate_string,
          '-ms-transform': rotate_string,
          'transform': rotate_string
        });
    }


    function rotateByPivot(ctl,val){

        var angleVal;

        if(!ctl){
            angleVal = val;
        }else{
            angleVal = ctl.value;
        }

        var elemCurrRotation = svgCanvas.getRotationAngle(singleSelected);
        svgCanvas.setRotationAngle(elemCurrRotation,true); //fixes initial transformation issues if element already has rotation

        if(byPivot){ 

            if(rotationDirection==='right'){
                getPivotsXy('right');
            }else if(rotationDirection==='left'){
                getPivotsXy('left');  
            }else{
                console.log('no direction given in rotateByPivot()')
            }

            svgCanvas.setRotationAngle(angleVal,true,true,pivot.x,pivot.y);
        }else{
            svgCanvas.setRotationAngle(angleVal,true);
        }
        rotateCursor(angleVal)
    }


    //get pivot x,y positions from selected element - a global var controlled by the UI buttons indicate the dot we are using as pivot point

    var pivot = {"x":0,"y":0};
    function getPivotsXy(orientation){

        var pivotElem;
        var pivotFound=false;
        var currentZoom = svgCanvas.getZoom();

        switch(orientation) {
            case "right":
                pivotElem = $(singleSelected).find('.'+pivotLeftClass)[0];
                if (typeof pivotElem !=='undefined')
                    pivotFound = true;
                break;
            case "left":
                pivotElem = $(singleSelected).find('.'+pivotRightClass)[0];
                if (typeof pivotElem !=='undefined')
                    pivotFound = true;
                break;
            default:
               console.log("no pivot orientation argument given in getPivotsXy() in ext-pivotRotation.js")
        }

        if(pivotFound){
            var bbox = pivotElem.getBoundingClientRect();
        }else{
            var bbox = singleSelected.getBoundingClientRect();
        }

        var canvas = $("#"+coordinatesOriginId)[0].getBoundingClientRect();
        pivot.x = ((bbox.width/2)/currentZoom) + ((bbox.left-canvas.left)/currentZoom);
        pivot.y = ((bbox.height/2)/currentZoom) + ((bbox.top-canvas.top)/currentZoom);

        return pivot;

    }



// Section 5) Extension Return object----------------------------------------------------------------------------------------------------------------------------------
    return {
        name: "pivotRotation",
        svgicons: "extensions/vectorText-icon.xml", //this is not needed since we don't need an icon but the extension throws error without it.


        selectedChanged: function() {

            singleSelected = svgCanvas.getSelectedElems();

            if (singleSelected.length === 1 && typeof singleSelected[0] !== "undefined" && singleSelected[0] !== null) {  
                singleSelected = singleSelected[0];
                var angle = svgCanvas.getRotationAngle(singleSelected);
                $("#angle_pivot").val(Math.round(angle));
                getPivotsXy('right');
            }
            return;
        },

        elementChanged: function(){
            singleSelected = svgCanvas.getSelectedElems();

            if (singleSelected.length === 1 && typeof singleSelected[0] !== "undefined" && singleSelected[0] !== null) {  
                singleSelected = singleSelected[0];
                var angle = svgCanvas.getRotationAngle(singleSelected);
                $("#angle_pivot").val(Math.round(angle));
            }
            return;
        },
    }

});