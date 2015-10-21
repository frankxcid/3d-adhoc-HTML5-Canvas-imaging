# 3d-adhoc-HTML5-Canvas-imaging
This is a proof of concept project.  As an addon to embedment.nelsonstud.com this will display a 3d representation of the forces on or around a column embeded in cement.  The idea is to allow the user to rotate the image so that it has the appearance of a 3d image.
This project is written in javascript and consists of 3 javascript files, 2 css files and 1 html file.

CSS Files:

canvas.css - places a border around the created html canvas and allows the placement of buttons around the canvas element to allow movement on touch screens

main.css - used for html styles but not needed for the project concept

Javascript Files:

canvas.js - contains the code to draw items on the canvas, and rotation logic.  This is the library that will be called by the project

common.js - contains code from a separate library to assist in several areas in the code.  This file is needed for this project to run

main.js - contains the code to dynamically add items and control the canvas library.  In a real project, the main javascript files will be used to call the canvas logic.  This file is included as an example of using the canvas library

HTML File

canvas.html is what puts the whole concept together and displays the result.  This file is included as an example of using the canvas library.  This file contains other controls that were used for troubleshooting and development.

usage:

1. Add a div element to the project either directly or programatically to the page you want to display the control.  This element needs to have an ID which will be used to add the programatic canvas element

2. Add code to the javascript to initialize the canvas display. this is done by calling the CANVAS.initialize function of the canvas library.  Here is where the id of the div, as well as canvas dimensions and point of view information.  The example displays a canvas 500 X 500 with a high point of view.  It also initializes the displayed angle for ease of use.  The initialized display will return an object instance of the Canvas library so you can have more than one canvas at one time.

3. Add code to add the components that will be given the 3d effect.  Current components:

    a.  Cube - give the center point of the cube and then its height, width and depth.
    
    b.  Circle - give the center point and diameter.  The circle can be incomplete and can have an arrow head if it is an incomplete circle (arc)
    
    c.  Cone - give the center point of the base and the peak, specify number of facets, more facets presents a cleaner cone surfaace
    d.  Line - add a start and end point as well as arrow heads at the start or end of the line
    
    e.  Text - add the center point of the text where it will be displayed
    
    f.  Compass Rose - add a miniature display of the oridinal axis that will rotate with the image
    
4.  Execute the code - this will take care of rotation

User experience

The user will see the components with the apearance of a 3 dimensional image.  The user can rotate the image using the mouse by clicking anywhere in the image and moving the mouse which will rotate the image's yaw and pitch.  The user can also use the buttons for rotation on touchscreen displays

Limitations

The code is ready for use but is not 100% accurate when displaying overlapping components.  There is some clipping (components that appear embeded in other components).  This is due to the simple algorithm used for determining rendering order where farther items need to be drawn first before nearer items.  The code uses a modified painter's algorithm to sort the components and more work will fix this problem.  I am aware of th Z-buffering algorithm but I would have to use a different strategy for rendering components and I'm not sure how much more memory will be needed.
Another limitation that I hope to overcome is the elimination of buttons on touch screens.  There may be a way for users to drag their finger on the image to cause the rotation.
