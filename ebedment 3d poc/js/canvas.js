/*jslint browser: true, plusplus: true */
/*global COMMON*/
///<reference path="common.js" />
var CANVAS = {};
CANVAS.instance = {};
//****************************Init Items*************************************//
CANVAS.initialize = function (containerId, canvasWidth, canvasHeight, viewWidth, viewHeight, fieldOfView, viewDistance) {
    ///<summary>Initialize an instance of Canvas tools. Returns the instance object and adds it to CANVAS.instance. You can call the object as CANVAS.instance.containerId where containerId is the Id of the element that will contain all the controls</summary>
    ///<param name="containerId" type="String">The id of the element the will contain all the controls</param>
    ///<param name="canvasWidth" type="Number">The width in pixels of the canvas element</param>
    ///<param name="canvasHeight" type="Number">The height in pixels of the canvas element</param>
    ///<param name="viewWidth" type="Number">The total width of the image that will fit in the field of view</param>
    ///<param name="viewHeight" type="Number">The total height of the image that will fit in the field of view</param>
    ///<param name="fieldOfView" type="Number">The width and height of the field of view cone</param>
    ///<param name="viewDistance" type="Number">The multiple of widths the image is seen. Higher number is farther away therefore smaller</param>
    ///<returns type="Canvas Tool Object">The object that contains all the tools</returns>
    "use strict";
    var obj, priv, settings;

    settings = {};
    settings.defaultConeFacets = 12;

    obj = {};
    obj.allItems = [];
    //structure of allItems single item:
    // .index - the index
    // .points - array of points
    // .rPoints - points that represent the center of the object
    // .planeEq - the planeEquation object may not exist
    // .test - array of ordered tests to see if painter's algorithm has failed and resorting is needed
    // .drawingFunction - function object that draws the projection on the canvas

    //private methods and variables
    priv = {};
    //add components to the container such as canvas and view adjustment buttons
    //this function will be called before returning the instance and it is safe to name the parameter variables (the variables named after function and in the parenthesis) and does not need the instance variables (obj.variable)
    priv.addComponents = function () {
        var lObj, canvasContainer, rightBtnContainer, bottomButtonContainer;
        lObj = document.getElementById(containerId);
        if (lObj === undefined || lObj === null) { return; }
        canvasContainer = COMMON.getBasicElement("div", null, null, "divCanvas");
        rightBtnContainer = COMMON.getBasicElement("div", null, null, "divCanvasRight");
        bottomButtonContainer = COMMON.getBasicElement("div", null, null, "divCanvasBottom");
        canvasContainer.style.width = String(canvasWidth) + "px";
        rightBtnContainer.style.width = "40px";
        rightBtnContainer.style.paddingTop = String((canvasHeight / 2) - 35) + "px";
        bottomButtonContainer.style.paddingLeft = String((canvasWidth / 2) - 40) + "px";
        canvasContainer.innerHTML = "<canvas id=\"cnv" + containerId + "\" onmousedown=\"CANVAS.instance." + containerId + ".mouseClick(true); return false;\" onmouseup=\"CANVAS.instance." + containerId + ".mouseClick(false); return false;\" onmouseout=\"CANVAS.instance." + containerId + ".mouseClick(false); return false;\" width=\"" + String(canvasWidth) + "\" height=\"" + String(canvasHeight) + "\" onmousemove=\"CANVAS.instance." + containerId + ".mouseMove(event); return false;\"></canvas>";
        rightBtnContainer.innerHTML = "<input type=\"button\" onmousedown=\"CANVAS.instance." + containerId + ".buttonClickUp(true); return false;\" onmouseup=\"CANVAS.instance." + containerId + ".buttonClickUp(false); return false;\" value=\"&#x25B2;\"><input type=\"button\" onmousedown=\"CANVAS.instance." + containerId + ".buttonClickDown(true); return false;\" onmouseup=\"CANVAS.instance." + containerId + ".buttonClickDown(false); return false;\" value=\"&#x25BC;\">";
        bottomButtonContainer.innerHTML = "<input type=\"button\" onmousedown=\"CANVAS.instance." + containerId + ".buttonClickLeft(true); return false;\" onmouseup=\"CANVAS.instance." + containerId + ".buttonClickLeft(false); return false;\" value=\"&#x25C4;\"><input type=\"button\" onmousedown=\"CANVAS.instance." + containerId + ".buttonClickRight(true); return false;\" onmouseup=\"CANVAS.instance." + containerId + ".buttonClickRight(false); return false;\" value=\"&#x25BA;\">";
        lObj.appendChild(canvasContainer);
        lObj.appendChild(rightBtnContainer);
        lObj.appendChild(bottomButtonContainer);
    };
    priv.addComponents();
    priv.itemDisplayOrder = null;
    priv.doWork = function (reset) {
        if (reset === true) { priv.resetPoints(); }
        priv.adjustAllPoints();
        priv.paintersAlgorithmSort();
        priv.drawAllItems();
    };
    priv.resetPoints = function () {
        var i;
        for (i = 0; i < obj.allItems.length; i++) {
            if (obj.allItems[i].points !== undefined) {
                priv.resetPointsArray(obj.allItems[i].points);
            }
            if (obj.allItems[i].centerPoint !== undefined) {
                obj.allItems[i].centerPoint.reset();
            }
        }
    };
    priv.resetPointsArray = function (arr) {
        //uses the reset function of CANVAS.PointDefinition to return all point values to original values
        var i;
        for (i = 0; i < arr.length; i++) {
            arr[i].reset();
        }
    };
    priv.adjustAllPoints = function () {
        var i, localPoint, surroundPoints, thisItem;
        if (obj.allItems === undefined || obj.allItems === null || obj.allItems.length === 0) { return; }
        for (i = 0; i < obj.allItems.length; i++) {
            thisItem = obj.allItems[i];
            if (thisItem.centerPoint !== undefined) {
                obj.adjustOnePoint(thisItem.centerPoint);
            }
            if (thisItem.points !== undefined) {
                obj.adjustPointArray(obj.allItems[i].points);
                obj.allItems[i].zmn = priv.calculateZMinMax(thisItem.points);
                if (thisItem.text !== undefined) {
                    //calculate plane that contains the text
                    localPoint = CANVAS.clonePointDefinition(thisItem.points[0]);
                    surroundPoints = [];
                    surroundPoints.push(new CANVAS.PointDefinition(localPoint.realX(), localPoint.realY() - thisItem.fontHeight, localPoint.realZ()));
                    surroundPoints.push(new CANVAS.PointDefinition(localPoint.realX() + thisItem.fontWidth, localPoint.realY() - thisItem.fontHeight, localPoint.realZ()));
                    surroundPoints.push(new CANVAS.PointDefinition(localPoint.realX() + thisItem.fontWidth, localPoint.realY(), localPoint.realZ()));
                    surroundPoints.push(localPoint);
                    obj.allItems[i].planePoints = surroundPoints;
                    obj.allItems[i].zmn = priv.calculateZMinMax(surroundPoints);
                }
            }
        }
    };
    priv.addItem = function (thisObj) {
        thisObj.index = obj.allItems.length;
        obj.allItems.push(thisObj);
    };
    priv.drawAllItems = function () {
        var i, currentItem;
        if (obj.allItems === undefined || obj.allItems === null || obj.allItems.length === 0) { return; }
        for (i = 0; i < obj.allItems.length; i++) {
            currentItem = obj.allItems[priv.itemDisplayOrder[i][0]];
            currentItem.drawingFunction(currentItem);
        }
        priv.drawCompass();
    };
    priv.compassObj = {};
    //compassObj properties:
    // xlabel, ylabel, zlabel - the text to display on each end
    // corner - the corner where to display the compass, 0 - 3 = top left, top right, bottom right, bottom left
    // xPlus, yPlus, zPlus - if true will point to the positive (increasing) value of that axis
    // color - defaults to black
    // linewidth - defaults to 4
    priv.drawCompass = function () {
        var localX, localY, localZ, rad, centerPoint, endPoint, csYaw, csPitch, textPoint;
        if (priv.compassObj.display !== true) { return; }
        localX = (priv.compassObj.corner === 0 || priv.compassObj.corner === 3 ? 0.08 : 0.92) * canvasWidth;
        localY = (priv.compassObj.corner === 0 || priv.compassObj.corner === 1 ? 0.10 : 0.90) * canvasHeight;
        localZ = 0;
        centerPoint = new CANVAS.PointDefinition(localX, localY, localZ);
        rad = 0.05 * canvasWidth;
        csYaw = CANVAS.getCosineSine(obj.currentYaw);
        csPitch = CANVAS.getCosineSine(obj.currentPitch);
        //x point
        localX = centerPoint.realX() + (rad * csYaw.cos) * (priv.compassObj.xplus === true ? 1 : -1);
        localY = centerPoint.realY();
        localZ = centerPoint.realZ() + (rad * csYaw.sin);
        endPoint = new CANVAS.PointDefinition(localX, localY, localZ);
        textPoint = new CANVAS.PointDefinition(localX, localY - (0.02 * canvasHeight), localZ);
        priv.compassPetal(CANVAS.clonePointDefinition(centerPoint), endPoint, textPoint, priv.compassObj.xlabel);
        //y point
        localX = centerPoint.realX();
        localY = centerPoint.realY() + (rad * csPitch.cos) * (priv.compassObj.yplus === true ? -1 : 1);
        localZ = centerPoint.realZ() + (rad * csPitch.sin);
        endPoint = new CANVAS.PointDefinition(localX, localY, localZ);
        textPoint = new CANVAS.PointDefinition(localX, localY - (0.02 * canvasHeight), localZ);
        priv.compassPetal(CANVAS.clonePointDefinition(centerPoint), endPoint, textPoint, priv.compassObj.ylabel);
        //z point
        localX = centerPoint.realX() + (rad * csYaw.sin) * (priv.compassObj.zplus === true ? 1 : -1);
        localY = centerPoint.realY() + (rad * csPitch.sin) * (priv.compassObj.zplus === true ? -1 : 1);
        localZ = centerPoint.realZ();
        endPoint = new CANVAS.PointDefinition(localX, localY, localZ);
        textPoint = new CANVAS.PointDefinition(localX, localY + (0.02 * canvasHeight), localZ);
        priv.compassPetal(CANVAS.clonePointDefinition(centerPoint), endPoint, textPoint, priv.compassObj.zlabel);
    };
    priv.compassPetal = function (startPoint, endPoint, textPoint, text) {
        var vect, arrowPoint, thisCone, points, lineObj, textObj, font;
        font = "bold 8pt Calibri";
        vect = new CANVAS.Vector(CANVAS.clonePointDefinition(startPoint), CANVAS.clonePointDefinition(endPoint));
        arrowPoint = vect.positionOfT(1.33);
        thisCone = priv.cone(5, CANVAS.clonePointDefinition(endPoint), arrowPoint, "black", "black", 12);
        points = [startPoint, endPoint];
        lineObj = {};
        lineObj.points = points;
        lineObj.lineWidth = 2;
        priv.drawLine(lineObj);
        priv.drawCone(thisCone);
        if (textPoint !== undefined && text !== undefined && text !== "") {
            points = [textPoint];
            textObj = {};
            textObj.points = points;
            textObj.fontWidth = obj.ctx.measureText(text).width;
            textObj.color = "red";
            textObj.font = font;
            textObj.text = text;
            priv.drawText(textObj);
        }
    };
    //******************************Order tests*************************************

    priv.paintersAlgorithmSort = function () {
        var i, currentBaseIndex, testedIndex, swaps, doSwap, index0, index1;
        if (obj.allItems === undefined || obj.allItems === null || obj.allItems.length === 0) { return; }
        priv.itemDisplayOrder = [];
        for (i = 0; i < obj.allItems.length; i++) {
            priv.itemDisplayOrder.push([i, obj.allItems[i].zmn.maxZ]);
        }
        COMMON.sortArray(priv.itemDisplayOrder, 1, true);
        currentBaseIndex = 0;
        testedIndex = 1;
        swaps = [];
        if (obj.allItems.length === 1) { return; }
        while (currentBaseIndex < obj.allItems.length - 1) {
            index0 = priv.itemDisplayOrder[currentBaseIndex][0];
            index1 = priv.itemDisplayOrder[testedIndex][0];
            if (priv.test0(index0, index1) && priv.test1(index0, index1) && priv.test2(index0, index1)) {
                doSwap = true;
                if (swaps.length > 0) {
                    for (i = 0; i < swaps.length; i++) {
                        if ((swaps[i].index0 === currentBaseIndex || swaps[i].index1 === currentBaseIndex) && (swaps[i].index0 === testedIndex || swaps[i].index1 === testedIndex)) {
                            doSwap = false;
                            break;
                        }
                    }
                }
                if (doSwap) {
                    priv.swapItems(currentBaseIndex, testedIndex, priv.itemDisplayOrder);
                    swaps.push({ "index0": currentBaseIndex, "index1": testedIndex });
                }
            }
            testedIndex += 1;
            if (testedIndex > obj.allItems.length - 1) {
                currentBaseIndex += 1;
                testedIndex = currentBaseIndex + 1;
            }
        }
    };

    priv.calculateZMinMax = function (pointArray) {
        var i, zmn, x, y, z;
        zmn = {};
        for (i = 0; i < pointArray.length; i++) {
            x = pointArray[i].realX();
            y = pointArray[i].realY();
            z = pointArray[i].realZ();
            if (i === 0) {
                zmn.maxX = x;
                zmn.minX = x;
                zmn.maxY = y;
                zmn.minY = y;
                zmn.maxZ = z;
                zmn.minZ = z;
                zmn.maxXPoint = new CANVAS.PointDefinition(x, y, z);
                zmn.minXPoint = new CANVAS.PointDefinition(x, y, z);
                zmn.maxYPoint = new CANVAS.PointDefinition(x, y, z);
                zmn.minYPoint = new CANVAS.PointDefinition(x, y, z);
                zmn.maxZPoint = new CANVAS.PointDefinition(x, y, z);
                zmn.minZPoint = new CANVAS.PointDefinition(x, y, z);
            } else {
                if (x > zmn.maxX) {
                    zmn.maxX = x;
                    zmn.maxXPoint = new CANVAS.PointDefinition(x, y, z);
                }
                if (x < zmn.minX) {
                    zmn.minX = x;
                    zmn.minXPoint = new CANVAS.PointDefinition(x, y, z);
                }
                if (y > zmn.maxY) {
                    zmn.maxY = y;
                    zmn.maxYPoint = new CANVAS.PointDefinition(x, y, z);
                }
                if (y < zmn.minY) {
                    zmn.minY = y;
                    zmn.minYPoint = new CANVAS.PointDefinition(x, y, z);
                }
                if (z > zmn.maxZ) {
                    zmn.maxZ = z;
                    zmn.maxZPoint = new CANVAS.PointDefinition(x, y, z);
                }
                if (z < zmn.minZ) {
                    zmn.minZ = z;
                    zmn.minZPoint = new CANVAS.PointDefinition(x, y, z);
                }
            }
        }
        //zmn.medZ = (maxXPoint.realZ() - minXPoint.realZ()) / 2 + minXPoint.realZ();
        //zmn.medZY = (maxYPoint.realZ() - minYPoint.realZ()) / 2 + minYPoint.realZ();

        zmn.medZ = zmn.maxXPoint.realZ();
        zmn.medZY = zmn.minYPoint.realZ();

        return zmn;
    };
    priv.test0 = function (index0, index1) {
        var item0, item1;
        //is there a z overlap 
        item0 = obj.allItems[index0];
        item1 = obj.allItems[index1];
        return item0.zmn.minZ < item1.zmn.maxZ; //true there is an overlap
    };
    priv.test1 = function (index0, index1) {
        //is there an x y overlap
        var item0, item1;
        item0 = obj.allItems[index0];
        item1 = obj.allItems[index1];
        return (!(item0.zmn.maxX < item1.zmn.minX || item0.zmn.minX > item1.zmn.maxX || item0.zmn.maxY < item1.zmn.minY || item0.zmn.minY > item1.zmn.maxY)); //true there is an overlap
    };
    priv.test2 = function (index0, index1) {
        var item0, item1, tPoint0, tPoint1;
        item0 = obj.allItems[index0];
        item1 = obj.allItems[index1];
        tPoint0 = item0.centerPoint.realZ();
        tPoint1 = item1.centerPoint.realZ();
        if (item0.zmn.minYPoint.realZ() < tPoint0) {
            tPoint0 = item0.zmn.minYPoint.realZ();
        }
        if (item1.zmn.minYPoint.realZ() < tPoint1) {
            tPoint1 = item1.zmn.minYPoint.realZ();
        }
        //returns true if swap is needed
        return tPoint0 < tPoint1;
    };
    //********************************drawing functions*****************************
    priv.drawCube = function (thisCube) {
        var cubeFaces, displaySwitch, zValues, i, n, oneFace;
        cubeFaces = [
            [0, 3, 7, 4], //side 0
            [0, 1, 2, 3], //side 1
            [0, 4, 5, 1], //side 2
            [2, 3, 7, 6], //side 3
            [7, 4, 5, 6], //side 4
            [1, 5, 6, 2]  //side 5
        ];
        //zValues determine if the face will be shown or not
        displaySwitch = [
            1,//side0
            1,//side1
            1,//side2
            -1,//side3
            -1,//side4
            1  //side5
        ];
        zValues = [];
        for (i = 0; i < cubeFaces.length; i++) {
            zValues.push(CANVAS.getPlaneEquation(cubeFaces[i][0], cubeFaces[i][1], cubeFaces[i][2], thisCube.points));
        }
        //color
        obj.ctx.strokeStyle = thisCube.lineColor || "#606060";
        //cycle through the faces and display only those that have the correct z Value
        for (i = 0; i < cubeFaces.length; i++) {
            oneFace = cubeFaces[i];
            if ((zValues[i].c * displaySwitch[i]) > 0) {
                obj.ctx.beginPath();
                //start and go through each point
                obj.ctx.moveTo(thisCube.points[oneFace[0]].x(), thisCube.points[oneFace[0]].y()); //Start
                for (n = 1; n < oneFace.length; n++) {
                    obj.ctx.lineTo(thisCube.points[oneFace[n]].x(), thisCube.points[oneFace[n]].y());
                }
                obj.ctx.lineWidth = 1; //line thickness
                obj.ctx.closePath();
                if (thisCube.colorArray && thisCube.colorArray.length > 0) {
                    obj.ctx.fillStyle = thisCube.colorArray[i];
                }
                obj.ctx.fill(); //fill in the polygon with the array from the color
                obj.ctx.stroke(); //render
            }
        }
    };
    priv.drawCircle = function (thisCirc) {
        var i, currentQuad;
        for (i = 0; i < thisCirc.points.length; i += 4) {
            currentQuad = Math.floor(i / 4);
            if ((thisCirc.esObj === undefined) || thisCirc.esObj.visibleQuads[currentQuad]) {
                obj.ctx.beginPath();
                obj.ctx.moveTo(thisCirc.points[i].x(), thisCirc.points[i].y());
                obj.ctx.bezierCurveTo(thisCirc.points[i + 1].x(), thisCirc.points[i + 1].y(), thisCirc.points[i + 2].x(), thisCirc.points[i + 2].y(), thisCirc.points[i + 3].x(), thisCirc.points[i + 3].y());
                if (thisCirc.lineColor !== undefined && thisCirc.lineColor !== null) { obj.ctx.strokeStyle = thisCirc.lineColor; }
                obj.ctx.lineWidth = thisCirc.lineThickness || 3;
                obj.ctx.stroke();
            }
        }
    };
    priv.drawCone = function (thisCone) {
        var i, nextPoint, oneFacet, planeEq, pointCoordinate;
        obj.drawPolygon(thisCone.points, thisCone.lineColor, thisCone.fillColor);
        ////draw facets
        pointCoordinate = thisCone.points[thisCone.points.length - 1];
        for (i = 0; i < thisCone.facets; i++) {
            nextPoint = i + 1;
            if (nextPoint >= thisCone.facets) { nextPoint = 0; }
            oneFacet = [
                thisCone.points[i],
                pointCoordinate,
                thisCone.points[nextPoint]
            ];
            planeEq = CANVAS.getPlaneEquation(0, 1, 2, oneFacet);
            if (planeEq.c <= 0) {
                obj.drawPolygon(oneFacet, thisCone.lineColor, thisCone.fillColor);
            }
        }
    };
    priv.drawLine = function (thisLine) {
        obj.ctx.beginPath();
        obj.ctx.moveTo(thisLine.points[0].x(), thisLine.points[0].y());
        obj.ctx.lineWidth = thisLine.lineWidth || 4;
        obj.ctx.lineTo(thisLine.points[1].x(), thisLine.points[1].y());
        obj.ctx.strokeStyle = thisLine.color || "black";
        obj.ctx.stroke();
    };
    priv.drawText = function (thisText) {
        //text is drawn in a fashion where the center remains at the given point but will maintains its left to right appearance. The text will appear as if the ends orbit the center point
        thisText.points[0].setX(thisText.points[0].realX() - (thisText.fontWidth / 2));
        obj.ctx.fillStyle = thisText.color;
        obj.ctx.font = thisText.font;
        obj.ctx.fillText(thisText.text, thisText.points[0].x(), thisText.points[0].y());
    };
    priv.cone = function (baseDiameter, origin, pointCoordinate, lineColor, fillColor, facets) {
        //cone will be drawn with a skeleton of vector from the cartesian origin to the point Coordinate with a disk of radius baseDiameter/2. 
        //  Cross Product of point 1 and 2  giving point 3 (unit vector):
        //  3:X = (1:Y * 2:Z) - (1:Z * 2:Y)
        //  3:Y = (1:X * 2:Z) - (1:Z  * 2:X)
        //  3:Z = (1:X * 2:Y) - (1:Y * 2:X)
        var localX, localY, localZ, vectorOP, pointR, vectorOR, vectorPR, vectorOS, vectorOT, i, csObj, thisPoint, thisObj, centerVector;
        //1. The vector formed by the pointCoordinate and origin will be known as O-P
        //2. A random point call R which will form vectors O-R and P-R        
        centerVector = new CANVAS.Vector(CANVAS.clonePointDefinition(origin), CANVAS.clonePointDefinition(pointCoordinate));
        vectorOP = new CANVAS.Vector(origin, pointCoordinate);
        do {
            localX = Math.floor(Math.random() * 10);
            localY = Math.floor(Math.random() * 10);
            localZ = Math.floor(Math.random() * 10);
            pointR = new CANVAS.PointDefinition(localX, localY, localZ);
        } while (vectorOP.pointOnLine(pointR));
        //3. The Cross product of O-R and P-R will form a vector to that is perpendicular to O-P to a vector O-S. 
        vectorOR = new CANVAS.Vector(origin, pointR);
        vectorPR = new CANVAS.Vector(pointCoordinate, pointR);
        vectorOS = new CANVAS.Vector(vectorOR.getCrossProduct(vectorPR));
        //4. The new vector O-S is now perpendicular to O-P. Use cross product to find a point that is perpendicular to both O-P and O-S to vector OT
        vectorOT = new CANVAS.Vector(vectorOP.getCrossProduct(vectorOS));
        vectorOS.normalize();
        vectorOT.normalize();
        //6. Get Angle "A" as 360/facets
        //7. For each facet (Point F) get the coordinate by using this formula
        //      F:X = O:X + Radius * cos(A) * S:i + Radius * sin(A) * T:i
        //      F:Y = O:Y + Radius * cos(A) * S:j + Radius * sin(A) * T:j
        //      F:Z = O:Z + Radius * cos(A) * S:k + Radius * sin(A) * T:k
        if (facets === undefined || facets === null) { facets = 36; }
        thisObj = {};
        thisObj.points = [];
        if (facets < settings.defaultConeFacets) { facets = settings.defaultConeFacets; }
        for (i = 0; i < facets; i++) {
            csObj = CANVAS.getCosineSine((360 / facets) * i);
            localX = origin.realX() + ((baseDiameter / 2) * csObj.cos * vectorOS.i) + ((baseDiameter / 2) * csObj.sin * vectorOT.i);
            localY = origin.realY() + ((baseDiameter / 2) * csObj.cos * vectorOS.j) + ((baseDiameter / 2) * csObj.sin * vectorOT.j);
            localZ = origin.realZ() + ((baseDiameter / 2) * csObj.cos * vectorOS.k) + ((baseDiameter / 2) * csObj.sin * vectorOT.k);
            thisPoint = new CANVAS.PointDefinition(localX, localY, localZ);
            thisObj.points.push(thisPoint);
        }
        thisObj.centerPoint = centerVector.positionOfT(0.5);
        thisObj.points.push(pointCoordinate);
        thisObj.lineColor = lineColor;
        thisObj.fillColor = fillColor;
        thisObj.facets = facets;
        thisObj.drawingFunction = priv.drawCone;
        return thisObj;
    };
    priv.testLine = function (point1, point2, color) {
        obj.ctx.beginPath();
        obj.ctx.moveTo(point1.x(), point1.y());
        obj.ctx.lineWidth = 4;
        obj.ctx.lineTo(point2.x(), point2.y());
        obj.ctx.strokeStyle = color;
        obj.ctx.stroke();
    };
    priv.testHT = function (fontStyle, text) {
        var div, val, bod;
        div = document.createElement("div");
        div.setAttribute("style", "font:" + fontStyle + ";");
        div.innerHTML = text;
        bod = document.getElementsByTagName("body")[0];
        bod.appendChild(div);
        val = div.offsetHeight;
        bod.removeChild(div);
        return val;
    };
    priv.cloneObj = function (localObj) {
        var objOut, oneProp;
        objOut = {};
        for (oneProp in localObj) {
            if (localObj.hasOwnProperty(oneProp)) {
                objOut[oneProp] = localObj[oneProp];
            }
        }
        return objOut;
    };
    priv.swapItems = function (index0, index1, arrayIn) {
        var localObj;
        localObj = [arrayIn[index0][0], arrayIn[index0][1]];
        arrayIn[index0] = [arrayIn[index1][0], arrayIn[index1][1]];
        arrayIn[index1] = [localObj[0], localObj[1]];
    };
    //public methods and variables
    obj.mainObj = document.getElementById("cnv" + containerId);
    obj.ctx = obj.mainObj.getContext("2d");
    ///Contains the context object for the Canvas element
    obj.viewWidth = viewWidth;
    obj.viewHeight = viewHeight;
    obj.FieldOfView = fieldOfView;
    obj.viewDistance = viewDistance;
    obj.containerId = containerId;
    obj.canvasWidth = canvasWidth;
    obj.canvasHeight = canvasHeight;
    //**************************************items that can be added******************************
    // xlabel, ylabel, zlabel - the text to display on each end
    // corner - the corner where to display the compass, 0 - 3 = top left, top right, bottom right, bottom left
    // xPlus, yPlus, zPlus - if true will point to the positive (increasing) value of that axis
    // color - defaults to black
    // linewidth - defaults to 4
    obj.addCompass = function (xLabel, yLabel, zLabel, corner, color, lineWidth, xPlus, yPlus, zPlus) {
        ///<summary>Adds a compass rose showing the ordinal directions in one of the corners</summary>
        ///<param name="xLabel" type="String">The label to display in  the x direction</param>
        ///<param name="yLabel" type="String">The label to display in  the y direction</param>
        ///<param name="zLabel" type="String">The label to display in  the z direction</param>
        ///<param name="corner" type="Number">The corner where the compas will be displayed values 0-4 in order top left, top right, bottom right, bottom left</param>
        ///<param name="color" type="String">CSS color of the compas lines and labels</param>
        ///<param name="lineWidth" type="Number">Width of the lines in pixels</param>
        ///<param name="xPlus" type="Boolean">If true, the x arrow will point to the right</param>
        ///<param name="yPlus" type="Boolean">If true, the y arrow will point to the down</param>
        ///<param name="zPlus" type="Boolean">If true, the z arrow will point to the away from you</param>
        priv.compassObj = {};
        priv.compassObj.xlabel = xLabel;
        priv.compassObj.ylabel = yLabel;
        priv.compassObj.zlabel = zLabel;
        priv.compassObj.corner = corner;
        priv.compassObj.color = color;
        priv.compassObj.linewidth = lineWidth;
        priv.compassObj.xplus = xPlus;
        priv.compassObj.yplus = yPlus;
        priv.compassObj.zplus = zPlus;
        priv.compassObj.display = true;
    };
    obj.addCube = function (width, height, depth, centerPoint, colorArray, lineColor) {
        ///<summary>Draws a 3D cube</summary>
        ///<param name="width" type="Number">Width of the cube in pixels</param>
        ///<param name="height" type="Number">Height of the cube in pixels</param>
        ///<param name="depth" type="Number">Depth of the cube in pixels</param>
        ///<param name="centerPoint" type="CANVAS.PointDefinition">The point in the center of the cube</param>
        ///<param name="colorArray" type="Array">(Optional)An array of CSS colors for each side in order bottom, back, right, left, front, top</param>
        ///<param name="lineColor" type="String">(Optional) Defaults to #606060. The color of the lines</param>
        ///<returns type="Array">if getZValues is true returns an array of literal object containing the results of the plane equations</returns>
        var xOffset, yOffset, zOffset, thisObj, top, bottom;
        //draws a unit cube base on width, height and depth.  
        //                             Pitch = 45   
        //             Front: Yaw = 45            Rear: Yaw = 225
        //                    2                        5
        //                    /\                       /\
        //                   /  \                     /  \
        //                6 /side\1                 1/side\6
        //                 |\  5 /|                 |\ 5  /|
        //                 | \  / |                 | \  / |
        //         side:4=>| 5\/  |<=side:2 side:1=>| 2\/  |<=side:3
        //                7\   |  /0               0\   |  /7
        //                  \  | /                   \  | /
        //   if yaw = 0:     \ |/                     \ |/
        //   then front       4                         3
        //   side is 4               bottom side = 0
        xOffset = (width / 2);
        yOffset = (height / 2);
        zOffset = (depth / 2);
        //create the object
        thisObj = {};
        thisObj.points = [
            new CANVAS.PointDefinition(centerPoint.realX() + xOffset, centerPoint.realY() + yOffset, centerPoint.realZ() + zOffset), //Point 0        
            new CANVAS.PointDefinition(centerPoint.realX() + xOffset, centerPoint.realY() - yOffset, centerPoint.realZ() + zOffset), //Point 1
            new CANVAS.PointDefinition(centerPoint.realX() - xOffset, centerPoint.realY() - yOffset, centerPoint.realZ() + zOffset), //Point 2
            new CANVAS.PointDefinition(centerPoint.realX() - xOffset, centerPoint.realY() + yOffset, centerPoint.realZ() + zOffset), //Point 3
            new CANVAS.PointDefinition(centerPoint.realX() + xOffset, centerPoint.realY() + yOffset, centerPoint.realZ() - zOffset), //Point 4
            new CANVAS.PointDefinition(centerPoint.realX() + xOffset, centerPoint.realY() - yOffset, centerPoint.realZ() - zOffset), //Point 5
            new CANVAS.PointDefinition(centerPoint.realX() - xOffset, centerPoint.realY() - yOffset, centerPoint.realZ() - zOffset), //Point 6
            new CANVAS.PointDefinition(centerPoint.realX() - xOffset, centerPoint.realY() + yOffset, centerPoint.realZ() - zOffset)  //Point 7
        ];
        thisObj.lineColor = lineColor;
        thisObj.colorArray = colorArray;
        thisObj.drawingFunction = priv.drawCube;
        thisObj.centerPoint = CANVAS.clonePointDefinition(centerPoint);
        top = centerPoint.realY() - yOffset;
        bottom = centerPoint.realY() + yOffset;
        thisObj.centerPoint.setY(((top + bottom) > 0 ? bottom : top), true);
        priv.addItem(thisObj);
    };
    obj.addCircle = function (centerPoint, width, faceIndex, lineThickness, lineColor, startDegree, endDegree, clockwise, showArrow) {
        ///<summary>Draws a circle. If stop degree is specified, will stop at that degree and draw and arrow</summary>
        ///<param name="centerPoint" type="CANVAS.PointDefinition">The point of the center of the circle</param>
        ///<param name="width" type="Number">The width of the square that contains the circle</param>
        ///<param name="faceIndex", type="Number">The face to show the circle, in order: bottom, back, right, left, front, top</param>
        ///<param name="lineThickness" type="Number">(Optional)Defaults to 3. The line thickness in pixels of the circle</param>
        ///<param name="lineColor" type="String">(Optional)Defaults to Black. The css color name of the line (yellow || #303030)</param>
        ///<param name="startDegree" type="Number">(Optional)If specified will draw an arc that starts at the specified degree. Zero is at 3 o'clock and clockwise</param>
        ///<param name="endDegree" type="Number">(Optional)If specified will draw an arc that ends at the specified degree. Zero is at 3 O'clock and clockwise</param>
        ///<param name="clockwise" type="Boolean">(Optional)Ignored if startDegree and endDegree are no specified. Defaults to false. If true will connect start and end points in a clockwise fashion</param>
        ///<param name="showArrow" type="Boolean">(Optional)Ignored if startDegree and endDegree are not specified. Defaults to false. if true will place an arrow head at the end of the arc</param>
        var c, i, nc, r, nr, pattern, xStartIndex, yStartIndex, zStartIndex, xVal, yVal, zVal, defineCirclePoints, esObj, lastPoint, thisObj;
        //description of the circle being drawn:
        //Circle is drawn using 4 bezier curves going clockwise from 3 o'clock and with the assumption of face index 4 (i.e face1 is the mirror image)
        //Arrowheads are cones that are of 2PIr/8 with the point being the end point of the arc and cone base diameter of the difference of the radii of a circle 5% larger and 5% smaller
        // Degrees                                      240        270        300
        // arc pattern index(API)                        8          9          10
        // pointArray index(AI)                          10       11/12        13
        //                                               *      @ @ * @ @       *
        //                           Degree API   AI        @       |       @        AI    API   Degree
        //                            210    7     9  *   @  Q2     |   Q3    @   *  14     11   330
        //                                               @__________|__________@ 
        //                            180    6   7/8  * @           |           @ * 0/15     0   0/360
        //                                               @   Q1     |   Q0     @
        //                            150    5     6  *   @         |         @   *   1      1    30
        //                                                  @       |      @
        //                                               *     @ @  * @ @     *
        // pointArray index(AI)                          5        3/4         2
        // arc pattern index(API)                        4         3          2
        // Degrees                                      120        90         60
        r = (width / 2);
        defineCirclePoints = function () {
            //defines the points when not drawing a full circle (Arc)
            var cpObj, startCS, endCS, realStartDegree, realEndDegree, getQuad, getBezierPoints, display, arrowBaseDegree, arrowBaseCS, arrowheadCS;
            //adjust degrees since degrees start at 3 oclock but quadrant 0 is 12 to 3 o'clock
            getQuad = function (degree, isStart) {
                //what quandrants and what points need to be adjusted
                var localObj;
                localObj = {};
                if (degree <= 90) {
                    localObj.endPointIndex = (isStart ? 0 : 3);
                    localObj.quad = 0;
                } else if (degree <= 180) {
                    localObj.endPointIndex = (isStart ? 4 : 7);
                    localObj.quad = 1;
                } else if (degree <= 270) {
                    localObj.endPointIndex = (isStart ? 8 : 11);
                    localObj.quad = 2;
                } else {
                    localObj.endPointIndex = (isStart ? 12 : 15);
                    localObj.quad = 3;
                }
                localObj.bezierPoints = getBezierPoints(degree, localObj.quad, isStart);
                return localObj;
            };
            getBezierPoints = function (degree, quad, isStart) {
                //what bezier points to adjust
                var pointIndexes, quadAdjust, adjustedDegree;
                adjustedDegree = degree - (quad * 90);
                quadAdjust = quad * 4;
                pointIndexes = [];
                if (adjustedDegree <= 30) {
                    if (!isStart) {
                        pointIndexes.push(2 + quadAdjust);
                        pointIndexes.push(1 + quadAdjust);
                    }
                } else if (adjustedDegree <= 60) {
                    if (isStart) {
                        pointIndexes.push(1 + quadAdjust);
                    } else {
                        pointIndexes.push(2 + quadAdjust);
                    }
                } else {
                    if (isStart) {
                        pointIndexes.push(1 + quadAdjust);
                        pointIndexes.push(2 + quadAdjust);
                    }
                }
                return pointIndexes;
            };
            cpObj = {};
            arrowBaseDegree = endDegree + (clockwise ? -25 : 25);
            arrowBaseCS = CANVAS.getCosineSine(arrowBaseDegree);
            arrowBaseCS.rCos = r * arrowBaseCS.cos;
            arrowBaseCS.rSin = r * arrowBaseCS.sin;
            arrowheadCS = CANVAS.getCosineSine(endDegree);
            arrowheadCS.rCos = r * arrowheadCS.cos;
            arrowheadCS.rSin = r * arrowheadCS.sin;
            if (showArrow) { endDegree -= (clockwise ? 25 : -25); }
            realStartDegree = endDegree;
            realEndDegree = startDegree;
            if (clockwise === true) {
                realStartDegree = startDegree;
                realEndDegree = endDegree;
            }
            startCS = CANVAS.getCosineSine(realStartDegree);
            startCS.rCos = r * startCS.cos;
            startCS.rSin = r * startCS.sin;
            endCS = CANVAS.getCosineSine(realEndDegree);
            endCS.rCos = r * endCS.cos;
            endCS.rSin = r * endCS.sin;
            cpObj.startQuad = getQuad(realStartDegree, true);
            cpObj.endQuad = getQuad(realEndDegree, false);
            switch (faceIndex) {
            case 0:
            case 5:
                cpObj.startPoint = new CANVAS.PointDefinition(centerPoint.realX() + startCS.rCos, centerPoint.realY(), centerPoint.realZ() + startCS.rSin);
                cpObj.endPoint = new CANVAS.PointDefinition(centerPoint.realX() + endCS.rCos, centerPoint.realY(), centerPoint.realZ() + endCS.rSin);
                cpObj.arrowBasePoint = new CANVAS.PointDefinition(centerPoint.realX() + arrowBaseCS.rCos, centerPoint.realY(), centerPoint.realZ() + arrowBaseCS.rSin);
                cpObj.arrowheadPoint = new CANVAS.PointDefinition(centerPoint.realX() + arrowheadCS.rCos, centerPoint.realY(), centerPoint.realZ() + arrowheadCS.rSin);
                break;
            case 1:
            case 4:
                cpObj.startPoint = new CANVAS.PointDefinition(centerPoint.realX() + startCS.rCos, centerPoint.realY() + startCS.rSin, centerPoint.realZ());
                cpObj.endPoint = new CANVAS.PointDefinition(centerPoint.realX() + endCS.rCos, centerPoint.realY() + endCS.rSin, centerPoint.realZ());
                cpObj.arrowBasePoint = new CANVAS.PointDefinition(centerPoint.realX() + arrowBaseCS.rCos, centerPoint.realY() + arrowBaseCS.rSin, centerPoint.realZ());
                cpObj.arrowheadPoint = new CANVAS.PointDefinition(centerPoint.realX() + arrowheadCS.rCos, centerPoint.realY() + arrowheadCS.rSin, centerPoint.realZ());
                break;
            case 2:
            case 3:
                cpObj.startPoint = new CANVAS.PointDefinition(centerPoint.realX(), centerPoint.realY() + startCS.rSin, centerPoint.realZ() + startCS.rCos);
                cpObj.endPoint = new CANVAS.PointDefinition(centerPoint.realX(), centerPoint.realY() + endCS.rSin, centerPoint.realZ() + endCS.rCos);
                cpObj.arrowBasePoint = new CANVAS.PointDefinition(centerPoint.realX(), centerPoint.realY() + arrowBaseCS.rSin, centerPoint.realZ() + arrowBaseCS.rCos);
                cpObj.arrowheadPoint = new CANVAS.PointDefinition(centerPoint.realX(), centerPoint.realY() + arrowheadCS.rSin, centerPoint.realZ() + arrowheadCS.rCos);
                break;
            }

            cpObj.visibleQuads = [];
            for (i = 0; i < 4; i++) {
                display = (cpObj.endQuad.quad < cpObj.startQuad.quad ? (i >= cpObj.startQuad.quad || i <= cpObj.endQuad.quad) : (i >= cpObj.startQuad.quad && i <= cpObj.endQuad.quad));
                cpObj.visibleQuads.push(display);
            }

            return cpObj;
        };

        c = r * 0.551915024494;
        nr = r * -1;
        nc = c * -1;
        xStartIndex = null;
        yStartIndex = null;
        zStartIndex = null;
        //indexes: 0  1  2  3  4  5  6  7   8   9   10  11
        pattern = [0, c, r, r, r, c, 0, nc, nr, nr, nr, nc];
        switch (faceIndex) {
        case 0:
            xStartIndex = 3;
            zStartIndex = 0;
            break;
        case 1:
            xStartIndex = 9;
            yStartIndex = 0;
            break;
        case 2:
            yStartIndex = 0;
            zStartIndex = 3;
            break;
        case 3:
            yStartIndex = 0;
            zStartIndex = 9;
            break;
        case 4:
            xStartIndex = 3;
            yStartIndex = 0;
            break;
        case 5:
            xStartIndex = 3;
            zStartIndex = 6;
            break;
        }

        thisObj = {};
        thisObj.points = [];
        for (i = 0; i < 12; i++) {
            xVal = centerPoint.realX();
            if (xStartIndex !== null) {
                if (xStartIndex >= pattern.length) { xStartIndex = 0; }
                xVal += pattern[xStartIndex];
                xStartIndex++;
            }
            yVal = centerPoint.realY();
            if (yStartIndex !== null) {
                if (yStartIndex >= pattern.length) { yStartIndex = 0; }
                yVal += pattern[yStartIndex];
                yStartIndex++;
            }
            zVal = centerPoint.realZ();
            if (zStartIndex !== null) {
                if (zStartIndex >= pattern.length) { zStartIndex = 0; }
                zVal += pattern[zStartIndex];
                zStartIndex++;
            }
            thisObj.points.push(new CANVAS.PointDefinition(xVal, yVal, zVal));
            //every fourth point duplicate
            if (i === 3 || i === 6 || i === 9) { thisObj.points.push(new CANVAS.PointDefinition(xVal, yVal, zVal)); }
            if (i === 0) { lastPoint = new CANVAS.PointDefinition(xVal, yVal, zVal); }
        }
        thisObj.points.push(lastPoint);

        if (startDegree !== undefined && startDegree !== null && endDegree !== undefined && endDegree !== null) {
            esObj = defineCirclePoints();
            thisObj.points[esObj.startQuad.endPointIndex] = CANVAS.clonePointDefinition(esObj.startPoint);
            thisObj.points[esObj.endQuad.endPointIndex] = CANVAS.clonePointDefinition(esObj.endPoint);
            if (esObj.startQuad.bezierPoints && esObj.startQuad.bezierPoints.length > 0) {
                for (i = 0; i < esObj.startQuad.bezierPoints.length; i++) {
                    thisObj.points[esObj.startQuad.bezierPoints[i]] = CANVAS.clonePointDefinition(esObj.startPoint);
                }
            }
            if (esObj.endQuad.bezierPoints && esObj.endQuad.bezierPoints.length > 0) {
                for (i = 0; i < esObj.endQuad.bezierPoints.length; i++) {
                    thisObj.points[esObj.endQuad.bezierPoints[i]] = CANVAS.clonePointDefinition(esObj.endPoint);
                }
            }
        }

        if (showArrow && esObj !== undefined) {
            obj.addCone(width * 0.11, esObj.arrowBasePoint, esObj.arrowheadPoint, lineColor, lineColor, 12);
        }
        thisObj.esObj = esObj;
        thisObj.drawingFunction = priv.drawCircle;
        thisObj.lineColor = lineColor;
        thisObj.lineThickness = lineThickness;
        thisObj.centerPoint = CANVAS.clonePointDefinition(centerPoint);
        priv.addItem(thisObj);
    };
    obj.addCone = function (baseDiameter, origin, pointCoordinate, lineColor, fillColor, facets) {
        ///<summary>Draws a cone in 3D space. The base of which will be perpendicular to the vector form by connecting the origin and pointCoordinate coordinates.</summary>
        ///<param name="baseDiameter" type="Number">The diameter at the base of the cone</param>
        ///<param name="origin" type="CANVAS.PointDefinition">The coordinates of the center of the base</param>
        ///<param name="pointCoordinate" type="CANVAS.PointDefinition">the coordinate of the tip</param>
        ///<param name="lineColor" type="String">(Optional) Defaults to Black. The CSS color of the lines making up the cone</param>
        ///<param name="fillColor" type="String">(Optional) Defaults to Black. Thee CSS color that is used to fill all the facets of the code</param>
        ///<param name="facets" type="Number">(Optional) Defaults to 36, minimum of 12. Determines the number of sides that the base circle has and therefore facets of the cone surface. More facets take longer to draw but will show up better on large cones</param>
        priv.addItem(priv.cone(baseDiameter, origin, pointCoordinate, lineColor, fillColor, facets));
    };
    obj.addLine = function (startPoint, endPoint, color, lineWidth, showEndArrow, showStartArrow) {
        ///<summary>Draws a line that can have an arrow on either end</summary>
        ///<param name="startPoint" type="CANVAS.PointDefinition">The starting point of the line</param>
        ///<param name="endPoint" type="CANVAS.PointDefinistion">The ending point of the line</param>
        ///<param name="color" type="String">(Optional) Defaults to black. The CSS color of the line</param>
        ///<param name="lineWidth" type="Number">(Optional)Defaults to 4. The thickness in pixels of the line</param>
        ///<param name="showEndArrow" type="Boolean">(Optional)Defaults to false. if true will put an arrow on the end point</param>
        ///<param name="showStartArrow" type="Boolean">(Optional)Defaults to false. if true will put an arron on the start point</param>
        var localVector, lineVector, startPointT, endPointT, localStartPoint, localEndPoint, startArrowPoint, startArrowBase, endArrowPoint, endArrowBase, arrowWidth, thisObj;
        localVector = new CANVAS.Vector(CANVAS.clonePointDefinition(startPoint), CANVAS.clonePointDefinition(endPoint));
        lineVector = new CANVAS.Vector(CANVAS.clonePointDefinition(startPoint), CANVAS.clonePointDefinition(endPoint));
        startPointT = (showStartArrow === true ? 0.1 : 0);
        endPointT = (showEndArrow === true ? 0.9 : 1);
        localStartPoint = localVector.positionOfT(startPointT);
        localEndPoint = localVector.positionOfT(endPointT);
        startArrowPoint = localVector.positionOfT(0);
        startArrowBase = CANVAS.clonePointDefinition(localStartPoint);
        endArrowPoint = localVector.positionOfT(1);
        endArrowBase = CANVAS.clonePointDefinition(localEndPoint);
        arrowWidth = 0.0625 * ((lineWidth || 4) / 4);
        if (showStartArrow === true) {
            obj.addCone(arrowWidth, startArrowBase, startArrowPoint, (color || "black"), (color || "black"), 12);
        }
        if (showEndArrow === true) {
            obj.addCone(arrowWidth, endArrowBase, endArrowPoint, (color || "black"), (color || "black"), 12);
        }
        thisObj = {};
        thisObj.points = [localStartPoint, localEndPoint];
        thisObj.color = color;
        thisObj.lineWidth = lineWidth;
        thisObj.drawingFunction = priv.drawLine;
        thisObj.centerPoint = lineVector.positionOfT(0.5);
        priv.addItem(thisObj);
    };
    obj.addText = function (point, text, font, color) {
        ///<summary>Places text in 3D Space</summary>
        ///<param name="point" type="CANVAS.PointDefinition">The point where the text will be drawn</param>
        ///<param name="text" type="String">The text to print</param>
        ///<param name="font" type="String">(Optional) defaults to "10pt Calibri". The font description.</param>
        ///<param name="color" type="String">(Optioal) defaults to black. The CSS color of the font</param>
        var thisObj;
        if (!text || text === "") { return; }
        font = font || "10pt Calibri";
        obj.ctx.font = font;
        thisObj = {};
        thisObj.fontHeight = priv.testHT(font, text);
        thisObj.fontWidth = obj.ctx.measureText(text).width;
        thisObj.points = [point];
        thisObj.text = text;
        thisObj.font = font;
        thisObj.color = color;
        thisObj.drawingFunction = priv.drawText;
        thisObj.centerPoint = CANVAS.clonePointDefinition(point);
        priv.addItem(thisObj);
    };
    obj.drawPolygon = function (points, lineColor, fillColor, adjustPoints) {
        ///<summary>Draws a closed polygon</summary>
        ///<param name="points" type="Array:CANVAS.PointDefinition">Array in order that will be drawn</param>
        ///<param name="lineColor" type="String">(Optional) Defaults to black. The color of the lines of the polygon</param>
        ///<param name="fillColor" type="String">(Optional) Default to black. the color to fill the polygon</param>
        ///<param name="adjustPoints" type="Boolean">(Optional) Defaults to false. Whether or not to adjust the points to 3d</param>
        var i;
        if (adjustPoints === true) {
            obj.adjustPointArray(points);
        }
        obj.ctx.beginPath();
        obj.ctx.strokeStyle = lineColor || "black";
        obj.ctx.moveTo(points[0].x(), points[0].y());
        if (points.length > 1) {
            for (i = 1; i < points.length; i++) {
                obj.ctx.lineTo(points[i].x(), points[i].y());
            }
        }
        obj.ctx.lineWidth = 1; //line thickness
        obj.ctx.closePath();
        obj.ctx.fillStyle = fillColor || "black";
        obj.ctx.fill(); //fill in the polygon with color
        obj.ctx.stroke(); //render
    };
    obj.drawPoint = function (point, color, pixelDiameter) {
        ///<summary>Draws a circle on the point given. Adjust in 3D space before using</summary>
        ///<param name="point" type="CANVAS.PointDefinition">The point</param>
        ///<param name="color" type="String">(Optional) Defaults to red. The CSS color of the point</param>
        ///<param name="pixelDiameter" type="Number">(Optional) Defaults to 4. The width of the point in pixels</param>
        if (!point) { return; }
        obj.ctx.beginPath();
        obj.ctx.arc(point.x(), point.y(), 1, 0, 2 * Math.PI);
        obj.ctx.lineWidth = pixelDiameter || 4;
        obj.ctx.strokeStyle = color || "red";
        obj.ctx.stroke();
    };
    //*******************adjust points for 3D effect***************************************//
    obj.adjustPointArray = function (arrayIn, skipViewAdjust) {
        ///<summary>Takes an array of CANVAS.PointDefinition(s) and adjust them in 3D Space</summary>
        ///<param name="arrayIn" type="Array">An array of CANVAS.PointDefinitions</param>
        ///<param name="skipViewAdjust" type="Boolean">(Optional) Defaults to false. If true will not do adjust the rotations based on view specifications</param>
        var i;
        for (i = 0; i < arrayIn.length; i++) {
            obj.adjustOnePoint(arrayIn[i], skipViewAdjust);
        }
    };
    obj.adjustOnePoint = function (point, skipViewAdjust) {
        ///<summary>Adjust a single CANVAS.PointDefinition in 3D space</sumary>
        ///<param name="point" type="CANVAS.PointDefinition">The Point to adjust</param>
        ///<param name="skipViewAdjust" type="Boolean">(Optional) Defaults to false. If true will not do adjust the rotations based on view specifications</param>
        if (point === undefined || point === null) { return; }
        point.rotateY(obj.currentYaw);
        point.rotateX(obj.currentPitch);
        point.rotateZ(obj.currentRoll);
        if (!skipViewAdjust) {
            point.adjustView(obj.viewWidth, obj.viewHeight, obj.FieldOfView, obj.viewDistance);
        }
    };
    obj.execute = function () {
        ///<summary>Draws initial image on canvas after all items are added</summary>
        priv.doWork();
    };
    //*******************************Canvas Rotation*******************************//
    obj.mouseIsClicked = false;
    obj.currentYaw = 0;
    obj.currentPitch = 0;
    obj.currentRoll = 0;
    obj.lastMouseX = null;
    obj.lastMouseY = null;
    obj.mouseClick = function (state) {
        ///<summary>Determines that the mouse is in the click state or not. Place in canvas element events:onmousedown-true; onmouseup-false; onmouseout-false ie CANVAS.instance.canvasId.mouseClick(stat);</summary>
        ///<param name="state" type="Boolean">Determines if the mouse button is clicked</param>
        obj.mouseIsClicked = state;
        if (!state) {
            obj.lastMouseX = null;
            obj.lastMouseY = null;
        }
    };
    obj.mouseMove = function (e) {
        ///<summary>Updates the Yaw and Pitch based on the mouse movement. Place in canvas element event onmousemove=CANVAS.instance.canvasId.mousemove(event)</summary>
        ///<param name="e" type="Object">Event Object</param>
        ///<param name="callFunction" type="Function Object">The function to call when mouse is done moving to refresh all elements</param>
        var xMovement, yMovement;
        if (!obj.mouseIsClicked) { return; }//do nothing if the mouse is not clicked
        xMovement = e.clientX;
        yMovement = e.clientY;
        if (!obj.mouseStartX) {
            obj.mouseStartX = xMovement;
        }
        if (!obj.mouseStartY) {
            obj.mouseStartY = yMovement;
        }
        if (!obj.lastMouseX) {
            obj.lastMouseX = xMovement;
        }
        if (!obj.lastMouseY) {
            obj.lastMouseY = yMovement;
        }
        //left-right(x movement) is Yaw
        //up-down (y movement) is Pitch
        if (xMovement !== obj.lastMouseX) {
            obj.currentYaw += ((xMovement - obj.lastMouseX) / 3) * -1;
        }
        if (yMovement !== obj.lastMouseY) {
            obj.currentPitch += (yMovement - obj.lastMouseY) / 3;
        }
        priv.resetOverflow();
        obj.lastMouseX = xMovement;
        obj.lastMouseY = yMovement;
        obj.clearCanvas();
        priv.doWork(true);//redraw all items for new Yaw and Pitch
    };
    priv.resetOverflow = function () {
        //reset for overflow
        if (obj.currentYaw < 0) { obj.currentYaw = 360 + obj.currentYaw; }
        if (obj.currentYaw > 360) { obj.currentYaw = obj.currentYaw - 360; }
        if (obj.currentPitch < 0) { obj.currentPitch = 360 + obj.currentPitch; }
        if (obj.currentPitch > 360) { obj.currentPitch = obj.currentPitch - 360; }
    };
    //*****************************Canvas rotation by button*****************************
    priv.movingYaw = false;
    priv.movingPositive = false; //positive yaw is to the right, positive pitch is down
    priv.intervalObj = null;
    priv.moveItem = function () {
        var direction, movementPerInterval;
        movementPerInterval = 2;
        direction = (priv.movingPositive ? 1 : -1);
        if (priv.movingYaw) {
            obj.currentYaw += (movementPerInterval * direction);
        } else {
            obj.currentPitch += (movementPerInterval * direction);
        }
        priv.resetOverflow();
        obj.lastMouseX = null;
        obj.lastMouseY = null;
        obj.clearCanvas();
        priv.doWork(true);
    };
    priv.animate = function (animate) {
        if (animate) {
            priv.intervalObj = setInterval(function () { priv.moveItem(); }, 25);
        } else {
            clearInterval(priv.intervalObj);
        }
    };
    obj.buttonClickUp = function (animate) {
        priv.movingYaw = false;
        priv.movingPositive = false;
        priv.animate(animate);
    };
    obj.buttonClickDown = function (animate) {
        priv.movingYaw = false;
        priv.movingPositive = true;
        priv.animate(animate);
    };
    obj.buttonClickLeft = function (animate) {
        priv.movingYaw = true;
        priv.movingPositive = true;
        priv.animate(animate);
    };
    obj.buttonClickRight = function (animate) {
        priv.movingYaw = true;
        priv.movingPositive = false;
        priv.animate(animate);
    };
    //*****************************Clear the canvas******************************************
    obj.clearCanvas = function () {
        obj.ctx.clearRect(0, 0, obj.mainObj.width, obj.mainObj.height);
    };
    CANVAS.instance[containerId] = obj;
    return obj;
};
CANVAS.execute = function (containerId) {
    ///<summary>Draws the objects and begins event detection</summary>
    "use strict";
    CANVAS.instance[containerId].execute();
};

CANVAS.inversePoint = function (coordinate, originCoordinate) {
    ///<summary>For a point coordinate, returns the inverse value. (I.e. a point on the other side of the origin equi-distant to the origin)<summary>
    ///<param name="coordinate" type="Number">The Coordinate to inverse</param>
    ///<param name="originCoordinate" type="Number">The value from the origin (Generally the center of the construct) of the same type (X, Y, Z)</param>
    ///<returns type="Number">The Inverse</returns>
    "use strict";
    return (coordinate - ((coordinate - originCoordinate) * 2));
};
CANVAS.swapPoints = function (index1, index2, pointArray) {
    ///<summary>Takes two PointDefinition(s) and switches them<summary>
    ///<param name="index1" type="Number">The index of the first point</param>
    ///<param name="index2" type="Number">The index of the second point</param>
    ///<param name="pointArray" type="Array of CANVAS.PointDefinition">The array containing the points</params>
    "use strict";
    var holder;
    holder = new CANVAS.PointDefinition(pointArray[index1].realX(), pointArray[index1].realY(), pointArray[index1].realZ());
    pointArray[index1] = new CANVAS.PointDefinition(pointArray[index2].realX(), pointArray[index2].realY(), pointArray[index2].realZ());
    pointArray[index2] = new CANVAS.PointDefinition(holder.realX(), holder.realY(), holder.realZ());
};
CANVAS.getCirclePoint = function (origin, radius, degreeAngle) {
    ///<summary>Gets the coordinates of a point on the edge of a circle perpendicular to the Z Axis</summary>
    ///<param name="origin" type="CANVAS.PointDefinition">The Coordinates of the origin of the circle</param>
    ///<param name="radius" type="Number">The radius of the circle</param>
    ///<param name="degreeAngle" type="Number">The angle to obtain between 0 and 360</param>
    "use strict";
    var cs;
    while (degreeAngle > 360) { degreeAngle -= 360; }
    while (degreeAngle < 0) { degreeAngle += 360; }
    cs = CANVAS.getCosineSine(degreeAngle);
    return new CANVAS.PointDefinition(radius * cs.cos + origin.realX(), radius * cs.sin + origin.realY(), origin.realZ());
};
CANVAS.getCosineSine = function (degreeAngle) {
    ///<summary>for a given angle in degrees returns the Sine and Cosine in a literal object</summary>
    ///<param name="degreeAngle" type="Number">The Angle</param>
    ///<returns type="Literal Object">with properties cos and sin</returns>
    "use strict";
    var rad, obj;
    rad = degreeAngle * Math.PI / 180;//convert to radians
    obj = {};
    obj.cos = Math.cos(rad);
    obj.sin = Math.sin(rad);
    return obj;
};
CANVAS.getArea = function (indexes, points) {
    ///<summary>Gets the area of a polygon made up of the point indexes provided within and array of CANVAS.PointDefinition(s)</summary>
    ///<param name="indexes" type="Array">and array of indexes of the points that make up the polygon</param>
    ///<param name="points" type="Array of CANVAS.PointDefinition">The points in array</param>
    ///<returns type="Number">The area</returns>
    "use strict";
    var area, i, nextItem;
    area = 0;
    for (i = 0; i < indexes.length; i++) {
        nextItem = i + 1;
        if (nextItem >= indexes.length) { nextItem = 0; }
        area += ((points[indexes[i]].y() + points[indexes[nextItem]].y()) / 2) * (points[indexes[nextItem]].x() - points[indexes[i]].x());
    }
    return area;
};

CANVAS.getPlaneEquation = function (point0, point1, point2, points) {
    ///<summary>Gets the equation describing a plane in Cartesian grid, use the d Value to determine the position of the plane with respect to the user</summary>
    ///<param name="point0" type="Number">index of point 0</param>
    ///<param name="point1" type="Number">index of point 1</param>
    ///<param name="point2" type="Number">index of point 2</param>
    ///<param name="points" type="Array of CANVAS.PointDefinition">The points in array</param>
    ///<returns type="Literal Object">A literal object containing the values in the equation</returns>
    "use strict";
    //Equation describes the plane as follows ax + by + cz + d = 0
    //in a plane where any three points are given that form two vectors from a common origin for example vectors AC and AB
    //a = (By-Ay)(Cz-Az)-(Cy-Ay)(Bz-Az)
    //b = (Bz-Az)(Cx-Ax)-(Cz-Az)(Bx-Ax)
    //c = (Bx-Ax)(Cy-Ay)-(Cx-Ax)(By-Ay)
    //d = -(aAx+bAy+cAz).
    var a, b, c, d, obj;
    a = ((points[point1].y() - points[point0].y()) * (points[point2].z() - points[point0].z())) - ((points[point2].y() - points[point0].y()) * (points[point1].z() - points[point0].z()));
    b = ((points[point1].z() - points[point0].z()) * (points[point2].x() - points[point0].x())) - ((points[point2].z() - points[point0].z()) * (points[point1].x() - points[point0].x()));
    c = ((points[point1].x() - points[point0].x()) * (points[point2].y() - points[point0].y())) - ((points[point2].x() - points[point0].x()) * (points[point1].y() - points[point0].y()));
    d = ((a * points[point0].x()) + (b * points[point0].y()) + (c * points[point0].z())) * -1;
    obj = { "a": a, "b": b, "c": c, "d": d };
    return obj;
};
CANVAS.getPlaneEquationPoints = function (point0, point1, point2) {
    ///<summary>Gets the equation describing a plane in Cartesian grid based on 3 point definitions</summary>
    ///<param name="point0" type="CANVAS.PointDefinition" />
    ///<param name="point1" type="CANVAS.PointDefinition" />
    ///<param name="point2" type="CANVAS.PointDefinition" />
    ///<returns type="Literal Object">A literal object containing the values in the equation</returns>
    "use strict";
    var pointArray;
    pointArray = [
        point0,
        point1,
        point2
    ];
    return CANVAS.getPlaneEquation(0, 1, 2, pointArray);
};
CANVAS.clonePointDefinition = function (pointToClone) {
    ///<summary>Clones a point Definition</summary>
    ///<param name="pointToClone" type="CANVAS.PointDefinition" />
    ///<returns type="CANVAS.PointDefinition" />
    "use strict";
    return new CANVAS.PointDefinition(pointToClone.realX(), pointToClone.realY(), pointToClone.realZ());
};
//*****************************Vector Class************************************************
CANVAS.Vector = function (startPoint, endPoint) {
    ///<summary>Defines a vector and performs functions</summary>
    ///<param name="startPoint" type="CANVAS.PointDefinition">The starting point of the vector</param>
    ///<param name="endPoint" type="CANVAS.PointDefinition">The ending point of the vector</param>
    "use strict";
    var that;
    that = this;
    this.i = null;
    this.j = null;
    this.k = null;
    if (endPoint) {
        this.i = (endPoint.realX() - startPoint.realX());
        this.j = (endPoint.realY() - startPoint.realY());
        this.k = (endPoint.realZ() - startPoint.realZ());
    } else {
        this.i = startPoint.realX();
        this.j = startPoint.realY();
        this.k = startPoint.realZ();
    }
    ///<var>the original length</var>
    this.length = that.length = Math.sqrt(Math.pow(this.i, 2) + Math.pow(this.j, 2) + Math.pow(this.k, 2));
    this.normalize = function () {
        ///<summary>turns the vector into a unit vector.  This is destructive of the original values</summary>
        that.i = (that.length === 0 ? 0 : that.i / that.length);
        that.j = (that.length === 0 ? 0 : that.j / that.length);
        that.k = (that.length === 0 ? 0 : that.k / that.length);
    };
    this.pointOnLine = function (point) {
        ///<summary>Determines if the given point lies in the vector</summary>
        ///<param name="point" type="CANVAS.PointDefinition">The point to check</param>
        ///<returns type="Boolean">True if the point is in the vector</returns>
        var para0, para1, para2;
        para0 = (point.realX() - startPoint.realX()) / that.i;
        para1 = (point.realY() - startPoint.realY()) / that.j;
        para2 = (point.realZ() - startPoint.realZ()) / that.k;
        return ((para0 === para1) && (para0 === para2));
    };
    this.getCrossProduct = function (otherVector) {
        ///<summary>retruns the cross product which is a vector the is perpendicular to both vectors</summary>
        ///<param name="otherVector" type="CANVAS.vector">Other vector</param>
        ///<returns type="CANVAS.pointDefinition">The new vector</returns>
        //  Cross Product of point 1 and 2  giving point 3 (unit vector):
        //  3:i = (1:j * 2:k) - (1:k * 2:j)
        //  3:j = (1:i * 2:k) - (1:k  * 2:i)
        //  3:k = (1:i * 2:j) - (1:j * 2:i)
        var localX, localY, localZ;
        localX = (that.j * otherVector.k) - (that.k * otherVector.j);
        localY = ((that.i * otherVector.k) - (that.k * otherVector.i)) * -1;
        localZ = (that.i * otherVector.j) - (that.j * otherVector.i);
        return new CANVAS.PointDefinition(localX, localY, localZ);
    };
    this.getPoint = function () {
        ///<summary>returns a new point representing the vector values</summary>
        ///<returns type="CANVAS.PointDefinition" />
        return new CANVAS.PointDefinition(that.i, this.j, this.k);
    };
    this.positionOfT = function (t) {
        ///<summary>Returns the position as a multiple of the total lenght. i.e. 0 is the begining, 1 is the end, 0.5 is halfway, 2 is twice the length measured from begining along the vector</summary>
        ///<param name="t" type="Number">The multiple of the lenght</param>
        ///<returns type="CANVAS.PointDefinition">New instance</returns>
        var localX, localY, localZ;
        //that.normalize();
        localX = startPoint.realX() + (that.i * t);
        localY = startPoint.realY() + (that.j * t);
        localZ = startPoint.realZ() + (that.k * t);
        return new CANVAS.PointDefinition(localX, localY, localZ);
    };
};
//******************************Point Class*************************************************
CANVAS.PointDefinition = function (x, y, z) {
    ///<summary>Defines a single Point in 3D</summary>
    ///<param name="x" type="Number" />
    ///<param name="y" type="Number" />
    ///<param name="z" type="Number" />
    "use strict";
    var updateVals, that, originalVals;
    that = this;
    this.showX = x;
    this.showY = y;
    this.showz = z;
    originalVals = { "x": x, "y": y, "z": z };
    this.rotateX = function (angle) {
        var obj, localY, localZ;
        obj = CANVAS.getCosineSine(angle);
        localY = y * obj.cos - z * obj.sin;
        localZ = y * obj.sin + z * obj.cos;
        y = localY;
        z = localZ;
        updateVals();
    };

    this.rotateY = function (angle) {
        var obj, localX, localZ;
        obj = CANVAS.getCosineSine(angle);
        localZ = z * obj.cos - x * obj.sin;
        localX = z * obj.sin + x * obj.cos;
        z = localZ;
        x = localX;
        updateVals();
    };

    this.rotateZ = function (angle) {
        var obj, localX, localY;
        obj = CANVAS.getCosineSine(angle);
        localX = x * obj.cos - y * obj.sin;
        localY = x * obj.sin + y * obj.cos;
        x = localX;
        y = localY;
        updateVals();
    };

    this.adjustView = function (width, height, fov, distance) {
        var factor, localX, localY;
        factor = fov / (distance + z);
        localX = x * factor + width / 2;
        localY = y * factor + height / 2;
        x = localX;
        y = localY;
        updateVals();
    };
    this.reset = function () {
        x = originalVals.x;
        y = originalVals.y;
        z = originalVals.z;
        updateVals();
    };
    this.x = function () {
        return Math.round(x);
    };
    this.y = function () {
        return Math.round(y);
    };
    this.z = function () {
        return Math.round(z);
    };

    this.realX = function () {
        return x;
    };
    this.realY = function () {
        return y;
    };
    this.realZ = function () {
        return z;
    };

    this.setX = function (newX, changeOriginal) {
        x = newX;
        if (changeOriginal === true) {
            originalVals.x = newX;
        }
        updateVals();
    };

    this.setY = function (newY, changeOriginal) {
        y = newY;
        if (changeOriginal === true) {
            originalVals.y = newY;
        }
        updateVals();
    };
    this.setZ = function (newZ, changeOriginal) {
        z = newZ;
        if (changeOriginal === true) {
            originalVals.z = newZ;
        }
        updateVals();
    };
    updateVals = function () {
        that.showX = x;
        that.showY = y;
        that.showz = z;
    };
};
//*******************************************Color Array***************************************************************//
CANVAS.colorArray = function () {
    "use strict";
    return [
        "AliceBlue",
        "AntiqueWhite",
        "Aqua",
        "Aquamarine",
        "Azure",
        "Beige",
        "Bisque",
        "Black",
        "BlanchedAlmond",
        "Blue",
        "BlueViolet",
        "Brown",
        "BurlyWood",
        "CadetBlue",
        "Chartreuse",
        "Chocolate",
        "Coral",
        "CornflowerBlue",
        "Cornsilk",
        "Crimson",
        "Cyan",
        "DarkBlue",
        "DarkCyan",
        "DarkGoldenRod",
        "DarkGray",
        "DarkGreen",
        "DarkKhaki",
        "DarkMagenta",
        "DarkOliveGreen",
        "DarkOrange",
        "DarkOrchid",
        "DarkRed",
        "DarkSalmon",
        "DarkSeaGreen",
        "DarkSlateBlue",
        "DarkSlateGray",
        "DarkTurquoise",
        "DarkViolet",
        "DeepPink",
        "DeepSkyBlue",
        "DimGray",
        "DodgerBlue",
        "FireBrick",
        "FloralWhite",
        "ForestGreen",
        "Fuchsia",
        "Gainsboro",
        "GhostWhite",
        "Gold",
        "GoldenRod",
        "Gray",
        "Green",
        "GreenYellow",
        "HoneyDew",
        "HotPink",
        "IndianRed",
        "Indigo",
        "Ivory",
        "Khaki",
        "Lavender",
        "LavenderBlush",
        "LawnGreen",
        "LemonChiffon",
        "LightBlue",
        "LightCoral",
        "LightCyan",
        "LightGoldenRodYellow",
        "LightGray",
        "LightGreen",
        "LightPink",
        "LightSalmon",
        "LightSeaGreen",
        "LightSkyBlue",
        "LightSlateGray",
        "LightSteelBlue",
        "LightYellow",
        "Lime",
        "LimeGreen",
        "Linen",
        "Magenta",
        "Maroon",
        "MediumAquaMarine",
        "MediumBlue",
        "MediumOrchid",
        "MediumPurple",
        "MediumSeaGreen",
        "MediumSlateBlue",
        "MediumSpringGreen",
        "MediumTurquoise",
        "MediumVioletRed",
        "MidnightBlue",
        "MintCream",
        "MistyRose",
        "Moccasin",
        "NavajoWhite",
        "Navy",
        "OldLace",
        "Olive",
        "OliveDrab",
        "Orange",
        "OrangeRed",
        "Orchid",
        "PaleGoldenRod",
        "PaleGreen",
        "PaleTurquoise",
        "PaleVioletRed",
        "PapayaWhip",
        "PeachPuff",
        "Peru",
        "Pink",
        "Plum",
        "PowderBlue",
        "Purple",
        "RebeccaPurple",
        "Red",
        "RosyBrown",
        "RoyalBlue",
        "SaddleBrown",
        "Salmon",
        "SandyBrown",
        "SeaGreen",
        "SeaShell",
        "Sienna",
        "Silver",
        "SkyBlue",
        "SlateBlue",
        "SlateGray",
        "Snow",
        "SpringGreen",
        "SteelBlue",
        "Tan",
        "Teal",
        "Thistle",
        "Tomato",
        "Turquoise",
        "Violet",
        "Wheat",
        "White",
        "WhiteSmoke",
        "Yellow",
        "YellowGreen"
    ];
};