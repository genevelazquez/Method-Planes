/*
 * ext-objectImporter.js
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

-This extension allows importing arbitrary SVG elements into the editor without doing any resets(in a general sense). 
 importSvgString and openSVG() just don't cut it in this scenario since they reset a whole lot of stuff.

-Be careful as to what you import. Elements with translations are OK since setSvgString(), seems to bake those in the path coordinates but
 scaling messes up the resize calculations(but it doesnt seem to break things). 
-Rotations must have a correct rotation centre set to them, e.g rotate(45) just won't cut it. It comes out wrong. The rotation seem to need
 to be created within this app in order to be correct when re-importing them back. Rotation centres must always be at the center of the
 element's bbox otherwise the app's calculations go all nuts
-Scalings mess up the resizing functions of the app. Although they don't break anything, they cause the resizing of elements to accelerate
 proportionally to the defined scale factors.
-Translations seem to work just fine.

-All element id's must be UNIQUE and start with svg_[something]. Don't use classes for selecting elements or anything else,
 other than applying some CSS classes to them - e.g pointer-events:none etc.

-The original principle for importing object's is that we take the svg source string of the editor, concatenate our SVG elements 
 we want to import as string to that, and reinject the new string to the source of the editor.

-The svgCanvas.js file(at least at the time of writing), has a 'current_zoom = 1', zoom reset in the function setSvgString(). I removed
 that since it resets the zoom each time we do a svg source reinjection and it didn't pose any issues this far. Remove it as well if needed

-For importing elements in a particular order on the canvas (below or above existing elements), I currently take the source of the editor,
 turn that string into an XML DOM and use jQuery to append/prepend objects after existing elems. Then I re-stringify that and reinject as usual.

-Is there a better way to import stuff? At least(but not only), the insertElement() uses a heavy string-XML-string conversion which might
 might be very naive. The string concatenations also take time and getting/reinjecting the source is also somehow slow. Also this seems rather
 unsophisticated.

-Be aware that text labels on aircraft should not exceed the width of the aircraft. Otherwise the text will be taken into account when
 calculating bounding boxes, throwing off the center and giving wrong width/heights for the aircrafts themselves.
-----------------------

--------TODO's---------

- Remove test data?
- Research more sophisticated methods for importing and inserting elems. Maybe the original authors have some advice?
- Remove some comments - It's too verbose now
- If you want to have some elements as unclickable(pointer-events:none), it's best to design the functions to accept that as argument here.
- Allow rotation/scaling arguments to be passed in the importing/inserting functions (but first see notes above)
- Declare this extension into svgCanvas.js or method-draw.js(I don't remember) - Remove ext-elementTracker.js since it was this file originally.
- WebWorkers can be used for both import and insert functions - They are definetely worth a try. 
- Restructure the spinner lib, the spinnerLock() func and the spinnerOpts and init functions in a new extension - it's general functionality
  However, this will make this new extension a dependency in each extension that uses it, maybe integrate it into the project?

-----------------------
*/

"use strict";



// Section 1) Define extension --------------------------------------------------------------------------------------------------------------------------------------

methodDraw.addExtension("objectImporter", function(S) {

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


//Spinner options - this should be reworked with the spinnerLock() function into a new globally accessible extension

var spinnerOpts = {
  lines: 17, // The number of lines to draw
  length: 6, // The length of each line
  width: 2, // The line thickness
  radius: 20, // The radius of the inner circle
  corners: 1, // Corner roundness (0..1)
  rotate: 0, // The rotation offset
  direction: 1, // 1: clockwise, -1: counterclockwise
  color: '#000', // #rgb or #rrggbb or array of colors
  speed: 2.2, // Rounds per second
  trail: 60, // Afterglow percentage
  shadow: true, // Whether to render a shadow
  hwaccel: true, // Whether to use hardware acceleration
  className: 'spinner', // The CSS class to assign to the spinner
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  top: '50%', // Top position relative to parent
  left: '50%' // Left position relative to parent
};


//init spinner
var spinner,spinTarget;
setTimeout(function(){
    spinTarget = document.getElementById('svgcanvas');
    spinner = new Spinner(spinnerOpts).spin(spinTarget);
    spinTarget.appendChild(spinner.el);
    spinner.stop();
},200)


//starts spinner and prevents user interaction with app - util func
function spinnerLock(bool){
    if(bool){
        spinner.spin(spinTarget);
        $('body').css('pointer-events','none');
    }else{
        spinner.stop();
        $('body').css('pointer-events','all');
    }

}


var objectPrefix = "planeModel"; //class to give to each imported object

//sample objects you can use
window.anAirfield = {
    "id":"airfield1",
    "width":"1500",
    "height":"1100",
    "svgString":"<g class='airfield'><path fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' d='M8,504.2c48-2,342,0,342,0v20'/><polyline fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' points='0,448.2 584,446.2 822,444.2 '/><polyline fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' points='806,500.2 414,502.2 414,524.2 '/><polygon fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' points='1156,552.2 1152,634.2 1114,632.2 1108,706.2 1024,708.2 1024,554.2 '/><rect x='1022' y='666.2' fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' width='14' height='40'/><rect x='588' y='818.2' fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' width='102' height='62'/><rect x='374' y='828.2' fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' width='16' height='32'/><rect x='182' y='866.2' fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' width='14' height='56'/><rect x='90' y='866.2' fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' width='54' height='16'/><rect x='24' y='608.2' fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' width='168' height='26'/><polygon fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' points='684,676.2 194,676.2 194,610.2 390,610.2 396,620.2 644,618.2 646,648.2 660,650.2 664,634.2 684,638.2 '/><rect x='570' y='4.2' fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' width='198' height='22'/><rect x='566' y='404.2' fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' width='198' height='26'/><rect x='1192' y='0.2' fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' width='218' height='28'/><rect x='1194' y='410.2' fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' width='218' height='28'/><polygon fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' points='1272,1098.2 1372,1110.2 1372,1050.2 1270,1050.2 '/><rect x='1002' y='554.2' fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' width='14' height='46'/><rect x='1030' y='716.2' fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' width='46' height='22'/><rect x='710' y='638.2' fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' width='34' height='16'/><polygon fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' points='806,656.2 754,656.2 754,669.2 706,668.2 682,670.2 682,610.2 716,614.2 746,614.2 754,634.2 804,632.2 '/><g id='Layer_1_1_'><rect x='1294.3' y='445.4' fill='#F69679' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' width='258' height='386'/><rect x='872' y='818.3' fill='#F69679' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' width='267' height='225'/><polygon fill='#F69679' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' points='690.1,825 190.1,825 190.1,680 389.1,680 690.1,680 '/><rect x='15.6' y='638.3' fill='#F69679' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' stroke-dasharray='6,6' width='175' height='225'/><rect x='570' y='28.8' fill='#F69679' stroke='#000000' stroke-width='0.5244' stroke-miterlimit='10' width='220' height='375'/><rect x='948' y='31.8' fill='#F69679' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' width='220' height='380'/><rect x='440' y='128.2' fill='#F69679' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' width='130' height='180'/><rect x='1556.8' y='444.9' fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' width='28.8' height='120.2'/><rect x='1556.8' y='711.3' fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' width='28.8' height='119.2'/><rect x='1556.8' y='587.4' fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' width='28.8' height='101.7'/><rect x='1494.2' y='808' fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' width='48.8' height='16.3'/><g><rect x='1540.7' y='773.9' fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' width='12.3' height='29.9'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='1540.6' y1='780.7' x2='1553' y2='780.7'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='1540.6' y1='775.1' x2='1553' y2='775.1'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='1540.6' y1='786.2' x2='1553' y2='786.2'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='1540.6' y1='791.8' x2='1553' y2='791.8'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='1540.6' y1='797.3' x2='1553' y2='797.3'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='1540.6' y1='802.8' x2='1553' y2='802.8'/></g><rect x='1545' y='531.2' fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' width='10' height='36'/><text transform='matrix(1 0 0 1 1564.9736 682.25)' font-family='MyriadPro-Regular' font-size='24'>4</text><text transform='matrix(1 0 0 1 1564.9736 775.25)' font-family='MyriadPro-Regular' font-size='24'>2</text><text transform='matrix(1 0 0 1 1564.9736 823.25)' font-family='MyriadPro-Regular' font-size='24'>3</text><text transform='matrix(0.85 0 0 1 1358.0107 646.25)' fill='#FCD3C1' font-family='MyriadPro-Regular' font-size='48'>Hangar 7</text><text transform='matrix(1 0 0 1 1349.4473 675.0498)' fill='#FCD3C1' font-family='MyriadPro-Regular' font-size='24'>Sheetmetal Shop</text><rect x='16.5' y='647.3' width='8' height='212'/><rect x='683.5' y='700.3' width='8' height='100'/><rect x='446.1' y='815.7' width='136' height='8'/><rect x='226.1' y='815.7' width='136' height='8'/><rect x='1294.3' y='495.9' width='8' height='285'/><rect x='872' y='831.6' width='8' height='212'/><rect x='948.3' y='40.1' width='8' height='363.4'/><rect x='783.3' y='29.1' width='8' height='375'/><rect x='1139.5' y='882.8' fill='#D1D3D4' stroke='#939598' stroke-width='0.5' stroke-miterlimit='10' width='63' height='154.5'/><text transform='matrix(1 0 0 1 1151.6841 965.3203)' font-family='MyriadPro-Regular' font-size='24'>2/3</text><text transform='matrix(0.85 0 0 1 921.9355 938.3223)' fill='#FCD3C1' font-family='MyriadPro-Regular' font-size='48'>Hangar 5</text><text transform='matrix(1 0 0 1 973.479 967.1221)' fill='#FCD3C1' font-family='MyriadPro-Regular' font-size='24'>Paint</text><rect x='883.1' y='798.8' width='30' height='25.5'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' stroke-dasharray='6,4' x1='389.1' y1='827.3' x2='389.1' y2='682.8'/><g><rect x='411.7' y='811.3' fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' width='29.9' height='12.3'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='418.5' y1='823.8' x2='418.5' y2='811.4'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='412.9' y1='823.8' x2='412.9' y2='811.4'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='424' y1='823.8' x2='424' y2='811.4'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='429.5' y1='823.8' x2='429.5' y2='811.4'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='435.1' y1='823.8' x2='435.1' y2='811.4'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='440.6' y1='823.8' x2='440.6' y2='811.4'/></g><g><rect x='176.9' y='636.2' fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' width='12.3' height='29.9'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='189.4' y1='659.3' x2='177' y2='659.3'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='189.4' y1='664.9' x2='177' y2='664.9'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='189.4' y1='653.8' x2='177' y2='653.8'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='189.4' y1='648.2' x2='177' y2='648.2'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='189.4' y1='642.7' x2='177' y2='642.7'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='189.4' y1='637.2' x2='177' y2='637.2'/></g><g><rect x='1153.9' y='67.2' fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' width='12.3' height='29.9'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='1166.4' y1='90.3' x2='1154' y2='90.3'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='1166.4' y1='95.9' x2='1154' y2='95.9'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='1166.4' y1='84.8' x2='1154' y2='84.8'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='1166.4' y1='79.2' x2='1154' y2='79.2'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='1166.4' y1='73.7' x2='1154' y2='73.7'/><line fill='none' stroke='#000000' stroke-width='0.5' stroke-miterlimit='10' x1='1166.4' y1='68.2' x2='1154' y2='68.2'/></g><g><rect x='450.1' y='680.7' fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' width='27.3' height='11.2'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='456.4' y1='692.1' x2='456.4' y2='680.8'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='451.2' y1='692.1' x2='451.2' y2='680.8'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='461.4' y1='692.1' x2='461.4' y2='680.8'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='466.5' y1='692.1' x2='466.5' y2='680.8'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='471.5' y1='692.1' x2='471.5' y2='680.8'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='476.5' y1='692.1' x2='476.5' y2='680.8'/></g><g><rect x='25.7' y='635.9' fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' width='27.3' height='11.2'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='32' y1='647.2' x2='32' y2='636'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='26.8' y1='647.2' x2='26.8' y2='636'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='37' y1='647.2' x2='37' y2='636'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='42' y1='647.2' x2='42' y2='636'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='47.1' y1='647.2' x2='47.1' y2='636'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='52.1' y1='647.2' x2='52.1' y2='636'/></g><g><rect x='562.1' y='680.7' fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' width='27.3' height='11.2'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='568.4' y1='692.1' x2='568.4' y2='680.8'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='563.2' y1='692.1' x2='563.2' y2='680.8'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='573.4' y1='692.1' x2='573.4' y2='680.8'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='578.5' y1='692.1' x2='578.5' y2='680.8'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='583.5' y1='692.1' x2='583.5' y2='680.8'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='588.5' y1='692.1' x2='588.5' y2='680.8'/></g><g><rect x='215.8' y='680.4' fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' width='27.3' height='11.2'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='222' y1='691.8' x2='222' y2='680.5'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='216.9' y1='691.8' x2='216.9' y2='680.5'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='227' y1='691.8' x2='227' y2='680.5'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='232.1' y1='691.8' x2='232.1' y2='680.5'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='237.1' y1='691.8' x2='237.1' y2='680.5'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='242.2' y1='691.8' x2='242.2' y2='680.5'/></g><g><rect x='575.7' y='390.9' fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' width='27.3' height='11.2'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='581.9' y1='402.2' x2='581.9' y2='391'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='576.8' y1='402.2' x2='576.8' y2='391'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='587' y1='402.2' x2='587' y2='391'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='592' y1='402.2' x2='592' y2='391'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='597' y1='402.2' x2='597' y2='391'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='602.1' y1='402.2' x2='602.1' y2='391'/></g><g><rect x='736.7' y='390.9' fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' width='27.3' height='11.2'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='743' y1='402.2' x2='743' y2='391'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='737.8' y1='402.2' x2='737.8' y2='391'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='748' y1='402.2' x2='748' y2='391'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='753' y1='402.2' x2='753' y2='391'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='758.1' y1='402.2' x2='758.1' y2='391'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='763.1' y1='402.2' x2='763.1' y2='391'/></g><g><rect x='576.7' y='391.9' fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' width='27.3' height='11.2'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='583' y1='403.2' x2='583' y2='392'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='577.8' y1='403.2' x2='577.8' y2='392'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='588' y1='403.2' x2='588' y2='392'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='593' y1='403.2' x2='593' y2='392'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='598.1' y1='403.2' x2='598.1' y2='392'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='603.1' y1='403.2' x2='603.1' y2='392'/></g><g><rect x='733.7' y='30.9' fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' width='27.3' height='11.2'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='739.9' y1='42.2' x2='739.9' y2='31'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='734.8' y1='42.2' x2='734.8' y2='31'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='745' y1='42.2' x2='745' y2='31'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='750' y1='42.2' x2='750' y2='31'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='755' y1='42.2' x2='755' y2='31'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='760.1' y1='42.2' x2='760.1' y2='31'/></g><g><rect x='573.7' y='31.9' fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' width='27.3' height='11.2'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='579.9' y1='43.2' x2='579.9' y2='32'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='574.8' y1='43.2' x2='574.8' y2='32'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='585' y1='43.2' x2='585' y2='32'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='590' y1='43.2' x2='590' y2='32'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='595' y1='43.2' x2='595' y2='32'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='600.1' y1='43.2' x2='600.1' y2='32'/></g><g><rect x='735.7' y='391.9' fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' width='27.3' height='11.2'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='742' y1='403.2' x2='742' y2='392'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='736.8' y1='403.2' x2='736.8' y2='392'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='747' y1='403.2' x2='747' y2='392'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='752' y1='403.2' x2='752' y2='392'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='757.1' y1='403.2' x2='757.1' y2='392'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='762.1' y1='403.2' x2='762.1' y2='392'/></g><g><rect x='341.3' y='680.4' fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' width='27.3' height='11.2'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='347.5' y1='691.8' x2='347.5' y2='680.5'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='342.4' y1='691.8' x2='342.4' y2='680.5'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='352.5' y1='691.8' x2='352.5' y2='680.5'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='357.6' y1='691.8' x2='357.6' y2='680.5'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='362.6' y1='691.8' x2='362.6' y2='680.5'/><line fill='none' stroke='#000000' stroke-width='0.4563' stroke-miterlimit='10' x1='367.7' y1='691.8' x2='367.7' y2='680.5'/></g></g></g>"
}

window.anAircraft = {
    "id":"svg_1332",
    "x" : "230",
    "y" : "300",
    "rotation": "90",
    "rx":"0",
    "ry":"0",
    "label":"null",
    "labelFontSize":"6",
    "labelYPos":"16",
    "svgString":"<g id='collision'><path id='rt_tail' d='M25.027,45.173l10.062,1.699v-1.838c0-0.16-0.049-0.195-0.209-0.278L34.5,44.598l-8.957-3.734L25.027,45.173z'/><path id='lt_tail' d='M24.271,40.858l-8.967,3.739l-0.381,0.154c-0.16,0.084-0.207,0.119-0.207,0.279v1.838l10.066-1.7L24.271,40.858z'/><path id='fuselage' d='M25.542,40.863c0.438-1.581,0.963-4.062,1.271-5.605c-0.021,0.233-0.047,0.413-0.069,0.523l1.407-1.001l0.019-0.115l0.178-0.06c0.141-0.045,0.195-0.124,0.229-0.276l0.166-0.662c0.026-0.146,0.026-0.188-0.058-0.273l-0.279-0.234l0,0l0.066-0.425l1.141,0.016c0-0.002,0.002-0.006,0.005-0.008c0.016-0.023,0.026-0.046,0.038-0.068l0,0c0.392-0.704,0.535-1.637,0.603-2.128l0.119-3.597c-0.004-0.072-0.013-0.146-0.021-0.221l-2.062-7.015l-0.494-0.03l-0.203-0.017L27.58,7.618c-0.041-5.936-2.037-7.499-2.67-7.494c-0.635-0.005-2.631,1.562-2.674,7.494l-0.01,12.048l-0.209,0.018V19.68l-1.76,0.115l-0.793,6.93c-0.012,0.067-0.02,0.146-0.021,0.221l0.119,3.596c0.065,0.491,0.211,1.424,0.603,2.127H20.16c0.014,0.025,0.027,0.055,0.042,0.075c0.001,0.001,0.001,0.002,0.001,0.003l1.141-0.016l0.065,0.424l0,0l-0.279,0.236c-0.084,0.085-0.084,0.131-0.056,0.272l0.164,0.661c0.033,0.153,0.09,0.231,0.231,0.277l0.175,0.06l0,0l0.018,0.115l1.408,1c-0.024-0.109-0.049-0.291-0.071-0.522c0.31,1.545,0.832,4.021,1.272,5.604l0.512,4.312v0.507c0,0.062,0.053,0.117,0.119,0.117c0.065,0,0.125-0.055,0.125-0.117l0,0v-0.506L25.542,40.863z'/><path id='rt_wing' d='M30.351,26.723l19.031-3.132l-0.01-1.396l0.002,0.187c0.041,0,0.063-0.042,0.084-0.088l0.051-0.001c0.02,0,0.035-0.016,0.033-0.035c0-0.02-0.019-0.032-0.033-0.032h-0.031c0.002-0.02,0.004-0.03,0.004-0.04c-0.002-0.136-0.062-0.153-0.107-0.156l0.002,0.157h-0.002l-0.004-0.522c0-0.15,0.031-0.491-0.524-0.573l-20.554-1.373L30.351,26.723z'/><path id='lt_wing' d='M20.254,19.797L0.975,21.086c-0.562,0.081-0.529,0.421-0.531,0.573l-0.002,0.522H0.439l0.002-0.158c-0.045,0.003-0.106,0.021-0.107,0.157c0,0.009,0.001,0.021,0.004,0.037H0.309c-0.021-0.001-0.035,0.019-0.037,0.034c0,0.021,0.017,0.036,0.037,0.036h0.049c0.017,0.047,0.043,0.088,0.084,0.088L0.434,23.59l19.028,3.133L20.254,19.797z'/></g><g id='silhouette_1_'><path id='silhouette' d='M21.961,7.49l-0.012,12.048l-0.207,0.015l0,0l-1.76,0.117l-19.28,1.289c-0.562,0.081-0.529,0.421-0.53,0.573l-0.003,0.522H0.168l0.001-0.158c-0.044,0.003-0.106,0.021-0.106,0.154c0,0.012,0,0.022,0.004,0.04h-0.03c-0.021,0-0.036,0.019-0.037,0.035c0,0.021,0.016,0.036,0.036,0.036h0.049c0.017,0.047,0.043,0.088,0.084,0.088l-0.008,1.213l19.028,3.13c-0.012,0.072-0.02,0.146-0.021,0.225l0.119,3.596c0.063,0.492,0.21,1.424,0.603,2.128h-0.002c0.016,0.024,0.029,0.051,0.043,0.075l0.002,0.002l1.141-0.016l0.064,0.424l0,0l-0.277,0.237c-0.086,0.085-0.086,0.13-0.058,0.271l0.164,0.662c0.034,0.152,0.091,0.23,0.231,0.276l0.175,0.06l0,0l0.019,0.115l1.407,1.001c-0.022-0.11-0.048-0.291-0.071-0.524c0.311,1.546,0.832,4.021,1.272,5.604l-8.968,3.736l-0.379,0.156c-0.161,0.085-0.209,0.119-0.209,0.279v1.838l10.066-1.7v0.506c0,0.064,0.053,0.118,0.119,0.118c0.064,0,0.125-0.053,0.125-0.118l0,0v-0.504l10.06,1.698v-1.838c0-0.16-0.047-0.195-0.207-0.278l-0.381-0.157l-8.957-3.732c0.439-1.581,0.962-4.062,1.271-5.604c-0.023,0.231-0.047,0.411-0.07,0.522l1.408-1.002l0.018-0.115l0.176-0.06c0.143-0.045,0.195-0.124,0.23-0.276l0.164-0.662c0.027-0.146,0.027-0.188-0.057-0.271l-0.277-0.236l0,0l0.062-0.425l1.144,0.016c0.002-0.002,0.004-0.006,0.006-0.008c0.014-0.022,0.025-0.046,0.039-0.067H29.38c0.391-0.705,0.535-1.638,0.602-2.128l0.119-3.598c-0.004-0.072-0.012-0.146-0.021-0.221l19.031-3.133l-0.01-1.396v0.187c0.041,0,0.068-0.042,0.084-0.088l0.051-0.001c0.021,0,0.035-0.016,0.035-0.035c0-0.019-0.016-0.031-0.035-0.031h-0.031c0.004-0.021,0.006-0.031,0.006-0.04c-0.002-0.137-0.062-0.154-0.104-0.157v0.158l0,0L49.1,21.536c-0.002-0.153,0.03-0.492-0.529-0.574L28.023,19.59l-0.494-0.029l-0.205-0.018L27.312,7.494C27.269,1.558,25.273-0.005,24.639,0C23.998-0.009,22.003,1.552,21.961,7.49z'/></g><g id='planebody' opacity='0.5'><g id='Layer_1_61_'><g id='Engine'><g><path fill='#FFFFFF' stroke='#000000' stroke-width='0.25' d='M23.535,27.417L0.286,23.593l0.012-1.934c0.002-0.152-0.03-0.491,0.529-0.573l22.331-1.492h3.207l22.33,1.492c0.561,0.081,0.527,0.421,0.529,0.573l0.012,1.934l-23.248,3.824H23.535z'/><path fill='#FFFFFF' stroke='#000000' stroke-width='0.25' d='M24.707,42.344c-0.508-0.259-1.837-6.938-2.083-8.263c-0.245-1.325-0.567-6.076-0.55-6.381c0.021-0.306,0.023-0.916-0.004-1.765l0.017-18.319c0.042-5.937,2.038-7.498,2.675-7.494c0.636-0.004,2.632,1.562,2.675,7.494l0.016,18.319c-0.027,0.849-0.021,1.459-0.006,1.765c0.021,0.305-0.303,5.056-0.549,6.381c-0.244,1.324-1.576,8.004-2.082,8.263H24.707L24.707,42.344z'/><g><g><g><path fill='#FFFFFF' d='M27.496,19.74l0.019,2.374l21.67-0.232c-0.002-0.136,0.196-0.608-0.57-0.74L27.496,19.74z'/><path fill='#D9D9D9' d='M27.496,19.74l0.006,0.837l21.541,0.966c-0.002-0.135-0.065-0.312-0.434-0.4L27.496,19.74z'/></g></g><g><g><path fill='#FFFFFF' d='M22.027,19.74l-0.016,2.374L0.343,21.882c0.001-0.136-0.2-0.608,0.569-0.74L22.027,19.74z'/><path fill='#D9D9D9' d='M22.027,19.74l-0.006,0.837L0.48,21.543c0-0.136,0.069-0.312,0.433-0.401L22.027,19.74z'/></g></g></g><g><path fill='none' stroke='#000000' stroke-width='0.25' d='M26.99,3.542l-0.617,0.004c-0.276,0.002-0.561,0.105-0.531,0.389l0.185,1.649c0.045,0.245,0.248,0.38,0.429,0.378l0.905-0.006'/><path d='M24.936,6.602l0.01,1.585c0,0.085-0.041,0.17,0.129,0.186c0.254,0.032,0.713,0.25,0.92,0.646c0.117,0.169,0.396,0.142,0.521,0.069c0.312-0.121,0.868-0.583,0.864-0.974c0.021-0.312-0.157-0.881-0.467-1.082c-0.397-0.251-1.231-0.602-1.83-0.598C24.984,6.44,24.934,6.525,24.936,6.602z'/><path d='M26.365,9.686l0.002,0.509c0.002,0.102,0.062,0.178,0.197,0.177l0.662-0.004c0.102-0.001,0.127-0.035,0.125-0.12l-0.01-1.552c-0.002-0.067-0.035-0.075-0.068-0.017c-0.102,0.146-0.354,0.417-0.732,0.646C26.363,9.465,26.363,9.549,26.365,9.686z'/><g><path fill='#666666' d='M27.349,7.831c-0.062-0.29-0.219-0.617-0.436-0.76c-0.4-0.252-1.234-0.604-1.832-0.599c-0.103,0.001-0.151,0.085-0.151,0.159l0.01,1.335c0.583-0.004,1.926-0.014,1.926-0.014C27.07,7.947,27.281,7.954,27.349,7.831z'/></g><path fill='#FFFFFF' stroke='#000000' stroke-width='0.25' d='M25.33,6.088l0.002,0.416c0.002,0.097,0.021,0.188,0.23,0.193c0.312,0.015,1.02,0.229,1.311,0.499c0.053,0.051,0.104,0.017,0.104-0.021L26.975,6.7c-0.002-0.076-0.248-0.312-0.453-0.421C26.109,6.067,25.326,5.742,25.33,6.088z'/><path fill='none' stroke='#000000' stroke-width='0.25' d='M22.531,3.542l0.619,0.004c0.281,0.002,0.56,0.105,0.533,0.389L23.5,5.584c-0.044,0.245-0.249,0.38-0.428,0.378l-0.907-0.006'/><path d='M24.588,6.602l-0.012,1.585c0,0.085,0.043,0.17-0.127,0.186c-0.256,0.032-0.715,0.25-0.92,0.646c-0.121,0.169-0.4,0.142-0.519,0.069c-0.313-0.121-0.87-0.583-0.866-0.974c-0.023-0.312,0.158-0.881,0.465-1.082c0.4-0.251,1.234-0.602,1.828-0.598C24.538,6.44,24.59,6.525,24.588,6.602z'/><path d='M23.158,9.686l-0.002,0.509c-0.002,0.102-0.062,0.178-0.197,0.177l-0.661-0.004c-0.103-0.001-0.128-0.035-0.127-0.12l0.013-1.552c0-0.067,0.034-0.075,0.066-0.017c0.102,0.146,0.354,0.417,0.732,0.646C23.16,9.465,23.16,9.549,23.158,9.686z'/><path d='M22.381,13.229c-0.156,0-0.216-0.127-0.216-0.284v-0.317c0-0.154,0.062-0.285,0.216-0.285c0.156,0,0.354,0.131,0.354,0.285v0.317C22.734,13.101,22.538,13.229,22.381,13.229z'/><g><path d='M22.381,15.04c-0.156,0-0.216-0.128-0.216-0.285V14.44c0-0.157,0.062-0.284,0.216-0.284c0.156,0,0.354,0.127,0.354,0.284v0.313C22.734,14.914,22.538,15.04,22.381,15.04z'/><path d='M22.381,16.709c-0.156,0-0.216-0.128-0.216-0.284V16.11c0-0.156,0.062-0.284,0.216-0.284c0.156,0,0.354,0.128,0.354,0.284v0.314C22.734,16.582,22.538,16.709,22.381,16.709z'/></g><path d='M22.381,18.341c-0.156,0-0.216-0.128-0.216-0.281v-0.316c0-0.157,0.062-0.284,0.216-0.284c0.156,0,0.354,0.127,0.354,0.284v0.316C22.734,18.214,22.538,18.341,22.381,18.341z'/><path d='M22.381,20.008c-0.156,0-0.216-0.127-0.216-0.28V19.41c0-0.157,0.062-0.284,0.216-0.284c0.156,0,0.354,0.127,0.354,0.284v0.317C22.734,19.881,22.538,20.008,22.381,20.008z'/><path d='M22.381,21.631c-0.156,0-0.216-0.127-0.216-0.281v-0.316c0-0.157,0.062-0.284,0.216-0.284c0.156,0,0.354,0.127,0.354,0.284v0.316C22.734,21.505,22.538,21.631,22.381,21.631z'/><path fill='none' stroke='#000000' stroke-width='0.25' d='M22.082,13.644h0.811c0.16,0,0.289-0.13,0.289-0.288v-1.141c0-0.155-0.129-0.285-0.289-0.285h-0.808'/><path fill='none' stroke='#000000' stroke-width='0.25' d='M27.451,22.732h-0.396c-0.16,0-0.289,0.13-0.289,0.289v1.005c0,0.159,0.129,0.289,0.289,0.289h0.396'/><line fill='none' stroke='#000000' stroke-width='0.25' x1='26.541' y1='2.129' x2='22.98' y2='2.129'/><g><path fill='#666666' d='M22.172,7.831c0.062-0.29,0.219-0.617,0.438-0.76c0.399-0.252,1.233-0.604,1.828-0.599c0.102,0.001,0.15,0.085,0.149,0.159l-0.009,1.335c-0.586-0.004-1.926-0.014-1.926-0.014C22.451,7.947,22.242,7.954,22.172,7.831z'/></g><path fill='#FFFFFF' stroke='#000000' stroke-width='0.25' d='M24.193,6.088l-0.002,0.416c-0.002,0.097-0.02,0.188-0.23,0.193c-0.312,0.015-1.02,0.229-1.311,0.499c-0.051,0.051-0.102,0.017-0.102-0.021L22.551,6.7c0-0.076,0.249-0.312,0.452-0.421C23.412,6.067,24.195,5.742,24.193,6.088z'/><g><path d='M27.138,13.229c0.156,0,0.217-0.127,0.217-0.284v-0.317c0-0.154-0.061-0.285-0.217-0.285s-0.352,0.131-0.352,0.285v0.317C26.787,13.101,26.982,13.229,27.138,13.229z'/><g><path d='M27.138,15.04c0.156,0,0.217-0.128,0.217-0.285V14.44c0-0.157-0.061-0.284-0.217-0.284s-0.352,0.127-0.352,0.284v0.313C26.787,14.914,26.982,15.04,27.138,15.04z'/><path d='M27.138,16.709c0.156,0,0.217-0.128,0.217-0.284V16.11c0-0.156-0.061-0.284-0.217-0.284s-0.352,0.128-0.352,0.284v0.314C26.787,16.582,26.982,16.709,27.138,16.709z'/></g><path d='M27.138,18.341c0.156,0,0.217-0.128,0.217-0.281v-0.316c0-0.157-0.061-0.284-0.217-0.284s-0.352,0.127-0.352,0.284v0.316C26.787,18.214,26.982,18.341,27.138,18.341z'/><path d='M27.138,20.008c0.156,0,0.217-0.127,0.217-0.28V19.41c0-0.157-0.061-0.284-0.217-0.284s-0.352,0.127-0.352,0.284v0.317C26.787,19.881,26.982,20.008,27.138,20.008z'/><path d='M27.138,21.631c0.156,0,0.217-0.127,0.217-0.281v-0.316c0-0.157-0.061-0.284-0.217-0.284s-0.352,0.127-0.352,0.284v0.316C26.787,21.505,26.982,21.631,27.138,21.631z'/></g></g><path fill='#FFFFFF' stroke='#000000' stroke-width='0.25' d='M24.742,45.155l-10.174,1.719v-1.838c0-0.16,0.049-0.195,0.209-0.279l9.978-4.156l9.979,4.156c0.16,0.084,0.209,0.119,0.209,0.279v1.838l-10.175-1.719H24.742z'/><g><polyline fill='none' stroke='#000000' stroke-width='0.25' points='25.587,45.293 25.587,43.581 34.472,46.005 34.472,45.221 34.734,45.221 34.734,46.837 '/><line fill='none' stroke='#000000' stroke-width='0.25' x1='34.734' y1='46.398' x2='34.941' y2='46.398'/><polyline fill='none' stroke='#000000' stroke-width='0.25' points='34.472,45.221 34.472,44.971 34.935,44.971 '/><polyline fill='none' stroke='#000000' stroke-width='0.25' points='34.472,46.005 34.472,46.148 25.589,43.997 '/><g><polygon points='34.353,44.948 34.353,44.598 25.232,40.794 25.232,41.213 '/></g><polyline fill='none' stroke='#000000' stroke-width='0.25' points='23.924,45.293 23.924,43.581 15.039,46.005 15.039,45.221 14.777,45.221 14.777,46.837 '/><line fill='none' stroke='#000000' stroke-width='0.25' x1='14.777' y1='46.398' x2='14.57' y2='46.398'/><polyline fill='none' stroke='#000000' stroke-width='0.25' points='15.039,45.221 15.039,44.971 14.576,44.971 '/><polyline fill='none' stroke='#000000' stroke-width='0.25' points='15.039,46.005 15.039,46.148 23.922,43.997 '/><g><polygon points='15.158,44.948 15.158,44.598 24.281,40.794 24.281,41.213 '/></g></g><g><g><path fill='#FFFFFF' stroke='#000000' stroke-width='0.25' d='M24.762,33.711c-0.633,0-0.564,2.441-0.531,3.696l0.265,5.395l0.146,0.202h0.246l0.145-0.202l0.263-5.395C25.326,36.153,25.394,33.711,24.762,33.711z'/><path fill='#FFFFFF' stroke='#000000' stroke-width='0.25' d='M24.762,40.358c-0.576,0-0.238,3.02,0,5.325C24.998,43.377,25.337,40.358,24.762,40.358z'/><ellipse fill='#FF0000' cx='24.762' cy='42.766' rx='0.139' ry='0.313'/></g><g><rect x='24.638' y='44.448' fill='#FFFFFF' stroke='#000000' stroke-width='0.25' width='0.243' height='1.229'/><path fill='#FFFFFF' stroke='#000000' stroke-width='0.25' d='M24.637,45.677c0,0.064,0.053,0.118,0.118,0.118s0.125-0.053,0.125-0.118H24.637z'/></g></g><g><g><g><g><g><g><path fill='#FFFFFF' stroke='#000000' stroke-width='0.25' d='M49.363,22.292c0.021,0,0.035-0.017,0.035-0.036c0-0.019-0.018-0.032-0.037-0.032H49.3c-0.021,0-0.035,0.017-0.035,0.032c0,0.021,0.016,0.036,0.035,0.035L49.363,22.292L49.363,22.292z'/><path fill='#008837' d='M49.228,22.025c0.043,0.003,0.105,0.021,0.105,0.156l-0.105,0.002V22.025z'/><path fill='#FFFFFF' stroke='#000000' stroke-width='0.25' d='M49.335,22.181c0,0.04-0.027,0.195-0.105,0.196l-0.002-0.195L49.335,22.181z'/></g><polyline fill='none' stroke='#000000' stroke-width='0.25' points='41.382,23.794 41.621,23.771 41.595,23.34 '/><polyline fill='none' stroke='#000000' stroke-width='0.25' points='41.462,24.872 41.335,23.354 42.533,23.268 42.558,23.674 43.011,23.637 42.988,23.236 44.132,23.155 44.15,23.494 44.39,23.482 44.378,23.135 48.531,22.844 48.531,22.993 48.611,22.993 48.605,22.177 48.99,22.175 48.986,23.627 '/><polyline fill='none' stroke='#000000' stroke-width='0.25' points='38.871,25.297 38.767,24.485 28.609,25.741 28.722,26.966 '/></g></g><g><g><g><path fill='#FFFFFF' stroke='#000000' stroke-width='0.25' d='M0.16,22.292c-0.02,0-0.035-0.017-0.035-0.036c0-0.019,0.018-0.032,0.036-0.032l0.062,0.001c0.02,0,0.035,0.017,0.035,0.032c0,0.021-0.018,0.036-0.036,0.035H0.16z'/><path fill='#FF0000' d='M0.294,22.025c-0.044,0.003-0.104,0.021-0.106,0.156l0.105,0.002L0.294,22.025z'/><path fill='#FFFFFF' stroke='#000000' stroke-width='0.25' d='M0.188,22.181c0,0.04,0.027,0.195,0.105,0.196l0.001-0.195L0.188,22.181z'/></g><polyline fill='none' stroke='#000000' stroke-width='0.25' points='8.139,23.794 7.902,23.771 7.928,23.34 '/><polyline fill='none' stroke='#000000' stroke-width='0.25' points='8.061,24.872 8.188,23.354 6.988,23.268 6.963,23.674 6.512,23.637 6.535,23.236 5.391,23.155 5.371,23.494 5.133,23.482 5.145,23.135 0.992,22.844 0.99,22.993 0.911,22.993 0.916,22.177 0.531,22.175 0.536,23.627 '/><polyline fill='none' stroke='#000000' stroke-width='0.25' points='10.652,25.297 10.755,24.485 20.913,25.741 20.799,26.966 '/></g></g></g><g><polygon fill='none' stroke='#000000' stroke-width='0.25' points='36.746,23.986 36.738,23.891 36.564,23.907 36.572,24 36.443,24.01 36.435,23.914 36.191,23.936 36.199,24.033 36.083,24.042 36.07,23.897 35.671,23.93 35.683,24.078 35.568,24.087 35.56,23.99 35.316,24.01 35.324,24.109 35.195,24.121 35.187,24.027 35.013,24.041 35.021,24.135 34.794,24.155 34.826,24.505 36.931,24.323 36.902,23.971 '/><polygon fill='none' stroke='#000000' stroke-width='0.25' points='12.777,23.986 12.785,23.891 12.957,23.907 12.949,24 13.078,24.01 13.086,23.914 13.331,23.936 13.322,24.033 13.439,24.042 13.451,23.897 13.852,23.93 13.838,24.078 13.953,24.087 13.962,23.99 14.206,24.01 14.199,24.109 14.326,24.121 14.335,24.027 14.508,24.041 14.5,24.135 14.727,24.155 14.695,24.505 12.59,24.323 12.62,23.971 '/></g></g><g><g><g><polygon fill='#B3E3EE' points='1.012,21.411 1.016,21.076 21.867,19.679 21.863,20.382 '/></g></g><g><g><polygon fill='none' stroke='#000000' stroke-width='0.25' points='1.012,21.411 1.016,21.076 21.867,19.679 21.863,20.382 '/></g></g></g><g><g><g><polygon fill='#B3E3EE' points='48.509,21.411 48.505,21.076 27.652,19.679 27.658,20.382 '/></g></g><g><g><polygon fill='none' stroke='#000000' stroke-width='0.25' points='48.509,21.411 48.505,21.076 27.652,19.679 27.658,20.382 '/></g></g></g></g><g><g><path fill='#FFFFFF' stroke='#000000' stroke-width='0.25' d='M28.056,27.045l-0.85-0.063c-0.138,0-0.203,0.103-0.203,0.307c0.018,0.646-0.188,7.479-0.406,8.497l1.408-1.001l0.354-2.289L28.056,27.045z'/><path fill='#FFFFFF' stroke='#000000' stroke-width='0.25' d='M28.294,25.925l1.492,0.034c0.233,0.067,0.424,0.542,0.438,0.983l-0.119,3.596c-0.063,0.51-0.222,1.493-0.646,2.205l-1.172-0.017c-0.34-0.543-0.438-1.662-0.459-2.238l0.021-3.479C27.921,26.487,28.107,25.925,28.294,25.925z'/><g><g><path fill='#333333' stroke='#000000' stroke-width='0.25' d='M28.294,32.729l1.17,0.016c0.016-0.021,0.029-0.051,0.045-0.076l-1.271-0.037C28.255,32.666,28.275,32.698,28.294,32.729z'/></g><path fill='#B3E3EE' stroke='#000000' stroke-width='0.25' d='M29.787,25.96l-1.492-0.033c-0.1,0-0.192,0.155-0.274,0.384l2.086,0.032C30.023,26.146,29.912,25.997,29.787,25.96z'/></g><g><g><path fill='#6D6D6D' d='M28.537,33.389l-0.277-0.234l-0.231,1.511l0.177-0.059c0.143-0.046,0.194-0.125,0.229-0.277l0.164-0.662C28.623,33.521,28.623,33.475,28.537,33.389z'/></g><g><path fill='none' stroke='#000000' stroke-width='0.25' d='M28.537,33.389l-0.277-0.234l-0.231,1.511l0.177-0.059c0.143-0.046,0.194-0.125,0.229-0.277l0.164-0.662C28.623,33.521,28.623,33.475,28.537,33.389z'/></g></g></g><g><path fill='#FFFFFF' stroke='#000000' stroke-width='0.25' d='M21.465,27.045l0.85-0.063c0.135,0,0.203,0.103,0.203,0.307c-0.018,0.646,0.188,7.479,0.407,8.497l-1.407-1.001l-0.357-2.289L21.465,27.045z'/><path fill='#FFFFFF' stroke='#000000' stroke-width='0.25' d='M21.229,25.925l-1.494,0.034c-0.237,0.067-0.424,0.542-0.44,0.983l0.119,3.596c0.067,0.51,0.222,1.493,0.646,2.205l1.17-0.017c0.34-0.543,0.44-1.662,0.459-2.238l-0.019-3.479C21.602,26.487,21.414,25.925,21.229,25.925z'/><g><g><path fill='#333333' stroke='#000000' stroke-width='0.25' d='M21.229,32.729l-1.17,0.016c-0.017-0.021-0.031-0.051-0.045-0.076l1.27-0.037C21.266,32.666,21.246,32.698,21.229,32.729z'/></g><path fill='#B3E3EE' stroke='#000000' stroke-width='0.25' d='M19.736,25.96l1.492-0.033c0.099,0,0.197,0.155,0.278,0.384l-2.087,0.032C19.499,26.146,19.609,25.997,19.736,25.96z'/></g><g><g><path fill='#6D6D6D' d='M20.984,33.389l0.278-0.234l0.234,1.511l-0.175-0.059c-0.141-0.046-0.197-0.125-0.23-0.277l-0.164-0.662C20.9,33.521,20.9,33.475,20.984,33.389z'/></g><g><path fill='none' stroke='#000000' stroke-width='0.25' d='M20.984,33.389l0.278-0.234l0.234,1.511l-0.175-0.059c-0.141-0.046-0.197-0.125-0.23-0.277l-0.164-0.662C20.9,33.521,20.9,33.475,20.984,33.389z'/></g></g></g></g></g></g></g></g><g id='landing_gear'><path id='main_landing_gear' fill='none' stroke='#000000' stroke-width='0.25' stroke-dasharray='0.0383,0.0383' d='M24.715,5.967c-0.078,0-0.143-0.067-0.143-0.154V4.788c0-0.087,0.064-0.158,0.143-0.158h0.092c0.079,0,0.143,0.071,0.143,0.158V5.81c0,0.087-0.062,0.154-0.143,0.154L24.715,5.967L24.715,5.967z'/><path id='rt_landing_gear' fill='none' stroke='#000000' stroke-width='0.25' stroke-dasharray='0.0383,0.0383' d='M32.507,24.414c-0.137,0-0.248-0.093-0.248-0.207v-1.34c0-0.114,0.111-0.207,0.248-0.207h0.16c0.139,0,0.248,0.093,0.248,0.207v1.34c0,0.114-0.109,0.207-0.248,0.207H32.507z'/><path id='lt_landing_gear' fill='none' stroke='#000000' stroke-width='0.25' stroke-dasharray='0.0383,0.0383' d='M17.016,24.414c0.137,0,0.247-0.093,0.247-0.207v-1.34c0-0.114-0.11-0.207-0.247-0.207h-0.162c-0.137,0-0.248,0.093-0.248,0.207v1.34c0,0.114,0.111,0.207,0.248,0.207H17.016z'/></g><g id='Rotation_dot_left'><circle id='Rotation_dot_left_1_' fill='#FF0000' cx='16.695' cy='19.928' r='0.852'/></g><g id='Rotation_dot_right'><circle id='Rotation_dot_right_1_' fill='#FF0000' cx='32.464' cy='19.858' r='0.852'/></g><g id='Grab_dot_front'><circle id='Grab_dot_front_1_'  fill='#FF0000' cx='24.762' cy='5.306' r='2.208'/></g>"
}




// Section 3) Append necessary HTML elements (if it's a left-toolbar button define it according to svg-edit extension docs in return object.)------------------------











//Section 4) Functions for extension-------------------------------------------------------------------------------------------------------------------------------



//add necessary classes to head here instead of polluting the css files

$("<style>")
    .prop("type", "text/css")
    .html("\
.airfield,\
.plane{\
  pointer-events:none !important;\
}\
.planeGrab{\
  pointer-events:all !important;\
}\
    }")
    .appendTo("head");







//Allows import of single SVG element in the editor - uses string concatenation, might be too slow, might be able to use webWorker for string concat
window.importAirfield = function(object){

    setTimeout(function(){

        spinnerLock(true); //show spinner

        svgCanvas.setResolution(object.width,object.height); //set canvas size

        var source = svgCanvas.getSvgString(); //get source as string
        source = source.substring(0, source.length - 7); //chop of the ending '</svg>' tag

        var svgString = object.svgString;
        source = source + svgString; //concatenate source string with element string

        source = source + "</svg>" //reappend closing '</svg>' tag
        svgCanvas.setSvgString(source)  //reinject back to editor

        spinnerLock(false); //stop spinner and allow user interaction

    },400)

}


//Allows import of multiple SVG element in the editor - uses string concatenation, might be too slow, might be able to use webWorker for string concat

window.importElementToCanvas = function(objects){

    spinnerLock(true);

    var perfTime = measureTime();

    setTimeout(function(){

        var source = svgCanvas.getSvgString(); //grab source
        source = source.substring(0, source.length - 7);

        for (var i = 0; i < objects.length; i++) {

            var textLabel;
            if(objects[i].label!=="null"){
              textLabel = "<text xml:space='preserve' width='0' text-anchor='left' font-family='Helvetica, Arial, sans-serif' font-size='"+objects[i].labelFontSize+"' id='svg_"+getRandomId(2000,100000)+"' y='"+objects[i].labelYPos+"' x='0' stroke-width='0' stroke='#000' fill='#000000'>"+objects[i].label+"</text>"
            }else{
              textLabel ="";
            }

            var svgString = "<g id='svg_"+objects[i].id+"' transform='translate("+objects[i].x+","+objects[i].y+") rotate("+objects[i].rotation+" "+objects[i].rx+","+objects[i].ry+")' class='"+objectPrefix+"'>"+objects[i].svgString+""+textLabel+"</g>"
            source = source + svgString;
            
        };

        source = source + "</svg>"
        svgCanvas.setSvgString(source) //turn back to string and reinject it back as source

        spinnerLock(false);
        var perfEndTime = measureTime() - perfTime;

    },400)
}



//append element after/before another element already on the editor. Might be too slow.
window.insertElement = function(svgString,position,elementId){
    var source = svgCanvas.getSvgString(); //grab source
    var xmlStr =  $.parseXML(source); //make it a DOM 
    if(position==='before')
      $(xmlStr).find('#'+elementId).before(svgString) //append before the element the svgString using jQuery
    if(position==='after')
      $(xmlStr).find('#'+elementId).after(svgString) //append after the element the svgString using jQuery
    var finalSrc = new XMLSerializer().serializeToString(xmlStr); //reconvert DOM back to string
    svgCanvas.setSvgString(finalSrc);  //reinject it back to editor
}



//return random number, used for giving id's to various elements
function getRandomId(min,max){
    var result =  Math.floor(Math.random()*(max-min+1)+min);
    return String(result);
}


//helper function to measure performance 
function measureTime(){
    var d = new Date();
    var n = d.getTime();
    return n;
}



// Section 5) Extension Return object----------------------------------------------------------------------------------------------------------------------------------
    return {
        name: "objectImporter",
        svgicons: "extensions/vectorText-icon.xml", //this is not needed since we don't need an icon but the extension throws error without it.



    }

});