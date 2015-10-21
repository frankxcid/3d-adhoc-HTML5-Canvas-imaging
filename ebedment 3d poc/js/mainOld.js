/*jslint browser: true, plusplus: true */
/*global CANVAS*/
///<reference path="common.js" />
///<reference path="canvas.js" />
var MAIN = {};
MAIN.canvasTool = null;
MAIN.labelFont = "bold 12pt Calibri";
MAIN.values = {
    "momentxvalue": 20,
    "momentyvalue": -20,
    "shearxvalue": 15,
    "shearyvalue": 15,
    "sheareccyvalue": 10,
    "sheareccxvalue": 0,
    "tensionvalue": 10,
    "tensioneccxvalue": 0,
    "tensioneccyvalue": 0
};
MAIN.initImage = function () {
    "use strict";
    var ss;
    ss = COMMON.getSearchString();
    if (!ss) { ss = { "momentpos": false }; }
    MAIN.values.sheareccxvalue = parseFloat(document.getElementById("txtsheareccx").value);
    MAIN.values.sheareccyvalue = parseFloat(document.getElementById("txtsheareccy").value);

    MAIN.ensureCorrectValues();

    MAIN.canvasTool = CANVAS.initialize("divLeft", 500, 500, 500, 650, 700, 5, MAIN.drawAllItems);
    MAIN.canvasTool.clearCanvas();
    MAIN.canvasTool.currentYaw = 45;
    MAIN.canvasTool.currentPitch = 10;


    MAIN.drawAllItems();
};
MAIN.ensureCorrectValues = function () {
    "use strict";
    var oneProp, val;
    for (oneProp in MAIN.values) {
        if (MAIN.values.hasOwnProperty(oneProp)) {
            if (!COMMON.isNumber(String(MAIN.values[oneProp]), /^[\-+]?[0123456789.]+$/)) {
                val = 0;
            } else {
                val = parseFloat(MAIN.values[oneProp]);
            }
            MAIN.values[oneProp] = val;
        }
    }
};
MAIN.drawAllItems = function () {
    "use strict";
    var pointsTopFace, zValues, refFunctions, drawOrder, i;
    pointsTopFace = [
        new CANVAS.PointDefinition(-1, 0, -1),
        new CANVAS.PointDefinition(1, 0, -1),
        new CANVAS.PointDefinition(1, 0.25, -1)
    ];
    MAIN.canvasTool.adjustPointArray(pointsTopFace);
    zValues = (CANVAS.getPlaneEquation(0, 1, 2, pointsTopFace).c < 0 ? 2 : 0);

    pointsTopFace = [
        new CANVAS.PointDefinition(1, 0, -1),
        new CANVAS.PointDefinition(1, 0, 1),
        new CANVAS.PointDefinition(1, 0.25, 1)
    ];
    MAIN.canvasTool.adjustPointArray(pointsTopFace);
    zValues += (CANVAS.getPlaneEquation(0, 1, 2, pointsTopFace).c < 0 ? 1 : 0);

    refFunctions = [
        function () { MAIN.drawColumnAndPlate(); }, //0
        function () { MAIN.drawMoment(true, zValues); }, //1 - moment X, face index 4
        function () { MAIN.drawMoment(false, zValues); } //2 - moment Y, face index 2       
    ];

    switch (zValues) {
    case 0: //faceindex 4/2 is forward
        drawOrder = [0, 1, 2];
        break;
    case 1: //faceindex 3/4 is forward
        drawOrder = [2, 0, 1];
        break;
    case 2: //faceindex 2/1 is forward
        drawOrder = [1, 0, 2];
        break;
    case 3: //faceindex 1/3 is forward
        drawOrder = [1, 2, 0];
        break;
    }
    for (i = 0; i < drawOrder.length; i++) {
        refFunctions[drawOrder[i]]();
    }
};
MAIN.drawColumnAndPlate = function () {
    "use strict";
    var pointsTopFace, zValues;
    pointsTopFace = [
        new CANVAS.PointDefinition(0, 0, 0),
        new CANVAS.PointDefinition(-1, 0, -1),
        new CANVAS.PointDefinition(1, 0, -1)
    ];
    MAIN.canvasTool.adjustPointArray(pointsTopFace);
    zValues = CANVAS.getPlaneEquation(0, 1, 2, pointsTopFace);
    if (zValues.c > 0) {
        MAIN.drawColumn();
        MAIN.drawPlate();
    } else {
        MAIN.drawPlate();
        MAIN.drawColumn();
    }
};
MAIN.drawPlate = function () {
    "use strict";
    var cubeCenterPoint, cubeColors;
    cubeCenterPoint = new CANVAS.PointDefinition(0, 0.125, 0);
    cubeColors = [
        "#404040",
        "#404040",
        "#404040",
        "#404040",
        "#404040",
        "#C0C0C0"
    ];
    MAIN.canvasTool.drawCube(2, 0.25, 2, cubeCenterPoint, cubeColors);
};
MAIN.drawColumn = function () {
    "use strict";
    var shearECCPoint, zValues, refFunctions, drawOrder, i, adjustedXShear, adjustedYShear, maxShear, cubeColors, cubeCenterPoint, planeEquations, shearOutsideColumn, eccentricShearZValue, showDot;
    //for eccentricity values if either value is over 20 attempt to create a ratio of the values with the largest value being 20.  Then take 1/20th of a unit for the X value (shear Y) and z value (shear X)
    //if the value exceeds the footprint of the column (.25 X .25) then draw a line this may change the zValue of the drawing
    adjustedXShear = MAIN.values.sheareccxvalue;
    adjustedYShear = MAIN.values.sheareccyvalue;
    if (Math.abs(adjustedXShear) > 20 || Math.abs(adjustedYShear) > 20) {
        if (Math.abs(adjustedXShear) >= Math.abs(adjustedYShear)) {
            maxShear = (adjustedXShear < 0 ? -20 : 20);
            adjustedYShear = ((adjustedYShear * maxShear) / adjustedXShear);
            adjustedXShear = maxShear;
        } else {
            maxShear = (adjustedYShear < 0 ? -20 : 20);
            adjustedXShear = ((adjustedXShear * maxShear) / adjustedYShear);
            adjustedYShear = maxShear;
        }
    }
    adjustedXShear = adjustedXShear / 20;
    adjustedYShear = adjustedYShear / 20;
    //the points have been changed on purpose since they do not match the canvas coordinate system
    //thus xShear = Z on the canvas and yshear = X on the canvas
    eccentricShearZValue = -1;
    if (MAIN.values.sheareccxvalue !== 0 || MAIN.values.sheareccyvalue !== 0) {
        shearECCPoint = new CANVAS.PointDefinition(adjustedYShear, -0.75, adjustedXShear);
        if (shearECCPoint.realX() > 0 && shearECCPoint.realZ() >= 0) {
            eccentricShearZValue = 1;
        } else if (shearECCPoint.realX() > 0 && shearECCPoint.realZ() <= 0) {
            eccentricShearZValue = 0;
        } else if (shearECCPoint.realX() <= 0 && shearECCPoint.realZ() > 0) {
            eccentricShearZValue = 3;
        } else {
            eccentricShearZValue = 2;
        }
    }
    shearOutsideColumn = (shearECCPoint !== undefined && shearECCPoint !== null && (Math.abs(shearECCPoint.realZ()) > 0.25 || Math.abs(shearECCPoint.realX()) > 0.25));
        //creating the testing points for zValues
    cubeColors = [
        "red",
        "#C0C0C0",
        "#C0C0C0",
        "#C0C0C0",
        "#C0C0C0",
        "#404040"
    ];
    cubeCenterPoint = new CANVAS.PointDefinition(0, -0.75, 0);
    planeEquations = MAIN.canvasTool.drawCube(0.5, 1.5, 0.5, cubeCenterPoint, cubeColors, null, true);
    zValues = (planeEquations[4].c > 0 ? 2 : 0);
    zValues += (planeEquations[2].c < 0 ? 1 : 0);
    showDot = true;
    refFunctions = [
        function () { MAIN.canvasTool.drawCube(0.5, 1.5, 0.5, cubeCenterPoint, cubeColors); },//0
        function () { if (MAIN.values.shearxvalue > 0 && !shearOutsideColumn) { MAIN.drawShear(true, shearECCPoint); } }, //1 - shear x pos, face index 1
        function () { if (MAIN.values.shearxvalue < 0 && !shearOutsideColumn) { MAIN.drawShear(true, shearECCPoint); } }, //2 - shear x neg, face index 4
        function () { if (MAIN.values.shearyvalue > 0 && !shearOutsideColumn) { MAIN.drawShear(false, shearECCPoint); } }, //3- shear y pos, face index 2
        function () { if (MAIN.values.shearyvalue < 0 && !shearOutsideColumn) { MAIN.drawShear(false, shearECCPoint); } }, //4 - shear y neg, face index 3
        function () { if (MAIN.values.shearxvalue !== 0 && shearOutsideColumn) { MAIN.drawShear(true, shearECCPoint, showDot); } }, //5 - shear x off column
        function () { if (MAIN.values.shearyvalue !== 0 && shearOutsideColumn) { MAIN.drawShear(false, shearECCPoint, showDot); } } //6 - shear y off column
    ];
    var t = "cube: " + String(zValues) + "\r\necc: " + String(eccentricShearZValue) + "\r\nX = " + String(shearECCPoint.realX()) + "\r\nZ = " + String(shearECCPoint.realZ());
    MAIN.showData(t);
    switch (zValues) {
    case 0: //faceindex 4/2 is forward
        drawOrder = [1, 4, 0, 2, 3];
        if (eccentricShearZValue === 3) {
            drawOrder.unshift(5);
            drawOrder.unshift(6);
        } else {
            drawOrder.push(5);
            drawOrder.push(6);
        }
        break;
        case 1: //faceindex 3/4 is forward
            drawOrder = [1, 3, 0, 4, 2];
            if (eccentricShearZValue === 1 || eccentricShearZValue === 3) {
                drawOrder.unshift(5);
                drawOrder.unshift(6);
            } else {
                drawOrder.push(5);
                drawOrder.push(6);
            }
            break;
    case 2: //faceindex 2/1 is forward
        drawOrder = [4, 2, 0, 3, 1];
        if (eccentricShearZValue === 4) {
            drawOrder.unshift(5);
            drawOrder.unshift(6);
        } else {
            drawOrder.push(5);
            drawOrder.push(6);
        }
        break;
    case 3: //faceindex 1/3 is forward
        drawOrder = [3, 2, 0, 1, 4];
        if (eccentricShearZValue === 0 || eccentricShearZValue === 1) {
            drawOrder.unshift(5);
            drawOrder.unshift(6);
        } else {
            drawOrder.push(5);
            drawOrder.push(6);
        }
        break;
    }
    for (i = 0; i < drawOrder.length; i++) {
        refFunctions[drawOrder[i]]();
    }
};
MAIN.drawMoment = function (xMoment) {
    "use strict";
    var startDegree, endDegree, momentCenter, isPositive, localX, localY, localZ, faceIndex, lineStart, lineEnd, color, labelColor, labelPoint, labelText;
    if (xMoment) {
        if (MAIN.values.momentxvalue === 0) { return; }
        isPositive = MAIN.values.momentxvalue > 0;
        localX = 0;
        localY = 0.125;
        localZ = -1.25;
        faceIndex = 4;
        lineStart = new CANVAS.PointDefinition(0, 0.125, -1.0625);
        lineEnd = new CANVAS.PointDefinition(0, 0.125, -1.5);
        color = "red";
        labelColor = "#7B0F20";
        labelPoint = new CANVAS.PointDefinition(0, 0.475, -1.25);
        labelText = "Moment X: " + String(MAIN.values.momentxvalue);
    } else {
        if (MAIN.values.momentyvalue === 0) { return; }
        isPositive = MAIN.values.momentyvalue < 0;
        localX = 1.25;
        localY = 0.125;
        localZ = 0;
        faceIndex = 2;
        lineStart = new CANVAS.PointDefinition(1.0625, 0.125, 0);
        lineEnd = new CANVAS.PointDefinition(1.5, 0.125, 0);
        color = "#000080";
        labelColor = "#003366";
        labelPoint = new CANVAS.PointDefinition(1.25, 0.475, 0);
        labelText = "Moment Y: " + String(MAIN.values.momentyvalue);
    }
    startDegree = (isPositive ? 135 : 45);
    endDegree = (isPositive ? 195 : 335);
    momentCenter = new CANVAS.PointDefinition(localX, localY, localZ);
    MAIN.canvasTool.drawLine(lineStart, lineEnd, color, 4);
    MAIN.canvasTool.drawCircle(momentCenter, 0.5, faceIndex, 5, color, startDegree, endDegree, (!isPositive), true);
    MAIN.canvasTool.drawText(labelPoint, labelText, MAIN.labelFont, labelColor);
};
MAIN.drawShear = function (xShear, shearECCPoint, showDot) {
    "use strict";
    var isPositive, startPoint, endPoint, shearData, outsideColumn, adjustX, adjustZ;
    outsideColumn = (shearECCPoint !== undefined && shearECCPoint !== null && (Math.abs(shearECCPoint.realZ()) > 0.25 || Math.abs(shearECCPoint.realX()) > 0.25));
    adjustX = 0;
    adjustZ = 0;
    shearData = {};
    shearData.hasECC = (shearECCPoint !== undefined && shearECCPoint !== null);
    if (outsideColumn) {
        adjustX = shearECCPoint.realX();
        adjustZ = shearECCPoint.realZ();
    }
    if (xShear) {
        if (MAIN.values.shearxvalue === 0) { return; }
        isPositive = MAIN.values.shearxvalue > 0;
        if (isPositive) {
            startPoint = (!outsideColumn ? new CANVAS.PointDefinition(0, -1, 0.3125) : new CANVAS.PointDefinition(adjustX, -1, adjustZ));
            endPoint = new CANVAS.PointDefinition(adjustX, -1, 1 + adjustZ);
            shearData.labelPoint = new CANVAS.PointDefinition(adjustX, -1.1, 1 + adjustZ);
            if (shearData.hasECC) { shearData.eccLabelPoint = new CANVAS.PointDefinition(adjustX, -0.9, 1 + adjustZ); }
        } else {
            startPoint = (!outsideColumn ? new CANVAS.PointDefinition(0, -1, -0.275) : new CANVAS.PointDefinition(adjustX, -1, adjustZ));
            endPoint = new CANVAS.PointDefinition(adjustX, -1, -1 + adjustZ);
            shearData.labelPoint = new CANVAS.PointDefinition(adjustX, -1.1, -1 + adjustZ);
            if (shearData.hasECC) { shearData.eccLabelPoint = new CANVAS.PointDefinition(adjustX, -0.9, -1 + adjustZ); }
        }
        shearData.lineColor = "#957BBD";
        shearData.labelColor = "#663399";
        shearData.labelText = "Shear X: " + String(MAIN.values.shearxvalue);
        shearData.eccLabelText = "Ecc X: " + String(MAIN.values.sheareccxvalue);
    } else {
        if (MAIN.values.shearyvalue === 0) { return; }
        isPositive = MAIN.values.shearyvalue > 0;
        if (isPositive) {
            startPoint = (!outsideColumn ? new CANVAS.PointDefinition(0.3125, -0.75, 0) : new CANVAS.PointDefinition(adjustX, -0.75, adjustZ));
            endPoint = new CANVAS.PointDefinition(1 + adjustX, -0.75, adjustZ);
            shearData.labelPoint = new CANVAS.PointDefinition(1 + adjustX, -0.85, adjustZ);
            if (shearData.hasECC) { shearData.eccLabelPoint = new CANVAS.PointDefinition(1 + adjustX, -0.65, adjustZ); }
        } else {
            startPoint = (!outsideColumn ? new CANVAS.PointDefinition(-0.3125, -0.75, 0) : new CANVAS.PointDefinition(adjustX, -0.75, adjustZ));
            endPoint = new CANVAS.PointDefinition(-1 + adjustX, -0.75, adjustZ);
            shearData.labelPoint = new CANVAS.PointDefinition(-1 + adjustX, -0.85, adjustZ);
            if (shearData.hasECC) { shearData.eccLabelPoint = new CANVAS.PointDefinition(-1 + adjustX, -0.65, adjustZ); }
        }
        shearData.lineColor = "#7ABA7A";
        shearData.labelColor = "#028482";
        shearData.labelText = "Shear Y: " + String(MAIN.values.shearyvalue);
        shearData.eccLabelText = "Shear Ecc Y: " + String(MAIN.values.sheareccyvalue);
    }
    MAIN.canvasTool.drawLine(startPoint, endPoint, shearData.lineColor, 4, true);
    MAIN.canvasTool.drawText(shearData.labelPoint, shearData.labelText, MAIN.labelFont, shearData.labelColor);
    if (outsideColumn) {
        MAIN.canvasTool.drawLine(new CANVAS.PointDefinition(shearECCPoint.realX(), -1.5, shearECCPoint.realZ()), new CANVAS.PointDefinition(shearECCPoint.realX(), 0, shearECCPoint.realZ()), "black");
        if (showDot === true) {
            MAIN.canvasTool.drawCircle(new CANVAS.PointDefinition(shearECCPoint.realX(), 0, shearECCPoint.realZ()), 0.0625, 5, 8, "black");
        }
    }
    if (shearData.hasECC) {
        MAIN.canvasTool.drawText(shearData.eccLabelPoint, shearData.eccLabelText, MAIN.labelFont, shearData.labelColor);
    }
};
MAIN.drawTension = function () {
    "use strict";
    var startPoint, endPoint, labelPoint, labelText;
};
MAIN.showData = function (text, append) {
    "use strict";
    var obj;
    obj = document.getElementById("txaDisp");
    if (!append) {
        obj.value = text;
    } else {
        obj.value += text;
    }
};