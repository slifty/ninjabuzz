function getRandomSubarray(arr, size) {
    var shuffled = arr.slice(0), i = arr.length, temp, index;
    while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(0, size);
}

var indexOf = function(needle) {
    if(typeof Array.prototype.indexOf === 'function') {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function(needle) {
            var i = -1, index = -1;

            for(i = 0; i < this.length; i++) {
                if(this[i] === needle) {
                    index = i;
                    break;
                }
            }

            return index;
        };
    }

    return indexOf.call(this, needle);
};

var arr_diff = function(a1, a2) {
  var a=[], diff=[];
  for(var i=0;i<a1.length;i++)
    a[a1[i]]=true;
  for(var i=0;i<a2.length;i++)
    if(a[a2[i]]) delete a[a2[i]];
    else a[a2[i]]=true;
  for(var k in a)
    diff.push(k);
  return diff;
}


function animationFrameShim() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
};
animationFrameShim();

function getDaystampFromTime(time) {
    var components = time.split(":");
    var h = components[0];
    var m = components[1];
    var s = components[2];
    return parseInt(s) + 60*parseInt(m) + 3600*parseInt(h);
}

function getTimeFromDaystamp(daystamp) {
    return Math.floor(daystamp / 3600) + ":" + Math.floor(daystamp % 3600 / 60) + ":" + Math.floor(daystamp % 60) ;
}

function formatTime(time) {
    var components = time.split(":");
    var h = components[0];
    var m = components[1];
    var s = components[2];
    return ((h - 1) % 12 + 1) + ":" + ('0' + m).slice(-2) + " " + ((h > 11)?"PM":"AM");
}

function getCurrentDaystamp() {
    var d = new Date();
    return d.getHours() * 60 * 60 + d.getMinutes() * 60 + d.getSeconds();
}