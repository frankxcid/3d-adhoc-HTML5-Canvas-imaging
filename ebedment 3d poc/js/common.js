/*jslint browser: true, plusplus: true */
/*global AJAXPOST, FILLIN, HELPTOPICS, TIMEPICKER, CAL*/
/// <reference path="ajaxpost.js" />
/// <reference path="fillinform.js" />
/// <reference path="helptopics.js" />
/// <reference path="timepicker.js" />
/// <reference path="calendar.js" />
//ver 2.0.1 01/19/2015
//01/19/2015 - changed COMMON.blockInput to be able to block all items in the body if containerId = "body", added logic to disable links also, added COMMON.zChangeElementAvailability
//Holds function that are common to all scripts like control makers and other items. Added COMMON.getFileUpload
var COMMON = {};
///<var>allows the document to be changed for all components</var>
COMMON.docObj = document;
///<var>function COMMON.errMess will use this id as the span containing the error message so that it does not interfere with other uses of the error message div</var>
COMMON.defaultMessSpanId = "spCommon";
///<var>The default div where messages will be displayed</var>
COMMON.pageMessageDivId = "pnMess";
///<var>The default hidden field where the button id used to trigger a postback is stored.  This is how the server code is aware which button was clicked by the user</var>
COMMON.postBackObjId = "txtObject";
///<var>The default form name that will be used to post back</var>
COMMON.defaultFormName = "form1";
///<var>The default div id which will be used to display page content. Use this to store the value for other scripts</var>
COMMON.defaultDisplayDivId = "pnMainTop";

//***************************************Utility Items: items that manipulate or fix items*************************************************************//
COMMON.stripHTML = function (strIn) {
    ///<summary>Takes the innerHTML of an element and returns only the text without markup tags</summary>
    ///<param name="strIn" type="String">The String that has markup tags that need removed</param>
    ///<returns type="String"></returns>
    "use strict";
    var elem;
    elem = COMMON.docObj.createElement("div");
    elem.innerHTML = strIn;
    return elem.textContent || elem.innerText || "";
};
COMMON.sortArray = function (arrayIn, index, reverse) {
    ///<summary>Sorts an array of an array of arrays by a single element using the array's built in sort function</summary>
    ///<param name="arrayIn" type="Array">The array to sort</param>
    ///<param name="index" type="Number">(Optional) Ignored if the array does not have arrays in each element. This is the index of the second dimension</param>
    ///<param name="reverse" type="Boolean">(Optional) Sort in reverse if true</param>
    ///<returns type="Number">Output used by array's built in Sort function</returns>
    "use strict";
    var isNumeric, isDate, i, sort2, sort1, thisValue, isArray2;
    isNumeric = true;
    isDate = true;
    //determine if 2 dimensional
    isArray2 = (Object.prototype.toString.call(arrayIn[0]) === Object.prototype.toString.call([]));
    //see if data or column is all numeric, or all dates 
    for (i = 0; i < arrayIn.length; i++) {
        thisValue = (isArray2 ? arrayIn[i][index] : arrayIn[i]);
        if (!(!isNaN(new Date(thisValue)) && isNaN(thisValue))) {
            isDate = false;
        }
        if (isNaN(thisValue)) {
            isNumeric = false;
        }
        if (!isDate && !isNumeric) { break; }
    }
    if (isDate) { isNumeric = false; }
    sort1 = function (o, p) {
        var a, b, low, high, tA, tB;
        low = reverse ? 1 : -1;
        high = reverse ? -1 : 1;
        if (isNumeric) {
            a = parseFloat(String(o));
            b = parseFloat(String(p));
        } else if (isDate) {
            a = new Date(String(o));
            a = a.getTime();
            b = new Date(String(p));
            b = b.getTime();
        } else {
            a = String(o);
            b = String(p);
            if (a === "" && b !== "") { return low; }
            if (a !== "" && b === "") { return high; }
        }
        if (a === b) {
            return 0;
        }
        tA = typeof a;
        tB = typeof b;
        if (tA === tB) { return a < b ? low : high; }
        return tA < tB;
    };
    sort2 = function (o, p) {
        return sort1(o[index], p[index]);
    };

    arrayIn.sort(isArray2 ? sort2 : sort1);
};
COMMON.cloneDataArray = function () {
    ///<summary>Creates a duplicate array of the dataResultsObject. Assumes the call query was done prior to calling this script</summary>
    ///<returns type="Array">Array of Arrays</returns>
    "use strict";
    var dataOut, i;
    if (!AJAXPOST.dataResults) { return null; }
    dataOut = [];
    for (i = 0; i < AJAXPOST.dataResults.length; i++) {
        dataOut.push(AJAXPOST.dataResults[i].slice());
    }
    return dataOut;
};
COMMON.objectIsEmpty = function (objIn) {
    ///<summary>checks if object literal is empty</summary>
    ///<param name="objIn" type="literalObject">The object to check</param>
    ///<returns type="Boolean">True if empty</returns>
    "use strict";
    var oneProp;
    if (objIn === undefined || objIn === null || typeof objIn !== "object" || (objIn.length && objIn.length === 0)) { return true; }
    if (objIn.length && objIn.length > 0) { return false; }
    for (oneProp in objIn) {
        if (objIn.hasOwnProperty(oneProp)) {
            return false;
        }
    }
    return true;
};
COMMON.addAttribute = function (obj, propertyToAdd, value, isElement) {
    ///<summary>adds a property to an object literal or adds the value to the existing value if the property already exists</summary>
    ///<param name="obj" type="Object">Either an HTML element to which to add attributes or a literal object with the name value pair pattern {name:value,...}</param>
    ///<param name="propertyToAdd" type="String|Object">Either a string with the name of the property or a literal object with properties to add</param>
    ///<param name="value" type="String">(Optional) Ignored if propertyToAdd is not a String.  The value of the property</param>
    ///<param name="isElement" type="Boolean">If True then obj is an element not an Object Literal</param>
    "use strict";
    var oneProp, lAttr;
    lAttr = propertyToAdd;
    if (typeof propertyToAdd === "string") {
        lAttr = {};
        lAttr[propertyToAdd] = value;
    }
    for (oneProp in lAttr) {
        if (lAttr.hasOwnProperty(oneProp)) {
            if (isElement) {
                if (obj.hasAttribute(oneProp)) { lAttr[oneProp] = obj.getAttribute(oneProp) + lAttr[oneProp]; }
                obj.setAttribute(oneProp, lAttr[oneProp]);
            } else {
                obj[oneProp] = (obj.hasOwnProperty(oneProp) ? obj[oneProp] : "") + lAttr[oneProp];
            }
        }
    }
};
COMMON.addOption = function (dDLObj, text, value) {
    ///<summary>add option elements to a DDL</summary>
    ///<param name="dDlObj" type="element">The select element</param>
    ///<param name="text" type="String">The text property of the option being added</param>
    ///<param name="value" type="String">The value property of the option being added</param>
    "use strict";
    var optionObj;
    optionObj = COMMON.docObj.createElement("option");
    optionObj.text = text;
    if (value !== undefined && value !== null) { optionObj.value = value; } else { optionObj.value = text; }
    try {
        //for IE < 8
        dDLObj.add(optionObj, dDLObj.options[null]);
    } catch (e) {
        dDLObj.add(optionObj, null);
    }
};
COMMON.dateToString = function (dtDate) {
    ///<summary>Converts a date object to a string representing M/d/yyyy</summary>
    ///<param name="dtDate" type="Date">Date Object</param> 
    ///<returns type="String"></returns>
    "use strict";
    if (dtDate === undefined || dtDate === null) { dtDate = new Date(); }
    if (typeof dtDate === "number") { dtDate = new Date(dtDate); }
    return String(dtDate.getMonth() + 1) + "/" + String(dtDate.getDate()) + "/" + String(dtDate.getFullYear());
};
COMMON.dateDiff = function (interval, startDate, endDate) {
    "use strict";
    ///<summary>Gives the difference between two dates in Months, Days or Years</summary>
    ///<param name="interval" type="String">The time interval, accepts: Y, Year, M, Month, D, Day</params>
    ///<param name="startDate" type="Date">The Start Date</param>
    ///<param name="enddate" type="Date">The End Date</param>
    ///<returns type="Number">The difference</returns>
    var remainderMonths, utcStart, utcEnd, millisecondInADay;
    if (interval.toUpperCase() === "Y" || interval.toUpperCase() === "YEAR") {
        return (endDate.getFullYear() - startDate.getFullYear());
    }
    if (interval.toUpperCase() === "M" || interval.toUpperCase() === "MONTH") {
        remainderMonths = 12 - startDate.getMonth() + endDate.getMonth();
        return ((endDate.getFullYear() - (startDate.getFullYear() + 1))) * 12 + remainderMonths;
    }
    if (interval.toUpperCase() === "D" || interval.toUpperCase() === "Day") {
        millisecondInADay = 1000 * 60 * 60 * 24;
        utcStart = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        utcEnd = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        return Math.floor((utcEnd - utcStart) / millisecondInADay);
    }
};
COMMON.formatCurrency = function (numberIn, currencySymbol, precision, useParens) {
    ///<summary>formats numbers into currency with commas</summary>
    ///<param name="numberIn" type="Number">The number to convert</param>
    ///<param name="currencySymbol" type="String">(Optional) Adds this symbol to the begining of the Number if present</param>
    ///<param name="precision" type="Number">(Optional) The number of digits to the right of the decimal. Defaults to 4</param>
    ///<param name="useParens" type="Boolean">(Optional) If true will add parenthesis around negative numbers</param>
    ///<returns type="String" />
    "use strict";
    var wholeNumPart, decimalPart, parts, parensBegin, parensEnd;
    if (precision === undefined || precision === null || isNaN(precision)) { precision = 4; }
    parensBegin = (parseFloat(numberIn) < 0 && useParens === true ? "(" : "");
    parensEnd = (parensBegin === "(" ? ")" : "");
    parts = String(numberIn).split(".");
    wholeNumPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (useParens) { wholeNumPart = wholeNumPart.replace(/-/g, ""); }
    decimalPart = (parts.length > 1 ? parts[1] : "00");
    if (precision === 0) {
        decimalPart = "";
    } else {
        decimalPart = decimalPart.padRight("0", precision);
    }
    if (currencySymbol === undefined || currencySymbol === null) { currencySymbol = ""; }
    return parensBegin + currencySymbol + wholeNumPart + "." + decimalPart + parensEnd;
};
COMMON.unformatNumber = function (val) {
    ///<summary>if the value in is a number removes comma and parens if present. Replaces parens with (-)
    ///<param name="val" type="String|Number">The value to process</param>
    ///<returns type="String">Returns the number as a string<returns>
    "use strict";
    var tmp;
    tmp = String(val).replace(/\,/g, "");
    if (tmp.length > 1 && (tmp.substring(0, 1) === "$" || tmp.substring(1, 1) === "$")) { tmp = tmp.replace("$", ""); }//replaces only one $
    if (!isNaN(tmp)) {
        return tmp;
    }
    if (tmp.indexOf("(") === 0 && tmp.indexOf(")") === (tmp.length - 1) && !isNaN(tmp.replace(/\(/g, "").replace(/\)/g, "")) && tmp.indexOf("-") < 0) {
        return "-" + tmp.replace(/\(/g, "").replace(/\)/g, "");
    }
    return String(val);
};
COMMON.readFlag = function (flagIn, flagIndex) {
    ///<summary>Reads the value of a binary flag within a number</summary>
    ///<param name="flagIn" type="Number">The number containing all the flags</param>
    ///<param name="flagIndex" type="Number">The binary index of the flag whose value you want</param>
    ///<returns type="Boolean" />
    "use strict";
    if (flagIn === undefined || flagIn === null) { flagIn = 0; }
    return (Math.floor(flagIn / Math.pow(2, flagIndex)) % 2) === 1;
};
COMMON.setFlag = function (flagIn, flagIndex, newValue) {
    ///<summary>Use to toggle or set the binary flag value within an integer for decision trees</summary>
    ///<param name="flagIn" type="Number">The existing flag number</param>
    ///<param name="flagIndex" type="Number">The binary index to toggle</param>
    ///<params name="newValue" type="Boolean">(Optional) if omitted, then the value will be toggled</param>
    ///<returns type="number">The new flag value</returns>
    "use strict";
    var oldValue, flagValue;
    if (flagIn === undefined || flagIn === null) { flagIn = 0; }
    oldValue = COMMON.readFlag(flagIn, flagIndex);
    if (newValue !== undefined && newValue !== null && newValue === oldValue) { return flagIn; }//exit if the value is already set as intended
    flagValue = Math.pow(2, flagIndex);
    return flagIn + (flagValue * (oldValue ? -1 : 1));
};
//***************************************Utility Items: items that manipulate or fix items*************************************************************//
//***************************************Form Utilities: items that support display**********************************************************************//
COMMON.errMess = function (strIn, isolatedSpanId) {
    ///<summary>display messages including error messages.</summary>
    ///<param name="strIn" type="String">the message to display<param>
    ///<param name="isolatedSpanId" type="String">(optional), uses COMMON.defaultMessSpanId if not specified) the span where the message will be displayed. The span will become a child of the COMMON.pageMessageDivId div so that other messages can be displayed and clearing this message will no interfere with other messages</param>
    "use strict";
    var pnMess, isolatedSpanObj;
    if (strIn === "") { strIn = "&nbsp;"; }
    if (!COMMON.pageMessageDivId) { return; }
    pnMess = COMMON.docObj.getElementById(COMMON.pageMessageDivId);
    if (!pnMess) { return; }
    if (!isolatedSpanId) { isolatedSpanId = COMMON.defaultMessSpanId; }
    pnMess.innerHTML += "&nbsp;";
    isolatedSpanObj = COMMON.docObj.getElementById(isolatedSpanId);
    if (!isolatedSpanObj) {
        isolatedSpanObj = COMMON.docObj.createElement("span");
        isolatedSpanObj.id = isolatedSpanId;
        pnMess.appendChild(isolatedSpanObj);
    }
    isolatedSpanObj = COMMON.docObj.getElementById(isolatedSpanId);
    isolatedSpanObj.innerHTML = strIn;
};
COMMON.focusme = function (objId) {
    "use strict";
    ///<summary>focus on the designated control with the id of objId parameter</summary>
    ///<param name="objId" type="String">The id of the element that focus will be sent to</param>
    var obj;
    obj = COMMON.docObj.getElementById(objId);
    obj.setAttribute("autofocus");
    if (COMMON.docObj.createElement("input").hasOwnProperty("autofocus")) {
        obj.focus();
    }
    if (obj.select) { obj.select(); }
    return;
};
COMMON.clearParent = function (parentId) {
    ///<summary>Removes child nodes from a parent node</summary>
    ///<param name="parentId" type="String">The id of the parent node</param>
    "use strict";
    var obj;
    obj = COMMON.docObj.getElementById(parentId);
    while (obj.firstChild) {
        obj.removeChild(obj.firstChild);
    }
};
COMMON.zChangeElementAvailability = function (parentObj, tagName, enable) {
    ///<summary>NOT FOR EXTERNAL USE --- enables or disables elements in a containder</summary>
    ///<param name="parentObj" type="Element">The Parent Object container</param>
    ///<param name="tagName" type="String">The name of the html tag that is to be disabled</param>
    ///<param name="enable" type="Boolean">Whether to enable or disable the tags</param>
    "use strict";
    var i, allElems, previouslyDisabledAttr, disabledByFunctionAttr, currentlyEnabled, hasPDA, hasDFA;
    previouslyDisabledAttr = "wasdisabled";
    disabledByFunctionAttr = "disabledthis";
    allElems = parentObj.getElementsByTagName(tagName);
    if (allElems.length > 0) {
        for (i = 0; i < allElems.length; i++) {
            currentlyEnabled = !allElems[i].disabled;
            //PDA flag means that the element had been disable previously outside of this function
            hasPDA = allElems[i].hasAttribute(previouslyDisabledAttr);
            //DFA flag means that the element has been disabled by this function
            hasDFA = allElems[i].hasAttribute(disabledByFunctionAttr);
            if (enable) {
                //here to enable all elements
                if (hasDFA && !currentlyEnabled) {
                    //only enable elements that have the DFA flag
                    allElems[i].disabled = false;
                }
                //remove all flags if present
                allElems[i].removeAttribute(previouslyDisabledAttr);
                allElems[i].removeAttribute(disabledByFunctionAttr);
            } else {
                //here to disable all elements
                if (!currentlyEnabled && !hasPDA && !hasDFA) {
                    //on elements that were previously disabled and have no flags, set the PDA flag so that they will remain disabled
                    allElems[i].setAttribute(previouslyDisabledAttr, previouslyDisabledAttr);
                }
                if (currentlyEnabled && !hasDFA && !hasPDA) {
                    //on enabled elements, flag with DFA so that they will be renabled later
                    allElems[i].setAttribute(disabledByFunctionAttr, disabledByFunctionAttr);
                    allElems[i].disabled = true;
                }
            }
        }
    }
};
COMMON.blockInput = function (containerId, restoreFunction, waitGifURL, containerCoverId, zindex) {
    ///<summary>Covers and disables or Uncovers and enables field elements in a container designated by containerId. Can also display a Wait/Loading GIF while covered</summary>
    ///<param name="containerId" type="String">The parent container id that has the controls to cover/uncover</param>
    ///<param name="restoreFunction" type="Boolean">If true, uncovers and enables all elements in the container</param>
    ///<param name="waitGifURL" type="String">(Optional)Ignored if restoreFunction is True. The url of the GIF or other image to display when the container is covered</param>
    ///<param name="containerCoverId" type="String">(Optional) if provided this is the id of the div used to cover the container. Provide the same name when uncovering. If not provided, will prefix the container id with 'div' and suffix with 'hide'</param>
    ///<param name="zindex" type="String">(Optional) Ignored of restoreFunction=true. Overrides the default zindex of the coverall div</param>
    "use strict";
    var parentObj, obj1, obj2, oLeft, oTop, attr;
    if (containerId === "body") {
        parentObj = COMMON.docObj.getElementsByTagName("body")[0];
    } else {
        parentObj = COMMON.docObj.getElementById(containerId);
    }
    if (containerCoverId === undefined || containerCoverId === null) { containerCoverId = "div" + containerId + "hide"; }
    COMMON.zChangeElementAvailability(parentObj, "input", restoreFunction);
    COMMON.zChangeElementAvailability(parentObj, "select", restoreFunction);
    COMMON.zChangeElementAvailability(parentObj, "textarea", restoreFunction);
    if (!restoreFunction) {
        oTop = parentObj.offsetTop;
        oLeft = parentObj.offsetLeft;
        if (parentObj.style.position && parentObj.style.position === "absolute") {
            oTop = 0;
            oLeft = 0;
        }
        if (zindex === undefined || zindex === null) { zindex = "98"; }
        if (zindex !== "") { zindex = "z-index:" + zindex + ";"; }
        attr = { "style": "position:fixed;background-color:#FEFEFE;opacity:.8;" + zindex };
        obj1 = COMMON.getBasicElement("div", containerCoverId, null, null, null, attr);
        obj1.style.top = String(oTop) + "px";
        obj1.style.left = String(oLeft) + "px";
        obj1.style.width = String(parentObj.offsetWidth) + "px";
        obj1.style.height = String(parentObj.scrollHeight) + "px";
        if (waitGifURL !== undefined && waitGifURL !== null) {
            obj2 = COMMON.getImageElement(null, waitGifURL, "Please Wait");
            obj2.style.position = "absolute";
            obj2.style.top = String(10) + "px";
            obj2.style.left = String(oLeft + 10) + "px";
            obj1.appendChild(obj2);
        }
        parentObj.appendChild(obj1);

    } else {
        if (COMMON.docObj.getElementById(containerCoverId)) {
            parentObj.removeChild(COMMON.docObj.getElementById(containerCoverId));
        }
    }
};
//***************************************Form Utilities: items that support display**********************************************************************//
//***************************************Event Utilities: Items that support common events*************************************************************//
COMMON.vbPostBack = function (postbackObjId, formName) {
    ///<summary>initiates the post back (submit action) of the form and places the sender id in the text box set by COMMON.postBackObjId</summary>
    ///<param name="postbackObjId" type="String">the id of the button or control that initiates the post back.  This is how the server is award what button or control the user activated and caused the post back event</param>
    ///<param name="formName" type="String">(Optional) uses COMMON.defaultFormName if not designated in the parameter. the name of the form that will be posted to the server
    "use strict";
    var theform;
    if (!formName) { formName = COMMON.defaultFormName; }
    if (window.navigator.appName.toLowerCase().indexOf("microsoft") > -1) {
        theform = COMMON.docObj.getElementById(formName);
    } else {
        theform = COMMON.docObj.forms[formName];
    }
    COMMON.docObj.getElementById(COMMON.postBackObjId).value = postbackObjId;
    theform.submit();
};
COMMON.getTargetObj = function (e) {
    ///<summary>Gets the object that triggered the event</summary>
    ///<param name="e" type="EventObject">The object representing the event</param>
    ///<returns type="Element"></returns>
    "use strict";
    if (e.srcElement) { return e.srcElement; }
    if (e.target) { return e.target; }
    return null;
};
COMMON.getKeyPressed = function (e) {
    ///<summary>.Gets the key code of the key clicked while the element has focus</summary>
    ///<param name="e" type="EventObject">The object representing the Event</param>
    ///<returns type="Number">The keyboard code (Similar to ASCII) of the key pressed </returns>
    "use strict";
    if (e.srcElement) { return e.keyCode; }
    if (e.target) { return e.which; }
    return null;
};
COMMON.setDefaultButtons = function (btnId, cancelId, mainObj) {
    ///<summary>Sets the default action button (enter is pressed) or cancel button (esc is pressed) on a page</summary>
    ///<param name="btnId" type="String">The Id of the default button</param>
    ///<param name="cancelId" type="String">The Id of the default escape button</param>
    ///<param name="mainObj" type="Object">The main javascript object</param>
    "use strict";
    mainObj.defaultButton = btnId;
    mainObj.defaultCancelButton = cancelId;
};
//***************************************Event Utilities: Items that support common events*************************************************************//
//****************************************Search String************************************************************************//
COMMON.getSearchString = function () {
    ///<summary>Returns the search string component of the uri in key, value pairs in a generic object</summary>
    ///<returns type="Object" />
    "use strict";
    var objOut, ss, i, onePair;
    ss = window.location.search;
    if (ss === "") { return null; }
    ss = ss.substring(1);
    ss = ss.split("&");
    objOut = {};
    for (i = 0; i < ss.length; i++) {
        onePair = ss[i].split("=");
        objOut[decodeURIComponent(onePair[0])] = decodeURIComponent(onePair[1]);
    }
    return objOut;
};
//****************************************Search String************************************************************************//
//***************************************Cookie manipulation*****************************************************************************************//
COMMON.writeCookie = function (cookieName, JSONObj, isPermanent) {
    ///<summary>used to write a cookie</summary>
    ///<param name="cookieName" type="String">name of the cookie</param>
    ///<param name="JSONObj" type="Object">a generic object containing the data to write to the cookie</param>
    ///<param name="isPermanent" type="Boolean">if true set the expiration date to one year, otherwise, write a session cookie</param>
    "use strict";
    var cookieText, cookieExpires, cookieExpiresText, maxAgeText, secondsToExpire;
    cookieExpiresText = "";
    maxAgeText = "";
    if (isPermanent) {
        secondsToExpire = 60 * 60 * 24 * 365; //this is 60 seconds * 60 minutes * 24 hours * 365 days
        cookieExpires = new Date();
        cookieExpires.setTime(cookieExpires.getTime() + (secondsToExpire * 1000));
        cookieExpires = cookieExpires.toGMTString();
        cookieExpiresText = ";expires=" + cookieExpires;
        maxAgeText = ";max-age=" + String(secondsToExpire);
    }
    cookieText = "";
    cookieText = JSON.stringify(JSONObj);
    COMMON.docObj.cookie = cookieName + "=" + encodeURIComponent(cookieText) + cookieExpiresText + maxAgeText;
};
COMMON.readCookie = function (cookieName, getRawVal) {
    ///<summary>reads a cookie with the name designated in cookieName</summary>
    ///<param name="cookieName" type="String">The Name of the cookie to read</param>
    ///<param name="getRawVal" type="Boolean">If true will return the value of the cookie for non-JSON data</param>
    ///<returns type="Object">a Generic Object (JSON)</returns>
    "use strict";
    var JSONobj, allCookies, i, thisPair, cookieText;
    JSONobj = null;
    cookieText = "";
    if (COMMON.docObj.cookie) {
        allCookies = COMMON.docObj.cookie.split(";");
        for (i = 0; i < allCookies.length; i++) {
            if (allCookies[i].indexOf("=") >= 0) {
                thisPair = allCookies[i].split("=");
                while (thisPair[0].charAt(0) === " ") { thisPair[0] = thisPair[0].substring(1, thisPair[0].length); }
                if (thisPair[0] === cookieName) {
                    cookieText = (thisPair.length > 1 ? thisPair[1] : "");
                }
            }
        }
        if (cookieText !== "") {
            if (getRawVal) { return cookieText; }
            cookieText = decodeURIComponent(cookieText);
            JSONobj = JSON.parse(cookieText);
        }
    }
    return JSONobj;
};
COMMON.deleteCookie = function (cookieName) {
    ///<summary>Deletes a cookie by setting expiration to a past date
    ///<param name="cookieName" type="String>The name of the cookie to delete</param>
    "use strict";
    COMMON.docObj.cookie = cookieName + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT path=/";
};
//***************************************Cookie manipulation*****************************************************************************************//
//*********************************Element creation, validation and value retrieval*****************************************************************//
COMMON.zKillSubmit = function (e) {
    ///<summary>NOT FOR EXTERNAL USE on textarea controls, stops enter from causing submit buttons to be activated</summary>
    ///<param name="e" type="event object">The event object</param>
    ///<returns type="boolean">returns false on keypress</returns>
    "use strict";
    var key;
    if (window.event) {
        key = window.event.keyCode;
    } else {
        key = e.which;
    }
    if (key === 13 && e.target.type !== "textarea") { return false; }
};
//Get element
COMMON.getElement = function (txtIdOrObject) {
    ///<summary>allows functions to run whether the id or the object itself is passed to the function</summary>
    ///<param name="txtIdOrObject" type="String|Element">The id or the element object to retrieve</param>
    ///<returns type="Element"></returns>
    "use strict";
    if (typeof txtIdOrObject === "string") {
        return COMMON.docObj.getElementById(txtIdOrObject);
    }
    return txtIdOrObject;
};
//set value of field type elements
COMMON.setDDLvalue = function (ddlIdOrObj, ddlValue) {
    ///<summary>Sets the value of a Select Object</summary>
    ///<param name="ddlIdOrObj" type="String|Element">The element or id of an element whose value will be set</param>
    ///<param name="ddlValue" type="String">The value of the option to be set</param>
    "use strict";
    var ddlObj, i;
    ddlObj = COMMON.getElement(ddlIdOrObj);
    if (ddlObj.options.length > 0) {
        for (i = 0; i < ddlObj.options.length; i++) {
            if (ddlObj.options[i].value === String(ddlValue)) {
                ddlObj.selectedIndex = i;
                return;
            }
        }
    }
};
COMMON.setTxtValue = function (txtIdOrObj, txtValue) {
    ///<summary>Sets the value of a input Object</summary>
    ///<param name="txtIdOrObj" type="String|Element">The element or id of an element whose value will be set</param>
    ///<param name="txtValue" type="String">The value to set</param>
    "use strict";
    COMMON.getElement(txtIdOrObj).value = txtValue;
};
COMMON.setChkValue = function (chkIdOrObj, chkValue) {
    ///<summary>Sets the value of a input Object of type checkbox</summary>
    ///<param name="chkIdOrObj" type="String|Element">The element or id of an element whose value will be set</param>
    ///<param name="chkValue" type="String|Boolean|Number">1, String true or boolean true will check the checkbox</param>
    "use strict";
    var bolCheckValue;
    if (typeof chkValue === "string" || typeof chkValue === "number") {
        bolCheckValue = (String(chkValue) === "1" || String(chkValue).toUpperCase() === "TRUE");
    } else {
        bolCheckValue = chkValue;
    }
    COMMON.getElement(chkIdOrObj).checked = bolCheckValue;
};
COMMON.setElemValue = function (elemIdOrObj, elemValueOrObject) {
    ///<summary>Sets the innerHTML of an element</summary>
    ///<param name="elemIdOrObj" type="String|Element">The element or id of an element whose value will be set</param>
    ///<param name="elemValueOrObject" type="String|Element">The value or Element Object to add inside this element</param>
    "use strict";
    if (typeof elemValueOrObject === "string" || typeof elemValueOrObject === "number") {
        COMMON.getElement(elemIdOrObj).innerHTML = elemValueOrObject;
    } else {
        COMMON.getElement(elemIdOrObj).appendChild(elemValueOrObject);
    }
};
COMMON.setTimePickerValue = function (idOrObj, newValue) {
    ///<summary>Sets the value of an existing Time Picker Control</summary>
    ///<param name="idOrObj" type="String|Element">The element or id of an element whose value will be set</param>
    ///<param name="newValue" type="String">Set the value of a time picker control in the forma HH:MM (24Hour)</param>
    "use strict";
    var obj;
    obj = COMMON.getElement(idOrObj);
    TIMEPICKER.setValue(obj.id, newValue);
};
//Retrieve values
COMMON.getDDLValue = function (ddlIdOrObj, getText) {
    ///<summary>Gets the value or text of the option selected in a Select element</summary>
    ///<param name="ddlIdOrObj" type="String|Element">The element or id of an element</param>
    ///<param name="getText" type="Boolean">(Optional) True will return the text property of the selected option otherwise, thise will return the value property</param>
    ///<returns type="String"></returns>
    "use strict";
    var obj, valOut;
    obj = COMMON.getElement(ddlIdOrObj);
    valOut = (getText ? obj.options[obj.selectedIndex].text : obj.options[obj.selectedIndex].value);
    if (!valOut) { valOut = ""; }
    if (valOut === "-1") { valOut = ""; }
    return valOut;
};
COMMON.getDDLText = function (ddlIdOrObj) {
    ///<summary>Gets the text of the option selected in a Select element</summary>
    ///<param name="ddlIdOrObj" type="String|Element">The element or id of an element</param>
    ///<returns type="String"></returns>
    "use strict";
    return COMMON.getDDLValue(ddlIdOrObj, true);
};
COMMON.getTextValue = function (txtIdOrObj) {
    ///<summary>Gets the value property of an input element</summary>
    ///<param name="txtIdOrObj" type="String|Element">The element or id of an element</param>
    ///<returns type="String"></returns>
    "use strict";
    return COMMON.getElement(txtIdOrObj).value;
};
COMMON.getFileValue = function (dfuIdOrObj) {
    ///<summary>Gets the value property and first file of a File Input element</summary>
    ///<param name="dfuIdOrObj" type="String|Element">The element or id of an element</param>
    "use strict";
    var objOut, obj;
    obj = COMMON.getElement(dfuIdOrObj);
    objOut = {};
    objOut.value = obj.value;
    if (obj.files) {
        //HTML5
        objOut.file = obj.files[0];
    } else {
        objOut.file = null;
    }
    return objOut;
};
COMMON.getChkValue = function (chkIdOrObj) {
    ///<summary>Gets whether a text box is checked or not</summary>
    ///<param name="chkIdOrObj" type="String|Element">The element or id of an element</param>
    ///<returns type="String">"1" if checked, otherwise "0"</returns>
    "use strict";
    return (COMMON.getElement(chkIdOrObj).checked ? "1" : "0");
};
COMMON.getTimePickerValue = function (idOrObj) {
    ///<summary>Gets the value of a timepicker control</summary>
    ///<param name="idOrObj" type="String|Element">The element id or the element</param>
    ///<returns type="String">>The selected time in the format H:MM 24Hour</returns>
    "use strict";
    var obj;
    obj = COMMON.getElement(idOrObj);
    return TIMEPICKER.getValue(obj.id);
};
//this enum for the different dynamically created elements and properties
//Properties:
// id - this will be the prefix of the id of any dynamically created elements, should match the name of the object
// tag - the tag of the element
// type - the type attribute of input elements
// index - numerical enum (May not be needed)
// isField - denotes that this type is a user input type field (may not be needed)
// setValueFunction - function used to set the value of this element (innerHTML, checked etc...)
// getValueFunction - function used to get the value of this element if it is a user field type (may be expanded to include non-user field elements later)
// canHaveMaxLen - used to not add MaxLenght functionality to elements on which it would not make sense
COMMON.fieldTypes = {
    txt: { id: "txt", name: "Text Box", tag: "input", type: "text", index: 1, isField: true, setValueFunction: COMMON.setTxtValue, getValueFunction: COMMON.getTextValue, canHaveMaxLen: true },
    ddl: { id: "ddl", name: "Dropdown List", tag: "select", type: "", index: 2, isField: true, setValueFunction: COMMON.setDDLvalue, getValueFunction: COMMON.getDDLValue, canHaveMaxLen: false },
    txa: { id: "txa", name: "Multi-Line Text Box", tag: "textarea", type: "", index: 3, isField: true, setValueFunction: COMMON.setTxtValue, getValueFunction: COMMON.getTextValue, canHaveMaxLen: true },
    dfu: { id: "dfu", name: "File Upload", tag: "input", type: "file", index: 4, isField: true, setValueFunction: COMMON.setTxtValue, getValueFunction: COMMON.getFileValue, canHaveMaxLen: false },
    chk: { id: "chk", name: "Check box", tag: "input", type: "checkbox", index: 5, isField: true, setValueFunction: COMMON.setChkValue, getValueFunction: COMMON.getChkValue, canHaveMaxLen: false },
    rad: { id: "rad", name: "Radio Button", tag: "input", type: "radio", index: 6, isField: true, setValueFunction: COMMON.setChkValue, getValueFunction: COMMON.getChkValue, canHaveMaxLen: false },
    lbl: { id: "lbl", name: "Label", tag: "span", type: "", index: 7, isField: false, setValueFunction: COMMON.setElemValue, getValueFunction: null, canHaveMaxLen: false },
    div: { id: "div", name: "Div", tag: "div", type: "", index: 8, isField: false, setValueFunction: COMMON.setElemValue, getValueFunction: null, canHaveMaxLen: false },
    btn: { id: "btn", name: "Button", tag: "input", type: "submit", index: 9, isField: false, setValueFunction: COMMON.setTxtValue, getValueFunction: null, canHaveMaxLen: false },
    pas: { id: "pas", name: "Password", tag: "input", type: "password", index: 10, isField: true, setValueFunction: COMMON.setTxtValue, getValueFunction: COMMON.getTextValue, canHaveMaxLen: true },
    lnk: { id: "lnk", name: "Link", tag: "a", type: "", index: 11, isField: false, setValueFunction: COMMON.setElemValue, getValueFunction: null, canHaveMaxLen: false },
    spa: { id: "spa", name: "Span", tag: "span", type: "", index: 12, isField: false, setValueFunction: COMMON.setElemValue, getValueFunction: null, canHaveMaxLen: false },
    cal: { id: "cal", name: "Calendar", tag: "", type: "", index: 13, isField: true, setValueFunction: COMMON.setTxtValue, getValueFunction: COMMON.getTextValue, canHaveMaxLen: false },
    ttr: { id: "ttr", name: "Table Row", tag: "tr", type: "", index: 14, isField: false, setValueFunction: COMMON.setElemValue, getValueFunction: null, canHaveMaxLen: false },
    ttd: { id: "ttd", name: "Table Cell", tag: "td", type: "", index: 15, isField: false, setValueFunction: COMMON.setElemValue, getValueFunction: null, canHaveMaxLen: false },
    img: { id: "img", name: "Image", tag: "img", type: "", index: 16, isField: false, setValueFunction: COMMON.setElemValue, getValueFunction: null, canHaveMaxLen: false },
    hh1: { id: "hh1", name: "h1", tag: "h1", type: "", index: 17, isField: false, setValueFunction: COMMON.setElemValue, getValueFunction: null, canHaveMaxLen: false },
    hh2: { id: "hh2", name: "h2", tag: "h2", type: "", index: 18, isField: false, setValueFunction: COMMON.setElemValue, getValueFunction: null, canHaveMaxLen: false },
    hh3: { id: "hh3", name: "h3", tag: "h3", type: "", index: 19, isField: false, setValueFunction: COMMON.setElemValue, getValueFunction: null, canHaveMaxLen: false },
    hh4: { id: "hh4", name: "h4", tag: "h4", type: "", index: 20, isField: false, setValueFunction: COMMON.setElemValue, getValueFunction: null, canHaveMaxLen: false },
    hh5: { id: "hh5", name: "h5", tag: "h5", type: "", index: 21, isField: false, setValueFunction: COMMON.setElemValue, getValueFunction: null, canHaveMaxLen: false },
    hh6: { id: "hh6", name: "h6", tag: "h6", type: "", index: 22, isField: false, setValueFunction: COMMON.setElemValue, getValueFunction: null, canHaveMaxLen: false },
    ppp: { id: "ppp", name: "Paragraph", tag: "p", type: "", index: 23, isField: false, setValueFunction: COMMON.setElemValue, getValueFunction: null, canHaveMaxLen: false },
    eml: { id: "eml", name: "Email Text Box", tag: "input", type: "email", index: 24, isField: true, setValueFunction: COMMON.setTxtValue, getValueFunction: COMMON.getTextValue, canHaveMaxLen: true },
    url: { id: "url", name: "URL Text Box", tag: "input", type: "url", index: 25, isField: true, setValueFunction: COMMON.setTxtValue, getValueFunction: COMMON.getTextValue, canHaveMaxLen: true },
    num: { id: "num", name: "Number Selector", tag: "input", type: "number", index: 26, isField: true, setValueFunction: COMMON.setTxtValue, getValueFunction: COMMON.getTextValue, canHaveMaxLen: false },
    tpk: { id: "tpk", name: "Time Picker", tag: "", type: "", index: 27, isField: true, setValueFunction: COMMON.setTimePickerValue, getValueFunction: COMMON.getTimePickerValue, canHaveMaxLen: false }
};
//validation
COMMON.checkNumeric = function (fieldType, id, regex, checkMoney) {
    "use strict";
    ///<summary>compares the value of a field to a regex and checks for proper formatting if checkMoney is true</summary>
    ///<param name="fieldtype" type="String">the COMMON.fieldtype key</param>
    ///<param name="id" type="String">The id of the control</param>
    ///<param name="regex" type="RegularExpression">regular expression to match. the value of the control will be compared to the regex and if the filtered string matches then there is no error</param>
    ///<param name="checkMoney" type="Boolean">(Optional)checks the precision of numbers entered so that they are between 2 and 4 decimal places</param>
    ///<returns type="Boolean">True if there is an error</returns>
    //master function compares the input to a regex and will check for decimal places on money type
    var thisFieldType, val, result;
    thisFieldType = COMMON.fieldTypes[fieldType];
    val = thisFieldType.getValueFunction(id);
    result = !(COMMON.isNumber(val, regex, checkMoney));
    if (result && checkMoney) {
        thisFieldType.setValueFunction(id, COMMON.formatCurrency(val));
    }
};
COMMON.isNumber = function (val, regex, checkMoney, noLeadingZero) {
    ///<summary>Checks whether a val is a number</summary>
    ///<param name="val" type="String">The value to check</param>
    ///<param name="regex" type"Regex">(Optional) The regex used to compare the value to.  If missing defaults to /[1234567890.$-]/g</param>
    ///<param name="checkMoney" type="Boolean">(Optional) If true will check that the value does not have more than 4 decimal places</param>
    ///<param name="noLeadingZero" type="Boolean">(Optional) If true will check that the value does not have leading zero</param>
    ///<returns type="Boolean">True if it is a number</returns>
    "use strict";
    var strVal, match, decPart;
    if (regex === undefined || regex === null) { regex = /^[\-+]?[0123456789.$]+$/; }
    if (val === undefined || val === null || val === "") { return false; }
    if (noLeadingZero && String(val).substring(0, 1) === "0") { return false; }
    match = val.match(regex);
    if (match === null) { return false; }
    if (checkMoney) {
        val = val.replace(",", "");
        strVal = String(val).split(".");
        decPart = (strVal.length > 1 ? strVal[1] : "");
        if (strVal.length === 1 || strVal[1].length < 4) {
            decPart = decPart.padRight("0", 4);
        }
        return (decPart.length <= 4 && match);
    }
    return match;
};
COMMON.checkInteger = function (fieldType, id) {
    ///<summary>checks that input value is intergers only</summary>
    ///<param name="fieldtype" type="String">the COMMON.fieldtype key</param>
    ///<param name="id" type="String">The id of the control</param>
    ///<returns type="Boolean">True if there is an error</returns>
    "use strict";
    return COMMON.checkNumeric(fieldType, id, /^[\-+]?[0123456789]+$/, false);
};
COMMON.checkDecimal = function (fieldType, id) {
    ///<summary>checks that input value is integers and decimal point only</summary>
    ///<param name="fieldtype" type="String">the COMMON.fieldtype key</param>
    ///<param name="id" type="String">The id of the control</param>
    ///<returns type="Boolean">True if there is an error</returns>
    "use strict";
    return COMMON.checkNumeric(fieldType, id, /^[\-+]?[0123456789.]+$/, false);
};
COMMON.checkMoney = function (fieldType, id) {
    ///<summary>Checks that input value is integers, decimal point and up to 4 decimal places</summary>
    ///<param name="fieldtype" type="String">the COMMON.fieldtype key</param>
    ///<param name="id" type="String">The id of the control</param>
    ///<returns type="Boolean">True if there is an error</returns>
    "use strict";
    return COMMON.checkNumeric(fieldType, id, /^[\-+]?[0123456789.$]+$/, true);
};
COMMON.checkLenghtMax = function (fieldType, id) {
    ///<summary>Checks that input lenght is less than or equal to the value of the maxlen attribute</summary>
    ///<param name="fieldtype" type="String">the COMMON.fieldtype key</param>
    ///<param name="id" type="String">The id of the control</param>
    ///<returns type="Boolean">True if there is an error</returns>
    "use strict";
    var thisFieldType, val, obj, thisAttributeValue;
    thisFieldType = COMMON.fieldTypes[fieldType];
    val = thisFieldType.getValueFunction(id);
    if (val === "") { return false; }//this will not check that it has a value.  Use the "required" attribute to check for blanks
    obj = COMMON.getElement(id);
    thisAttributeValue = obj.getAttribute(COMMON.validationTypes.maxLength.attribute) || String(val.length);
    return (val.length > parseInt(thisAttributeValue, 10));
};
COMMON.checkRequired = function (fieldType, id) {
    ///<summary>checks that input value exists or in the case of selects that a value other than -1 is selected</summary>
    ///<param name="fieldtype" type="String">the COMMON.fieldtype key</param>
    ///<param name="id" type="String">The id of the control</param>
    ///<returns type="Boolean">True if there is an error</returns>
    "use strict";
    var thisFieldType, val;
    thisFieldType = COMMON.fieldTypes[fieldType];
    val = thisFieldType.getValueFunction(id);
    return (val === "");
};
//validationTypes Enum used for setting attributes on dynamically created elements
// Properties:
//  attribute - the attribute name
//  value - the attribute value
//  checkFunction - the function used to validate this element if it is of this validationType
//  errorMessage - if the check fails, this message will be the tool tip
//  strCheckFunction - the name of the check function
COMMON.validationTypes = {
    none: { attribute: "numeric", value: "none", checkFunction: function () { "use strict"; return false; }, errorMessage: "", strCheckFunction: "" },
    integer: { attribute: "numeric", value: "integer", checkFunction: COMMON.checkInteger, errorMessage: "This Field accepts only whole numbers", strCheckFunction: "COMMON.checkInteger" },
    decimal: { attribute: "numeric", value: "decimal", checkFunction: COMMON.checkDecimal, errorMessage: "This Fields accepts numbers only", strCheckFunction: "COMMON.checkDecimal" },
    money: { attribute: "numeric", value: "money", checkFunction: COMMON.checkMoney, errorMessage: "This Fields accepts numbers that have from 2 to 4 required decimal places", strCheckFunction: "COMMON.checkMoney" },
    required: { attribute: "required", value: "required", checkFunction: COMMON.checkRequired, errorMessage: "This Field is required and cannot be left blank or unselected", strCheckFunction: "" },
    placeholder: { attribute: "placeholder", value: "", checkFunction: function () { "use strict"; return false; }, errorMessage: "", strCheckFunction: "" },
    maxLength: { attribute: "maxLength", value: "", checkFunction: COMMON.checkLenghtMax, errorMessage: "This Field has exceed that maximum allowable length", strCheckFunction: "" }
};
COMMON.checkFieldHasError = function (objOrId, hasError, optionalCheck, optionalErrMess) {
    ///<summary>checks the given element to see if it has any validationTypes attributes, runs the appropriate validation function if designated (true if there is an error), changes the background color to red if there is an error or white if it is valid</summary>
    ///<param name="obj" type="element">Field (user input) element to be checked</param>
    ///<param name="hasError" type="Boolean">the value to determine if this field or any field in the group has an error.  This will only be false if all fields pass checks</param>
    ///<param name="optionalCheck" type="Boolean">(optional) an expression that will determine if this item has an error (true == error)</param>
    ///<param name="optionalErrMess" type="String">(optional) as message to display in title of the field (mouse hover shows message)</param>
    ///<returns type="Boolean">True if there is an error</returns>
    "use strict";
    var errorCheck, idPrefix, oneProperty, thisAttributeValue, thisValType, obj;
    errorCheck = false;
    obj = COMMON.getElement(objOrId);
    if (obj && obj.id.length > 3) {
        idPrefix = obj.id.substring(0, 3);
        for (oneProperty in COMMON.validationTypes) {
            if (COMMON.validationTypes.hasOwnProperty(oneProperty)) {
                thisValType = COMMON.validationTypes[oneProperty];
                thisAttributeValue = obj.getAttribute(thisValType.attribute) || "";
                if (thisValType.checkFunction !== "" && thisAttributeValue === thisValType.value) {
                    errorCheck = thisValType.checkFunction(idPrefix, obj.id);
                    obj.setAttribute("title", (errorCheck ? thisValType.errorMessage : ""));
                    if (errorCheck) { break; }
                }
            }
        }
        obj.style.backgroundColor = (errorCheck ? "red" : "");
    }
    if (!errorCheck && optionalCheck !== undefined && optionalCheck) {
        obj.style.backgroundColor = "red";
        errorCheck = true;
    }
    if (errorCheck && optionalErrMess !== undefined && optionalErrMess !== null) {
        obj.setAttribute("title", optionalErrMess);
    }
    return hasError || errorCheck;
};
COMMON.validateForm = function (parentNodeId) {
    ///<summary>Validates the user editable fields in a container element</summary>
    ///<param name="parentNodeId" type="String">the id of the parentnode containing the fields to check</param>
    ///<returns type="Boolean">True if there are no errors</returns>
    "use strict";
    var parentNodeObj, allChildren, hasError, i, oneProperty, tags, thisFT;
    parentNodeObj = COMMON.docObj.getElementById(parentNodeId);
    if (!parentNodeObj) { return false; }//form is invalidate because I can't find it!!
    hasError = false;
    tags = {};
    for (oneProperty in COMMON.fieldTypes) {
        if (COMMON.fieldTypes.hasOwnProperty(oneProperty) && COMMON.fieldTypes[oneProperty].isField) {
            tags[oneProperty] = COMMON.fieldTypes[oneProperty];
        }
    }
    for (oneProperty in tags) {
        if (tags.hasOwnProperty(oneProperty)) {
            thisFT = tags[oneProperty];
            allChildren = parentNodeObj.getElementsByTagName(thisFT.tag);
            if (allChildren.length > 0) {
                for (i = 0; i < allChildren.length; i++) {
                    if (thisFT.type === "" || allChildren[i].getAttribute("type") === thisFT.type) {
                        hasError = COMMON.checkFieldHasError(allChildren[i], hasError);
                    }
                }
            }
        }
    }
    return !hasError;//true if form is valid
};
//Max length display
COMMON.zcharsRemaining = function (obj) {
    "use strict";
    ///<summary>NOT FOR EXTERNAL USE...displays to the user how many characters this element should have</summary>
    var displayDivId, displayDivObj, charsRemaining, maxLen;
    displayDivId = COMMON.fieldTypes.div.id + obj.id;
    displayDivObj = COMMON.docObj.getElementById(displayDivId);
    maxLen = parseInt(obj.getAttribute(COMMON.validationTypes.maxLength.attribute), 10);
    obj.style.backgroundColor = "white";
    charsRemaining = maxLen - obj.value.length;
    if (charsRemaining < 0) {
        displayDivObj.innerHTML = "You have too many characters.  This field can only have " + String(maxLen) + " characters.";
        obj.style.backgroundColor = "red";
        return false;
    }
    displayDivObj.innerHTML = String(charsRemaining) + " characters remaining";
};
COMMON.zassembleMaxLengthElement = function (txtObj) {
    ///<summary>NOT FOR EXTERNAL USE...supplement to the text object if max lenght is designated</summary>
    //creates a div element envelope that contains a div for "Characters Remaining" message and the txtObj
    //the className of the message div and the txtObj is set HERE so that it can be manipulated from by the css of the
    //division js (such as fillinform.css, customconfirm.css, etc)
    "use strict";
    var messageDivClassName, txtClassName, obj1, obj2;
    messageDivClassName = "maxLengthErrMess";
    txtClassName = "maxLengthTxt";
    obj1 = COMMON.getFieldObject("div");
    obj2 = COMMON.getFieldObject("div", txtObj.id);
    obj2.innerHTML = "&nbsp;";
    obj2.className = messageDivClassName;
    obj1.appendChild(obj2);
    txtObj.className = txtClassName;
    obj1.appendChild(txtObj);
    return obj1;
};

//element creators
COMMON.getFileUpload = function (id, className, attribLO) {
    ///<summary>Gets and input of type file element</summary>
    ///<param name="id" type="String">(Optional) The id of the element. Will append the fieltype.id value to the beginning of the provided id if there is not already set (i.e. for text box if the provided id = "GRID" this will result in the id of the element being "txtGRID" else if the provided id is "txtGrid" for the same text box then the resulting id will not change.</param>
    ///<param name="attribLO" type="Literal Object">(Optional) Object containing attributeName:attributevalue pairs</param>
    "use strict";
    var obj;
    obj = COMMON.getFieldObject("dfu", id, "", false, null, null, null, className, attribLO);
    return obj;
};
COMMON.getFieldObject = function (fieldType, id, value, isRequired, valType, placeholder, maxLength, className, attribLO) {
    ///<summary>creates a dynamically created element and returns the object</summary>
    ///<param name="fieldType" type="COMMON.fieldTypes">The type of element to create</param>
    ///<param name="id" type="String">(Optional) The id of the element, will append the fieltype.id value to the beginning of the provided id if there is not already set (i.e. for text box if the provided id = "GRID" this will result in the id of the element being "txtGRID" else if the provided id is "txtGrid" for the same text box then the resulting id will not change.</param>
    ///<param name="value" type="String|Obj">(Optional)  the value of the element if provided (can be null). For boolean type values (such as check boxes and radio buttons must be a truthy type value ("1", true, exists) to set the check</param>
    ///<param name="isRequired" type="boolean">If true will require use to have selected or entered something in the field</param>
    ///<param name="valType" type="String">(Optional) The type of number validation to do on this field from COMMON.validationTypes</param>
    ///<param name="placeholder" type="String">(Optional) Adds a visible text on fields when field is empty HTML5. Otherwise creates a storage place for invisible text</param>
    ///<param name="maxLength" type="int">(Optional) ignored if the field is not a textbox or text area. Sets the maximum number of characters allowed in the field</param>
    ///<param name="className" type="String">(Optional) the CSS Class Name of the element</param>
    ///<param name="attribLO" type="Literal Object">(Optional) Object containing attributeName:attributevalue pairs</param>
    ///<returns type="Element"></returns>
    "use strict";
    var thisfieldType, thisValType, obj, idFiller;
    thisfieldType = COMMON.fieldTypes[fieldType];
    //handle unknown fieldtypes as basic containers
    if (!thisfieldType) {
        //div: { id: "div", name: "Div", tag: "div", type: "", index: 8, isField: false, setValueFunction: COMMON.setElemValue, getValueFunction: null, canHaveMaxLen: false },
        thisfieldType = {};
        idFiller = fieldType;
        if (idFiller.length === 1) { idFiller = idFiller + idFiller + idFiller; }
        if (idFiller.length === 2) { idFiller = idFiller.substring(0, 1) + idFiller; }
        if (idFiller.length > 3) { idFiller = idFiller.substring(0, 3); }
        thisfieldType.id = idFiller;
        thisfieldType.name = "Unknown type: " + fieldType;
        thisfieldType.tag = fieldType;
        thisfieldType.type = "";
        thisfieldType.index = 99;
        thisfieldType.isField = false;
        thisfieldType.setValueFunction = COMMON.setElemValue;
        thisfieldType.getValueFunction = null;
        thisfieldType.canHaveMaxLen = false;
    }
    thisValType = (valType ? COMMON.validationTypes[valType] : COMMON.validationTypes.none);
    obj = COMMON.docObj.createElement(thisfieldType.tag);
    //add fieldtype attribute
    COMMON.addAttribute(obj, "fieldtype", thisfieldType.id, true);
    if (thisfieldType.type !== "") { obj.type = thisfieldType.type; }
    if (id) {
        if (id.length >= 3 && id.substring(0, 3) !== thisfieldType.id) { id = thisfieldType.id + id; }
        obj.id = id;
        obj.setAttribute("name", id);
    }
    if (isRequired) {
        COMMON.addAttribute(obj, COMMON.validationTypes.required.attribute, COMMON.validationTypes.required.value, true);
    }
    COMMON.addAttribute(obj, thisValType.attribute, thisValType.value, true);
    if (placeholder !== undefined && placeholder !== null) {
        COMMON.addAttribute(obj, COMMON.validationTypes.placeholder.attribute, placeholder, true);
    }
    if (value !== undefined && value !== null) {
        thisfieldType.setValueFunction(obj, value);
    }
    if (className !== undefined && className !== null) { obj.className = className; }
    if (thisValType.isField && obj.select) { COMMON.addAttribute(obj, "onfocus", "this.select();", true); }
    if (attribLO) {
        COMMON.addAttribute(obj, attribLO, null, true);
    }
    if (maxLength && thisfieldType.canHaveMaxLen && !isNaN(maxLength) && parseInt(String(maxLength), 10) > 0) {
        //this only for maxLen textboxes: returns a div evelope with chars remaining error div and the textbox
        COMMON.addAttribute(obj, "onkeyup", "COMMON.zcharsRemaining(this);", true);
        COMMON.addAttribute(obj, COMMON.validationTypes.maxLength.attribute, String(maxLength), true);
        return COMMON.zassembleMaxLengthElement(obj);
    }
    if (fieldType === "txa") {
        //adds the kill submit function to stop enter from causing any events and function as a CRLF 
        COMMON.addAttribute(obj, "onkeydown", "return COMMON.zKillSubmit(event);", true);
    }
    return obj;
};
COMMON.getBasicElement = function (fieldType, id, value, className, placeholder, attribLO) {
    ///<summary>Gets an element, typically for elements that are not user editable</summary> 
    ///<param name="fieldType" type="COMMON.fieldTypes">The type of element to create</param>
    ///<param name="id" type="String">(Optional) The id of the element, will append the fieltype.id value to the beginning of the provided id if there is not already set (i.e. for text box if the provided id = "GRID" this will result in the id of the element being "txtGRID" else if the provided id is "txtGrid" for the same text box then the resulting id will not change.</param>
    ///<param name="value" type="String|Object">(Optional) the innerHTML or value of the element if provided (can be null)</param>
    ///<param name="className" type="String">(Optional) the CSS Class Name of the element</param>
    ///<param name="placeholder" type="String">(Optional) Adds a visible text on fields when field is empty HTML5. Otherwise creates a storage place for invisible text</param>
    ///<param name="attribLO" type="Literal Object">(Optional) Object containing attributeName:attributevalue pairs</param>
    "use strict";
    return COMMON.getFieldObject(fieldType, id, value, false, null, placeholder, null, className, attribLO);
};
COMMON.getCheckBox = function (id, value, label, className, placeholder, attribLO, outerClassName) {
    ///<summary>Get a single checkbox element with label</summary>
    ///<param name="id" type="String">(Optional) The id of the element, will append the fieltype.id value to the beginning of the provided id if there is not already set (i.e. for text box if the provided id = "GRID" this will result in the id of the element being "txtGRID" else if the provided id is "txtGrid" for the same text box then the resulting id will not change.</param>
    ///<param name="value" type="String|Object">(Optional) if true the check box will be checked (can be null)</param>
    ///<param name="label" type="String">(Optional) the label associated with the checkbox</param>
    ///<param name="className" type="String">(Optional) the CSS Class Name of the element</param>
    ///<param name="placeholder" type="String">(Optional) Adds a visible text on fields when field is empty HTML5. Otherwise creates a storage place for invisible text</param>
    ///<param name="attribLO" type="Literal Object">(Optional) Object containing attributeName:attributevalue pairs</param>
    ///<param name="outerClassName" type="String">(Optional) class name for span element containing controls</param>
    "use strict";
    var objOut, obj1, obj2;
    objOut = COMMON.getBasicElement("div", null, null, outerClassName);
    obj1 = COMMON.getFieldObject("chk", id, value, false, null, placeholder, null, className, attribLO);
    if (label !== undefined && label !== null) {
        obj2 = COMMON.getBasicElement("label", null, label);
        if (id !== undefined && id !== null) {
            obj2.setAttribute("for", id);
            obj2.setAttribute("accesskey", id);
            objOut.appendChild(obj1);
            objOut.appendChild(obj2);
        } else {
            obj2.appendChild(obj1);
            objOut.appendChild(obj2);
        }
    } else {
        objOut.appendChild(obj1);
    }
    return objOut;
};
COMMON.getNumberField = function (id, value, isrequired, className, valType, min, max, step, placeholder, attribLO) {
    ///<summary>Gets an input element with HTML5 validation of type "number"</summary>
    ///<param name="id" type="String">(Optional) The id of the element, will append "num" to the beginning of the provided id if there is not already set (i.e. for text box if the provided id = "GRID" this will result in the id of the element being "numGRID" else if the provided id is "numGrid" for the same text box then the resulting id will not change.</param>
    ///<param name="value" type="String">(Optional)  the value of the element if provided (can be null).</param>
    ///<param name="isrequired" type="boolean">If true will require use to have selected or entered something in the field</param>
    ///<param name="className" type="String">(Optional) the CSS Class Name of the element</param>
    ///<param name="valType" type="String">(Optional) The type of number validation to do on this field from COMMON.validationTypes</param>
    ///<param name="min" type="number">(Optional) Minimum value allowed</param>
    ///<param name="max" type="number">(Optional) Maximum value allowed</param>
    ///<param name="step" type="number">(Optional) accepted values in the increment of this value starting with min (i.e. values accepted are min, min + step, min + (step * 2), etc... up to max value)</param>
    ///<param name="placeholder" type="String">(Optional) Adds a visible text on fields when field is empty HTML5. Otherwise creates a storage place for invisible text</param>
    ///<param name="attribLO" type="Literal Object">(Optional) Object containing attributeName:attributevalue pairs</param>
    "use strict";
    var obj;
    obj = COMMON.getFieldObject("num", id, value, isrequired, valType, placeholder, null, className, attribLO);
    if (min !== undefined && min !== null && typeof min === "number") { obj.setAttribute("min", String(min)); }
    if (max !== undefined && max !== null && typeof max === "number") { obj.setAttribute("max", String(max)); }
    if (step !== undefined && step !== null && typeof step === "number") { obj.setAttribute("step", String(step)); }
    return obj;
};
COMMON.getCalendar = function (id, value, isRequired, placeholder, messageDivId, className, onkeypressAction, onchangeAction, attribLO, disabled, calendarCloseFunction, optionalData) {
    ///<summary>creates a Calendar object (textbox with calendar icon requires jpg/showcal.jpg image)</summary>
    ///<param name="id" type="String">The id of the element, will append the "cal" to the beginning of the provided id if there is not already set (i.e. if the provided id = "GRID" this will result in the id of the element being "calGRID" else if the provided id is "calGrid" for the same text box then the resulting id will not change.</param>
    ///<param name="value" type="String">(Optional) the value of the element if provided (can be null) in format MM/dd/yyyy.</param>
    ///<param name="isRequired" type="boolean">If true will require use to have selected or entered something in the field</param>
    ///<param name="placeholder" type="String">(Optional) Adds a visible text on fields when field is empty HTML5. Otherwise creates a storage place for invisible text</param>
    ///<param name="MessageDivId" type="String">The element id where error messages will be displayed</param>
    ///<param name="className" type="String">(Optional) the CSS Class Name of the element</param>
    ///<param name="onkeypressAction" type="String">(Optional) Function to run during onkeypress event</param>
    ///<param name="onchangeAction" type="String">(Optional) Function Variable to run during onchange event of the text box and when calendar control is clicked</param>
    ///<param name="attribLO" type="Literal Object">(Optional) Object containing attributeName:attributevalue pairs</param>
    ///<param name="disabled" type="Boolean">(Optional) if true both the button and text box will be disabled
    ///<param name="calendarCloseFunction" type="FunctionVariable">(Optional) a function that is run when the calendar is closed by the act of selecting and item. The format is function(valueSelected, optionalData)</param>
    ///<param name="optionalData" type="Object">(Optional) Ignored if calendarCloseFunction is not provided. A value passed to the calendarCloseFunction</param>
    "use strict";
    var attrib, obj, obj1, obj2, obj3;
    CAL.continuingFunction = calendarCloseFunction;
    CAL.optionalData = optionalData;
    attrib = {};
    COMMON.addAttribute(attrib, attribLO);
    if (onkeypressAction) {
        COMMON.addAttribute(attrib, "onkeypress", onkeypressAction);
    }
    if (onchangeAction) {
        COMMON.addAttribute(attrib, "onchange", onchangeAction);
    }
    COMMON.addAttribute(attrib, "onkeyup", "return CAL.checkDateEntry(event);");
    COMMON.addAttribute(attrib, "onchange", "CAL.checkDateEntry(event);");
    COMMON.addAttribute(attrib, "messagediv", messageDivId);
    obj = COMMON.getFieldObject("txt", id, value, isRequired, null, placeholder, null, className, attrib);
    id = obj.id;
    obj.setAttribute("name", id);
    obj.setAttribute("style", "float:left;");
    obj.disabled = disabled;
    obj1 = COMMON.getBasicElement("div", id);
    obj1.setAttribute("style", "margin:0;padding:0;");
    obj1.appendChild(obj);
    onchangeAction = "CAL.zshowDaySelector(COMMON.docObj.getElementById('" + id + "'));";
    obj2 = COMMON.getLink(id, null, "#", onchangeAction, "Open Calendar and Select Date");
    obj2.setAttribute("style", "margin:0;padding:0;float:left;");
    if (disabled) { obj2.setAttribute("disabled", ""); }
    obj3 = COMMON.getImageElement(null, "jpg/showcal.jpg", "Open Calendar");
    obj3.setAttribute("style", "margin:0;padding:0;border:0;");
    obj3.height = "20";
    obj3.width = "20";
    obj2.appendChild(obj3);
    obj1.appendChild(obj2);
    return obj1;
};
COMMON.getTimePicker = function (id, value) {
    ///<summary>Creates a timepicker object and returns it</summary>
    ///<param name="id" type="String">The id of the base div that contains the control</param>
    ///<param name="value" type="String">(Optional) The initial time to set the control in the format ("HH:MM") HH Value 0 - 23, MM Value 0 - 59. If omitted, the time will be the current system time</param>
    ///<returns type="Element" />
    "use strict";
    return TIMEPICKER.createTimepicker(id, value);
};
COMMON.getDDL = function (id, value, isRequired, placeholder, listItem, className, attribLO) {
    ///<summary>creates dynamic ddl (Select Element)</summary>
    ///<param name="id" type="String">(Optional) The id of the element, will append "ddl" to the beginning of the provided id if there is not already set (i.e. if the provided id = "GRID" this will result in the id of the element being "ddlGRID" else if the provided id is "ddlGrid" for the same text box then the resulting id will not change.</param>
    ///<param name="value" type="String">(Optional) the value of the element if provided (can be null).</param>
    ///<param name="isRequired" type="boolean">If true will require use to have selected or entered something in the field</param>
    ///<param name="placeholder" type="String">(Optional) Adds a visible text on fields when field is empty HTML5. Otherwise creates a storage place for invisible text</param>
    ///<param name="listItem" type="Array">literal object array with properties text and value used to add options to the "select" element. Format [{"text":"textValue", "value":"valuevalue"},...]</param>
    ///<param name="className" type="String">(Optional) the CSS Class Name of the element</param>
    ///<param name="attribLO" type="Literal Object">(Optional) Object containing attributeName:attributevalue pairs</param>
    "use strict";
    var obj, i;
    obj = COMMON.getFieldObject("ddl", id, null, isRequired, null, placeholder, null, className, attribLO);
    if (listItem && listItem.length > 0) {
        for (i = 0; i < listItem.length; i++) {
            COMMON.addOption(obj, listItem[i].text, listItem[i].value);
        }
    }
    if (value !== null) { COMMON.fieldTypes.ddl.setValueFunction(obj, value); }
    return obj;
};
COMMON.getImageElement = function (id, src, alt, placeholder, className, width, height, attibLO) {
    ///<summary>Create dynamic img element</summary>
    ///<param name="id" type="String">(Optional) The id of the element, will append "img" to the beginning of the provided id if there is not already set (i.e. if the provided id = "GRID" this will result in the id of the element being "imgGRID" else if the provided id is "imgGrid" for the same text box then the resulting id will not change.</param>
    ///<param name="src" type="String">The URL of the image</param>
    ///<param name="placeholder" type="String">(Optional) Adds a visible text on fields when field is empty HTML5. Otherwise creates a storage place for invisible text</param>
    ///<param name="className" type="String">(Optional) the CSS Class Name of the element</param>
    ///<param name="width" type="String">(Optional) a number for the width attribute</param>
    ///<param name="height" type="String">(Optional) a number for the height attribute</param>
    ///<param name="attribLO" type="Literal Object">(Optional) Object containing attributeName:attributevalue pairs</param>
    "use strict";
    var obj;
    obj = COMMON.getFieldObject("img", id, null, null, null, placeholder, null, className, attibLO);
    obj.setAttribute("src", src);
    obj.setAttribute("alt", alt);
    if (width !== undefined && width !== null) { obj.setAttribute("width", width); }
    if (height !== undefined && width !== null) { obj.setAttribute("height", height); }
    return obj;
};
COMMON.getDDLfromQuery = function (id, value, isRequired, queryId, params, placeholder, className, attribLO) {
    ///<summary>creates dynamic ddl (Select element) from a AJAXPOST query</summary>
    ///<param name="id" type="String">(Optional) The id of the element, will append "ddl" to the beginning of the provided id if there is not already set (i.e. if the provided id = "GRID" this will result in the id of the element being "ddlGRID" else if the provided id is "ddlGrid" for the same text box then the resulting id will not change.</param>
    ///<param name="value" type="String">(Optional)  the value of the element if provided (can be null).</param>
    ///<param name="isRequired" type="boolean">If true will require use to have selected or entered something in the field</param>
    ///<param name="queryID" type="String">The stored procedure name without pr_ or another key word described in remoteq.aspx.cs. Query results should be column 0 = value, column 1 = text</param>
    ///<param name="params" type="Array">An array of values sent to remoteq.aspx to supplement the query</param>
    ///<param name="placeholder" type="String">(Optional) Adds a visible text on fields when field is empty HTML5. Otherwise creates a storage place for invisible text</param>
    ///<param name="className" type="String">(Optional) the CSS Class Name of the element</param>
    ///<param name="attribLO" type="Literal Object">(Optional) Object containing attributeName:attributevalue pairs</param>
    //
    "use strict";
    var listItem, i, oneItem;
    AJAXPOST.callQuery(queryId, params);
    listItem = [];
    if (AJAXPOST.dataResults && AJAXPOST.dataResults.length > 0) {
        for (i = 0; i < AJAXPOST.dataResults.length; i++) {
            oneItem = {
                value: AJAXPOST.dataResults[i][0],
                text: AJAXPOST.dataResults[i][1]
            };
            listItem.push(oneItem);
        }
    }
    return COMMON.getDDL(id, value, isRequired, placeholder, listItem, className, attribLO);
};
COMMON.getButton = function (id, value, onclick, placeholder, className, attribLO) {
    ///<summary>Creates a imput element of type submit</summary>
    ///<param name="id" type="String">(Optional) The id of the element, will append "btn" to the beginning of the provided id if there is not already set (i.e. if the provided id = "GRID" this will result in the id of the element being "btnGRID" else if the provided id is "btnGrid" for the same text box then the resulting id will not change.</param>
    ///<param name="value" type="String">(Optional) the value of the element if provided (can be null).</param>
    ///<param name="onclick" type="String">The script to run when button is clicked. return false; command will automatically be appended</param>
    ///<param name="placeholder" type="String">(Optional) Adds a visible text on fields when field is empty HTML5. Otherwise creates a storage place for invisible text</param>
    ///<param name="className" type="String">(Optional) the CSS Class Name of the element</param>
    ///<param name="attribLO" type="Literal Object">(Optional) Object containing attributeName:attributevalue pairs</param>
    "use strict";
    var obj;
    obj = COMMON.getFieldObject("btn", id, value, false, null, placeholder, null, className, attribLO);
    if (onclick.substring(onclick.length - 1) !== ";") { onclick += ";"; }
    if (onclick.indexOf("return false;") < 0) { onclick += " return false;"; }
    COMMON.addAttribute(obj, "onclick", onclick, true);
    return obj;
};
COMMON.getLink = function (id, value, href, onclick, title, attribLO, target) {
    ///<summary>Creates a Link (Anchor Tag) element</summary>
    ///<param name="id" type="String">(Optional) The id of the element, will append "lnk" to the beginning of the provided id if there is not already set (i.e. if the provided id = "GRID" this will result in the id of the element being "lnkGRID" else if the provided id is "lnkGrid" for the same text box then the resulting id will not change.</param>
    ///<param name="value" type="String">(Optional) the innerHTML value of the element if provided (can be null).</param>
    ///<param name="href" type="String">(Optional) Ignored if onclick has a value. The href of this element</param>
    ///<param name="onclick" type="String">(Optional)The script to run when button is clicked. return false; command will automatically be appended</param>
    ///<param name="title" type="String">(Optional) the hover tooltip to display</param>
    ///<param name="attribLO" type="Literal Object">(Optional) Object containing attributeName:attributevalue pairs</param>
    ///<param name="target" type="String">(Optional) the target attribute value</param>
    "use strict";
    var obj, suffix;
    obj = COMMON.getFieldObject("lnk", id, value, false, null, null, null, null, attribLO);
    if (href) { obj.href = href; }
    if (onclick) {
        suffix = " return false";
        if (onclick.trim().substring(onclick.trim().length - 1) !== ";") { suffix = ";" + suffix; }
        COMMON.addAttribute(obj, "onclick", onclick + suffix, true);
        obj.href = "#";
    }
    if (title !== undefined && title !== null) { obj.setAttribute("title", title); }
    if (target !== undefined && target !== null && href) { obj.setAttribute("target", target); }
    return obj;
};
//*********************************Element creation, validation and value retrieval*****************************************************************//
//*******************************Generic Help*********************************************************//
COMMON.helpDialog = function (topic, displayDivId, width) {
    ///<summary>Opens a dialog with help contents as described in helptopics.js</summary>
    ///<param name="topic" type="String">The topic to display as described in helptopics.js</param>
    ///<param name="displayDivId" type="String">The id of the parentNode of which the help div will be the child</param>
    ///<param name="width" type="String">CSS width value used for the help dialog</param>
    "use strict";
    var content, title, objOut, i, n, oneCt, obj1, obj2, helpTopicObj, formIndex;
    helpTopicObj = HELPTOPICS[topic]();
    content = helpTopicObj.content;
    title = "Help - " + helpTopicObj.title;
    objOut = COMMON.docObj.createElement("div");
    if (content && content.length > 0) {
        for (i = 0; i < content.length; i++) {
            oneCt = content[i];
            obj1 = COMMON.docObj.createElement(oneCt.tag);
            switch (oneCt.tag) {
                case "h2":
                case "h3":
                case "div":
                case "p":
                    obj1.innerHTML = oneCt.ih;
                    break;
                case "ul":
                    for (n = 0; n < oneCt.ih.length; n++) {
                        obj2 = COMMON.docObj.createElement("li");
                        obj2.innerHTML = oneCt.ih[n];
                        obj1.appendChild(obj2);
                    }
                    break;
            }
            objOut.appendChild(obj1);
        }
    }
    formIndex = FILLIN.okDialog(displayDivId, title, objOut, width);
    obj1 = document.getElementById("divformBase" + String(formIndex));
    obj1.style.position = "absolute";
    obj1.style.top = "0";
};
COMMON.createHelpContentObj = function (tag, content) {
    ///<summary>Creates a content object used by helptopics.js</summary>
    ///<param name="tag" type="String">The tag to create</param>
    ///<param name="content" type="String|String Array">What the tag will contain</param>
    ///<returns type="Object">The Object</returns>
    "use strict";
    var obj;
    obj = {};
    obj.tag = tag;
    obj.ih = content;
    return obj;
};
//*******************************Generic Help*********************************************************//
//*****************************Javascript object enhancers*********************************************//
if (typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function () {
        "use strict";
        return this.replace(/^\+|\s$/g, "");
    };
}
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (value, start) {
        "use strict";
        var i;
        for (i = (start || 0) ; i < this.length; i++) {
            if (this[i] === value) { return i; }
        }
        return -1;
    };
}
String.prototype.padLeft = function (char, len) {
    "use strict";
    var i, pads;
    if (len === 0) { return this; }
    pads = "";
    for (i = 1; i <= len; i++) { pads += String(char); }
    pads += this;
    return pads.substring(pads.length - len);
};
String.prototype.padRight = function (char, len) {
    "use strict";
    var i, pads;
    if (len === 0) { return this; }
    pads = "";
    for (i = 1; i <= len; i++) { pads += String(char); }
    pads = this + pads;
    return pads.substring(0, len);
};
//*****************************Javascript object enhancers*********************************************//
//*****************************Browser Info***********************************************************//
COMMON.zgetIEVer = function () {
    ///<summary>NOT FOR EXTERNAL USE...gets the ie version and places if in COMMMON.ieVer</param>
    "use strict";
    var rv, ua, re;
    rv = 100; // Return value assumes failure.
    if (navigator.appName === 'Microsoft Internet Explorer') {
        ua = navigator.userAgent;
        re = new RegExp(/MSIE ([0-9]{1,}[\.0-9]{0,})/);
        if (re.exec(ua) !== null) {
            rv = parseFloat(RegExp.$1);
        }
    }
    return rv;
};
///<var>Contains the ie version as a string</var>
COMMON.ieVer = COMMON.zgetIEVer();
COMMON.getWindowWidth = function () {
    "use strict";
    if (window.self.innerWidth) { return window.self.innerWidth; }
    if (document.documentElement && document.documentElement.clientWidth) { return document.documentElement.clientWidth; }
    if (document.body) { return document.body.clientWidth; }
};
//*****************************IE Version************************************************************//