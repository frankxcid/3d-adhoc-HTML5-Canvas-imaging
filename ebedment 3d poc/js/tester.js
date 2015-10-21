var CAN = {};
CAN.instance = {};
CAN.init = function (x, y) {
    "use strict";
    var obj, priv;
    priv = {};
    priv.doOne = function () {
        alert(obj.x + 1);
    };
    obj = {};
    obj.x = x;
    obj.y = y
    obj.doOne = function () {
        obj.x = obj.x + 2;
        obj.y = obj.y + 3;
    };
    obj.doTwo = function () {
        priv.doOne();
    }
    CAN.instance[y] = obj;
    return obj;
};
var t = CAN.init(3, 4);
var s = CAN.init(5, 6);
CAN.testHT = function (fontFamily, fontSize, text) {
    "use strict";
    var div, val, bod;
    div = document.createElement("div");
    div.setAttribute("style", "font-family:" + fontFamily + ";font-size:" + fontSize + ";");
    div.innerHTML = text;
    bod = document.getElementsByTagName("body")[0];
    bod.appendChild(div);
    val = div.offsetHeight;
    bod.removeChild(div);
    alert(val);
};
