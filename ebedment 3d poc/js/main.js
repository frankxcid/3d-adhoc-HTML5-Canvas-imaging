/*jslint browser: true, plusplus: true */
/*global CANVAS, COMMON*/
///<reference path="common.js" />
///<reference path="canvas.js" />
var MAIN = {};
MAIN.canvasTool = null;
MAIN.labelFont = "bold 12pt Calibri";
MAIN.values = {
    "momentxvalue": 20,
    "momentyvalue": -20,
    "shearxvalue": -15,
    "shearyvalue": 15,
    "sheareccxvalue": 0,
    "sheareccyvalue": 10,
    "tensionvalue": -10,
    "tensioneccxvalue": 0,
    "tensioneccyvalue": 10
};
MAIN.initImage = function () {
    "use strict";
    MAIN.values.sheareccxvalue = parseFloat(document.getElementById("txtsheareccx").value);
    MAIN.values.sheareccyvalue = parseFloat(document.getElementById("txtsheareccy").value);

    MAIN.ensureCorrectValues();

    MAIN.canvasTool = CANVAS.initialize("divLeft", 500, 500, 500, 650, 700, 5);
    MAIN.canvasTool.clearCanvas();
    MAIN.canvasTool.currentYaw = 45;
    MAIN.canvasTool.currentPitch = 10;

    MAIN.drawAllItems();
    MAIN.canvasTool.execute();
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
    var shearECCPoint, adjustedXShear, adjustedYShear, maxShear;
    MAIN.drawPlate();
    MAIN.drawColumn();
    MAIN.drawMoment(true);
    MAIN.drawMoment(false);
    ////shear eccentricity
    ////if the value exceeds the footprint of the column (.25 X .25) then draw a line this may change the zValue of the drawing
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
    if (MAIN.values.sheareccxvalue !== 0 || MAIN.values.sheareccyvalue !== 0) {
        shearECCPoint = new CANVAS.PointDefinition(adjustedYShear, -0.75, adjustedXShear);
    }
    MAIN.drawShear(true, shearECCPoint);
    MAIN.drawShear(false, shearECCPoint);
    MAIN.drawTension();
    MAIN.drawCompass();
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
    MAIN.canvasTool.addCube(2, 0.25, 2, cubeCenterPoint, cubeColors);
};
MAIN.drawColumn = function () {
    "use strict";
    var cubeColors, cubeCenterPoint;
    cubeColors = [
        "red",
        "#C0C0C0",
        "#C0C0C0",
        "#C0C0C0",
        "#C0C0C0",
        "#404040"
    ];
    cubeCenterPoint = new CANVAS.PointDefinition(0, -0.75, 0);
    MAIN.canvasTool.addCube(0.5, 1.5, 0.5, cubeCenterPoint, cubeColors, null, true);
};
MAIN.drawMoment = function (xMoment) {
    "use strict";
    var startDegree0, endDegree0, startDegree1, posMoment, endDegree1, momentCenter0, momentCenter1, isPositive, faceIndex, lineStart, lineEnd, color, labelColor, labelPoint, labelText;
    if (xMoment) {
        if (MAIN.values.momentxvalue === 0) { return; }
        isPositive = MAIN.values.momentxvalue > 0;
        faceIndex = 4;
        momentCenter0 = new CANVAS.PointDefinition(-0.125, 0.125, -1.25);
        momentCenter1 = new CANVAS.PointDefinition(0.125, 0.125, -1.25);
        lineStart = new CANVAS.PointDefinition(0, 0.125, -1.0625);
        lineEnd = new CANVAS.PointDefinition(0, 0.125, -1.5);
        color = "red";
        labelColor = "#7B0F20";
        labelPoint = new CANVAS.PointDefinition(0, 0.375, -1.25);
        labelText = "Moment X: " + String(MAIN.values.momentxvalue);
    } else {
        if (MAIN.values.momentyvalue === 0) { return; }
        isPositive = MAIN.values.momentyvalue > 0;
        faceIndex = 2;
        momentCenter0 = new CANVAS.PointDefinition(1.25, 0.125, -0.125);
        momentCenter1 = new CANVAS.PointDefinition(1.25, 0.125, 0.125);
        lineStart = new CANVAS.PointDefinition(1.0625, 0.125, 0);
        lineEnd = new CANVAS.PointDefinition(1.5, 0.125, 0);
        color = "#000080";
        labelColor = "#003366";
        labelPoint = new CANVAS.PointDefinition(1.25, 0.375, 0);
        labelText = "Moment Y: " + String(MAIN.values.momentyvalue);
    }
    //posMoment = (xMoment ? isPositive : !isPositive);
    posMoment = isPositive;
    startDegree0 = (posMoment ? 135 : 195);
    endDegree0 = (posMoment ? 195 : 135);
    startDegree1 = (posMoment ? 45 : 335);
    endDegree1 = (posMoment ? 335 : 45);
    MAIN.canvasTool.addLine(lineStart, lineEnd, color, 4);
    MAIN.canvasTool.addCircle(momentCenter0, 0.25, faceIndex, 3, color, startDegree0, endDegree0, !isPositive, true);
    MAIN.canvasTool.addCircle(momentCenter1, 0.25, faceIndex, 3, color, startDegree1, endDegree1, isPositive, true);
    MAIN.canvasTool.addText(labelPoint, labelText, MAIN.labelFont, labelColor);
};
MAIN.drawShear = function (xShear, shearECCPoint) {
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
        shearData.eccLabelText = "Ecc Y: " + String(MAIN.values.sheareccyvalue);
    }
    MAIN.canvasTool.addLine(startPoint, endPoint, shearData.lineColor, 4, true);
    MAIN.canvasTool.addText(shearData.labelPoint, shearData.labelText, MAIN.labelFont, shearData.labelColor);
    if (outsideColumn && xShear) {
        MAIN.canvasTool.addLine(new CANVAS.PointDefinition(shearECCPoint.realX(), -1.5, shearECCPoint.realZ()), new CANVAS.PointDefinition(shearECCPoint.realX(), 0, shearECCPoint.realZ()), "black");
        if (outsideColumn === true) {
            MAIN.canvasTool.addCircle(new CANVAS.PointDefinition(shearECCPoint.realX(), 0, shearECCPoint.realZ()), 0.0625, 5, 8, "black");
        }
    }
    if (shearData.hasECC) {
        MAIN.canvasTool.addText(shearData.eccLabelPoint, shearData.eccLabelText, MAIN.labelFont, shearData.labelColor);
    }
};
MAIN.drawTension = function () {
    "use strict";
    var labelPoint, labelText, eccLabelPointX, eccLabelTextX, eccLabelPointY, eccLabelTextY, outsideColumn, onShear, adjustX, adjustY, eccPoint, maxECC, topPoint, lineColor, textColor;
    if (MAIN.values.tensioneccxvalue === undefined || MAIN.values.tensioneccxvalue === null) { MAIN.values.tensioneccxvalue = 0; }
    if (MAIN.values.tensioneccyvalue === undefined || MAIN.values.tensioneccyvalue === null) { MAIN.values.tensioneccyvalue = 0; }
    adjustX = MAIN.values.tensioneccxvalue;
    adjustY = MAIN.values.tensioneccyvalue;
    if (Math.abs(adjustX) > 20 || Math.abs(adjustY) > 20) {
        if (Math.abs(adjustX) >= Math.abs(adjustY)) {
            maxECC = (adjustX < 0 ? -20 : 20);
            adjustY = ((adjustY * maxECC) / adjustX);
            adjustX = maxECC;
        } else {
            maxECC = (adjustY < 0 ? -20 : 20);
            adjustX = ((adjustX * maxECC) / adjustY);
            adjustY = maxECC;
        }
    }
    adjustX = adjustX / 20;
    adjustY = adjustY / 20;
    eccPoint = new CANVAS.PointDefinition(adjustY, -1.5, adjustX);
    outsideColumn = (Math.abs(eccPoint.realZ()) > 0.25 || Math.abs(eccPoint.realX()) > 0.25);
    onShear = (MAIN.values.sheareccxvalue === MAIN.values.tensioneccxvalue && MAIN.values.sheareccyvalue === MAIN.values.tensioneccyvalue);
    if (!onShear && outsideColumn) {
        eccPoint.setY(0, true);
    }
    topPoint = new CANVAS.PointDefinition(eccPoint.realX(), -1.8, eccPoint.realZ());
    labelPoint = new CANVAS.PointDefinition(eccPoint.realX(), -1.85, eccPoint.realZ());
    eccLabelPointX = new CANVAS.PointDefinition(eccPoint.realX(), -1.7, eccPoint.realZ() - 0.3);
    eccLabelPointY = new CANVAS.PointDefinition(eccPoint.realX() + 0.3, -1.7, eccPoint.realZ());
    labelText = "Tension: " + String(MAIN.values.tensionvalue);
    eccLabelTextX = "ECC X: " + String(MAIN.values.tensioneccxvalue);
    eccLabelTextY = "ECC Y: " + String(MAIN.values.tensioneccyvalue);
    lineColor = "#E18942";
    textColor = "#B95835";
    MAIN.canvasTool.addLine(topPoint, eccPoint, lineColor, null, MAIN.values.tensionvalue < 0, MAIN.values.tensionvalue >= 0);
    MAIN.canvasTool.addText(labelPoint, labelText, MAIN.labelFont, textColor);
    if (MAIN.values.tensioneccxvalue !== 0 || MAIN.values.tensioneccyvalue !== 0) {
        MAIN.canvasTool.addText(eccLabelPointX, eccLabelTextX, MAIN.labelFont, textColor);
        MAIN.canvasTool.addText(eccLabelPointY, eccLabelTextY, MAIN.labelFont, textColor);
    }
};
MAIN.drawCompass = function () {
    "use strict";
    MAIN.canvasTool.addCompass("y", "z", "x", 0, "black", 2, false, true, false);
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