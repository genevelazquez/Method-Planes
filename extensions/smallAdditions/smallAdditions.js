//Small requests Script. I don't want to create .js files for each minor change/addition requests, so I'm putting them all here



//Remove tools

$(function() {
 $('#align_tools,#tool_cut,#path_panel,#tool_copy,#tool_paste,#tool_move_top,#tool_angle,#tool_ellipse,#tool_rect,#tool_move_bottom,#tool_move_up,#tool_move_down,#tool_wireframe, #tool_image,#tool_eyedropper, main_button, #sidepanels,#tool_fhpath,#color_tools,#palette,#tool_snap,#tool_clear,#canvas_panel ').remove();

 /*Some elements cannot be removed because their values need to be exposed for some Method-Draw function to work. 
 Disable them using CSS visibility and absolutes instead*/

 $('#tool_opacity,#tool_blur,.stroke_tool,#object_menu_btn,#tool_clone').css({'visibility':'hidden','position':'absolute','pointer-events':'none'});
 $('#tool_path').css('display','none');







//Add a group/ungroup button in the selected panel

   //Use helper function for positioning HTML elements
   $.fn.attachToPanelPosition = function(i) {
        if(i===0){i=1};
        i=i-1; 
        var elems = this.find('> *');
        if (elems.length > i) return elems.eq(i);
        else return this;
    }



  //toggle pen tool if click on menu_bar and pass is correct
  var isUp;
  var pass = "pen";
  $('#menu_bar').dblclick(function(){
    if(!isUp){
      var k = prompt("Enter the passphrase");
      if(k===pass){
        $( "#tool_path" ).toggle();
        isUp = true;
      }
    } else{
      $('#tool_path').css('display','none');
      isUp = false;

    }
  });



  //disable bounding box selection/resizing/rotation
  $("<style type='text/css'>#selectorGrip_resize_nw,#selectorGrip_resize_n,#selectorGrip_resize_ne,#selectorGrip_resize_sw,#selectorGrip_resize_e,#selectorGrip_resize_se,#selectorGrip_resize_s,#selectorGrip_resize_sw,#selectorGrip_resize_w{pointer-events:none;}</style>").appendTo("head");
  $("<style type='text/css'>#selectorGrip_rotate_nw,#selectorGrip_rotate_n,#selectorGrip_rotate_ne,#selectorGrip_rotate_sw,#selectorGrip_rotate_e,#selectorGrip_rotate_se,#selectorGrip_rotate_s,#selectorGrip_rotate_sw,#selectorGrip_rotate_w{pointer-events:none;}</style>").appendTo("head");


  //Disable handling planes from everywhere apart from the grab_dot 'the red dot on the front'
  function disablePlaneHandles(){
        var childNodes = $("#svgcontent")[0].childNodes;
        for (var i = 0; i < childNodes.length; i++) {
          console.log()
          $(childNodes[i]).find(".planeModel").find('path,circle,rect,ellipse').attr('style', 'pointer-events:none;');
          $(childNodes[i]).find(".planeModel").find('#Grab_dot_front_1_').attr('style', 'pointer-events:all !important;');
        };
  }


  setInterval(function(){
    disablePlaneHandles()
  },2000);


function getUrlParameter(sParam){
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return sParameterName[1];
        }
    }
}

//Notify Filemaker that editor has finished intial loading
window.onload = function(){
	window.location = getUrlParameter( "filemakerCommUrl" ) + "Load%20Complete";
}

});





