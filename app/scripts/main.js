;
'use strict';
var initializing = false,
    fnTest = /xyz/.test(function() {
        xyz;
    }) ? /\b_super\b/ : /.*/;

// The base Class implementation (does nothing)
var Class = function() {};

// Create a new Class that inherits from this class
Class.extend = function(prop) {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (var name in prop) {
        if (name != "statics") {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" &&
                typeof _super[name] == "function" && fnTest.test(prop[name]) ?
                (function(name, fn) {
                    return function() {
                        var tmp = this._super;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);
                        this._super = tmp;

                        return ret;
                    };
                })(name, prop[name]) :
                prop[name];
        }
    }

    // The dummy class constructor
    function _Class() {
        // All construction is actually done in the init method
        if (!initializing && this.ctor)
            this.ctor.apply(this, arguments);
    }

    //继承父类的静态属性
    for (var key in this) {
        if (this.hasOwnProperty(key) && key != "extend")
            _Class[key] = this[key];
    }

    // Populate our constructed prototype object
    _Class.prototype = prototype;

    //静态属性和方法
    if (prop.statics) {
        for (var name in prop.statics) {
            if (prop.statics.hasOwnProperty(name)) {
                _Class[name] = prop.statics[name];
                if (name == "ctor") {
                    //提前执行静态构造函数
                    _Class[name]();
                }
            }

        }
    }

    // Enforce the constructor to be what we expect
    _Class.prototype.constructor = _Class;

    // And make this class extendable
    _Class.extend = Class.extend;

    //add implementation method
    _Class.implement = function(prop) {
        for (var name in prop) {
            prototype[name] = prop[name];
        }
    };
    return _Class;
};

window.Class = Class;

function swiperAnimateCache(a) {
    for (var allBoxes = window.document.documentElement.querySelectorAll(".ani"), i = 0; i < allBoxes.length; i++) {
        if (allBoxes[i].attributes["style"]) {
            allBoxes[i].setAttribute("swiper-animate-style-cache", allBoxes[i].attributes["style"].value);
        } else {
            allBoxes[i].setAttribute("swiper-animate-style-cache", " ");
        }
        allBoxes[i].style.visibility = "hidden";
    }
}

function swiperAnimate(a) {
    clearSwiperAnimate(a);
    var b = a.querySelectorAll(".ani");
    for (var i = 0; i < b.length; i++) {
        b[i].style.visibility = "visible";
        var effect = b[i].attributes["swiper-animate-effect"] ? b[i].attributes["swiper-animate-effect"].value : "";
        b[i].className = b[i].className + "  " + effect + " " + "animated";
        var style = b[i].attributes["style"].value;
        var duration = b[i].attributes["swiper-animate-duration"] ? b[i].attributes["swiper-animate-duration"].value : "";
        if (duration) {
            style = style + "animation-duration:" + duration + ";-webkit-animation-duration:" + duration + ";";
        }
        var delay = b[i].attributes["swiper-animate-delay"] ? b[i].attributes["swiper-animate-delay"].value : "";
        if (delay) {
            style = style + "animation-delay:" + delay + ";-webkit-animation-delay:" + delay + ";";
        }

        b[i].setAttribute("style", style);
    }

}

function clearSwiperAnimate(a) {
    for (var allBoxes = a.querySelectorAll(".ani"), i = 0; i < allBoxes.length; i++) {
        if (!allBoxes[i].attributes["swiper-animate-style-cache"]) {
            continue;
        }
        allBoxes[i].setAttribute("style", allBoxes[i].attributes["swiper-animate-style-cache"].value)
        allBoxes[i].style.visibility = "hidden";
        allBoxes[i].className = allBoxes[i].className.replace("animated", " ");
        if (allBoxes[i].attributes["swiper-animate-effect"]) {
            var effect = allBoxes[i].attributes["swiper-animate-effect"].value;
            allBoxes[i].className = allBoxes[i].className.replace(effect, " ");
        }
    }
}

var LXR = {};
LXR.SlideIndicator = Class.extend({
    'statics': {
        'getCurrentAnchorLink': function() {
            var value = window.location.hash.replace('#', '').split('/');
            if (value[0]) {
                return value[0];
            }
            return 1;
        },
        'getCurrentSlideIndex': function() {
            var value = window.location.hash.replace('#', '').split('/');
            return value[1] || 0;
        }
    },
    'ctor': function(duration, anchorLink) {
        this.duration = duration;
        this.anchorLink = anchorLink;
        this.index = 0;
        this.started = false;
        if (!this.initialized) {
            this.slideLength = $('.banner .slide').length;
            this.slideNav = $('<ul class="slide-nav"></ul>');

            var _this = this;

            for (var i = 0; i < this.slideLength; i++) {
                var slideItem = $('<li><i class="split"></i><i class="bar"></i></li>');
                slideItem.css('width', 100 / this.slideLength + '%');
                this.slideNav.append(slideItem);
                slideItem.on('click', function() {
                    $.fn.fullpage.moveTo(anchorLink, $(this).index());
                });
                slideItem.on('mouseover', function() {
                    _this.currentSlide.find('.bar').velocity("stop");
                });
                slideItem.on('mouseout', function() {

                    var barWidth = _this.currentSlide.find('.bar').width();
                    var totalWidth = _this.currentSlide.width();
                    _this.currentSlide.find('.bar').velocity("stop");
                    _this.currentSlide.find('.bar').velocity({
                        'width': '100%'
                    }, {
                        duration: _this.duration * (1 - barWidth / totalWidth),
                        easing: 'linear',
                        //动画结束时，往右移动滑块
                        complete: function(elements) {
                            _this.currentSlide.addClass('ended');
                            _this._progress(++_this.index);
                            $.fn.fullpage.moveSlideRight();
                        }
                    });

                });
            }

            $('.banner').append(this.slideNav);

            this.initialized = true;
        }

        this._progress(this.index);
    },
    //指示器以动画的方式指示进度，从Fullpage处传入的index是从0开始的
    '_progress': function() {
        if (!this.started) {
            return;
        }
        var tempIndex = this.index;
        this.index = this.index % this.slideLength;
        this.currentSlide = this.slideNav.find('li').eq(this.index);
        var barWidth = this.currentSlide.find('.bar').width();
        var totalWidth = this.currentSlide.width();
        //将当前slide之前的指示器标识为结束
        this.slideNav.find('li:lt(' + (this.index) + ')').addClass('ended');
        if ((barWidth == 0 || barWidth == totalWidth) && tempIndex == 0) { //如果当前为第一个slide，则把指示器恢复到开始状态
            this.slideNav.find('li').removeClass('ended');
            this.slideNav.find('li .bar').css('width', '0%');
        }
        var _this = this;

        this.currentSlide.find('.bar').velocity({
            'width': '100%'
        }, {
            duration: _this.duration * (1 - barWidth / totalWidth),
            easing: 'linear',
            //动画结束时，往右移动滑块
            complete: function(elements) {
                _this.currentSlide.addClass('ended');
                _this._progress(++_this.index);
                $.fn.fullpage.moveSlideRight();
            }
        });
    },
    //启动FullPag的横向滑块指示器，index从0开始
    'start': function(index) {
        this.index = index;
        // if (this.currentSlide) {
        //     this.currentSlide.stop();
        // }
        this.started = true;
        this._progress(this.index);
    },
    'setIndex': function(index) {
        this.index = index;
        this.slideNav.find('li').removeClass('ended');
        this.slideNav.find('li .bar').css('width', '0%');
        this.slideNav.find('li:lt(' + (this.index) + ')').addClass('ended');
        if (this.currentSlide) {
            this.currentSlide.find('.bar').velocity("stop");
            this._progress(this.index);
        }
    },
    'stop': function() {
        if (this.currentSlide) {
            this.currentSlide.find('.bar').velocity("stop");
        }
    }
});

//层跟随鼠标进行移动
LXR.LayerMove = Class.extend({
    'ctor': function(layer, rate, container) {
        this.container = container;
        this.layer = layer;
        this.rate = rate;
    },
    '_moveHandler': function(e, _this) {
        var x = e.clientX || e.pageX;
        var y = e.clientY || e.pageY;
        var w = $(window).width();
        var h = $(window).height();

        var moveX = (x - w / 2) / w * _this.rate * w;
        var moveY = (y - h / 2) / h * _this.rate * h;

        $(this.layer).css('transform', 'translate3d(' + moveX + 'px, ' + moveY + 'px, 0px)');
    },
    'stop': function() {
        $(this.container).off('mousemove.layermove');
        return this;
    },
    'start': function() {
        var _this = this;
        $(this.container).on('mousemove.layermove', function(e) {
            _this._moveHandler(e, _this);
        });
        return this;
    }
});


LXR.Animate = Class.extend({
    'ctor': function() {
        // var _this = this;
        $('.menu').click(function() {
            if ($('.nav li').css('opacity') != 1) {
                $('.nav li').velocity('transition.slideRightIn', {
                    duration: 500,
                    stagger: 150,
                    display: 'inline-block',
                    backwards: true
                });
            } else {
                $('.nav li').velocity('transition.slideRightBigOut', {
                    duration: 500,
                    stagger: 150,
                    display: 'inline-block',
                    backwards: true
                });
            }
        });
    },
    //导航菜单顶部依次落下
    'navSlideDownIn': function() {
        $('.nav li').velocity('transition.slideDownBigIn', {
            duration: 800,
            stagger: 250,
            display: 'inline-block'
        });
        $('.menu').velocity('transition.fadeOut', {
            delay: 0,
            display: 'block'
        });
    },
    //导航菜单往右侧消失
    'navRightOut': function() {
        $('.nav li, .tel').velocity('transition.slideRightBigOut', {
            duration: 500,
            stagger: 150,
            display: 'inline-block',
            backwards: true
        });
        $('.menu').velocity('transition.fadeIn', {
            delay: 500,
            display: 'block'
        });
    },
    //导航菜单从右侧进入
    'navRightIn': function(hideMenu) {
        // if(!hideMenu) {
        $('.menu').velocity('transition.fadeOut', {
            delay: 0,
            display: 'block'
        });
        // }
        $('.nav li, .tel').velocity('transition.slideRightIn', {
            duration: 500,
            stagger: 150,
            display: 'inline-block',
            backwards: true
        });
    }
});

LXR.SvgIcon = Class.extend({
    'ctor': function() {
        var icon1 = new Snap("#svg-icon-1");
        var arcStr = 'M2 76 A76 76,0 0 1 76 2';
        var arc1 = icon1.paper.path(arcStr).attr('class', 'arc-a').transform(new Snap.Matrix().rotate(45, 78, 78));
        var arc2 = icon1.paper.path(arcStr).attr('class', 'arc-b').transform(new Snap.Matrix().rotate(135, 78, 78));
        var arc3 = icon1.paper.path(arcStr).attr('class', 'arc-a').transform(new Snap.Matrix().rotate(225, 78, 78));
        var arc4 = icon1.paper.path(arcStr).attr('class', 'arc-b').transform(new Snap.Matrix().rotate(315, 78, 78));
        
        var lineGroup = icon1.paper.g();
        var l1 = icon1.paper.line(0,15, 156, 15).attr('stroke-dasharray', '25%, 100%');
        var l2 = icon1.paper.line(0,25, 156, 25).attr('stroke-dasharray', '30%, 100%');
        var l3 = icon1.paper.line(0,60, 156, 60).attr('stroke-dasharray', '15%, 100%');
        var l4 = icon1.paper.line(0,75, 156, 75).attr('stroke-dasharray', '35%, 100%');
        var l5 = icon1.paper.line(0,102, 156, 102).attr('stroke-dasharray', '45%, 100%');
        var l6 = icon1.paper.line(0,130, 156, 130).attr('stroke-dasharray', '12%, 100%');
        lineGroup.add(l1,l2,l3,l4,l5,l6);

        var circlePath1 = 'M5 78 A73 73,0 1 0 5 77M110 78A33 33, 0 1 1 110 77Z';
        var circle1 = icon1.paper.path(circlePath1).attr('stroke', 'black').attr('fill', 'red');

        var clip = icon1.paper.el('clipPath',{'id': 'circleClip'});
        clip.add(circle1);
        clip.toDefs();

        lineGroup.attr('clip-path', 'url(#circleClip)');

        // Snap.animate(0, 45, function(value) {
        //     arc1.transform(new Snap.Matrix().rotate(value, 78, 78));
        // }, 1500);

        // Snap.animate(45, 135, function(value) {
        //     arc2.transform(new Snap.Matrix().rotate(value, 78, 78));
        // }, 1500);

        // Snap.animate(135, 225, function(value) {
        //     arc3.transform(new Snap.Matrix().rotate(value, 78, 78));
        // }, 1500);

        // Snap.animate(225, 315, function(value) {
        //     arc4.transform(new Snap.Matrix().rotate(value, 78, 78));
        // }, 1500);
        
        var icon2 = new Snap("#svg-icon-2");
        var arcStr = 'M2 76 A76 76,0 0 1 76 2';
        var arc1 = icon2.paper.path(arcStr).attr('class', 'arc-a').transform(new Snap.Matrix().rotate(45, 78, 78));
        var arc2 = icon2.paper.path(arcStr).attr('class', 'arc-b').transform(new Snap.Matrix().rotate(135, 78, 78));
        var arc3 = icon2.paper.path(arcStr).attr('class', 'arc-a').transform(new Snap.Matrix().rotate(225, 78, 78));
        var arc4 = icon2.paper.path(arcStr).attr('class', 'arc-b').transform(new Snap.Matrix().rotate(315, 78, 78));

        var icon3 = new Snap("#svg-icon-3");
        var arcStr = 'M2 76 A76 76,0 0 1 76 2';
        var arc1 = icon3.paper.path(arcStr).attr('class', 'arc-a').transform(new Snap.Matrix().rotate(45, 78, 78));
        var arc2 = icon3.paper.path(arcStr).attr('class', 'arc-b').transform(new Snap.Matrix().rotate(135, 78, 78));
        var arc3 = icon3.paper.path(arcStr).attr('class', 'arc-a').transform(new Snap.Matrix().rotate(225, 78, 78));
        var arc4 = icon3.paper.path(arcStr).attr('class', 'arc-b').transform(new Snap.Matrix().rotate(315, 78, 78));

        // var single1 = icon3.paper.path('M78 65A13 13,0 0 1 91 78').attr('class', 'single').transform(new Snap.Matrix().translate(1, -8));
        // var single2 = icon3.paper.path('M78 58A20 20,0 0 1 98 78').attr('class', 'single').transform(new Snap.Matrix().translate(1, -8));
        var single1 = icon3.paper.circle(78, 78, 16).attr('class', 'single single-1');
        var rect2 = icon3.paper.rect(78,53,24,24).attr('class','clip').attr('stroke', 'black').attr('fill', 'red');
        var clip = icon3.paper.el('clipPath',{'id': 'sigleClip'});
        clip.add(rect2);
        clip.toDefs();
        single1.attr('clip-path', 'url(#sigleClip)');

        var single2 = icon3.paper.circle(78, 78, 16).attr('class', 'single single-2');
        single2.attr('clip-path', 'url(#sigleClip)');

        var singleStatic1 = icon3.paper.circle(78, 78, 16).attr('class', 'single single-static');
        var rect2 = icon3.paper.rect(78,53,24,24).attr('class','clip').attr('stroke', 'black').attr('fill', 'red');
        var clip = icon3.paper.el('clipPath',{'id': 'sigleClipStatic1'});
        clip.add(rect2);
        clip.toDefs();
        singleStatic1.attr('clip-path', 'url(#sigleClipStatic1)');

        var singleStatic2 = icon3.paper.circle(78, 78, 25).attr('class', 'single single-static');
        var rect2 = icon3.paper.rect(78,43,34,34).attr('class','clip').attr('stroke', 'black').attr('fill', 'red');
        var clip = icon3.paper.el('clipPath',{'id': 'sigleClipStatic2'});
        clip.add(rect2);
        clip.toDefs();
        singleStatic2.attr('clip-path', 'url(#sigleClipStatic2)');


        var icon4 = new Snap("#svg-icon-4");
        var arcStr = 'M2 76 A76 76,0 0 1 76 2';
        var arc1 = icon4.paper.path(arcStr).attr('class', 'arc-a').transform(new Snap.Matrix().rotate(45, 78, 78));
        var arc2 = icon4.paper.path(arcStr).attr('class', 'arc-b').transform(new Snap.Matrix().rotate(135, 78, 78));
        var arc3 = icon4.paper.path(arcStr).attr('class', 'arc-a').transform(new Snap.Matrix().rotate(225, 78, 78));
        var arc4 = icon4.paper.path(arcStr).attr('class', 'arc-b').transform(new Snap.Matrix().rotate(315, 78, 78));
        var dot1 = icon4.paper.circle(70, 20, 0).attr('class', 'dot dot-1');
        var dot2 = icon4.paper.circle(120, 30, 0).attr('class', 'dot dot-2');
        var dot3 = icon4.paper.circle(30, 70, 0).attr('class', 'dot dot-3');
        var dot4 = icon4.paper.circle(35, 100, 0).attr('class', 'dot dot-4');
        var dot4 = icon4.paper.circle(75, 140, 0).attr('class', 'dot dot-5');
        var dot4 = icon4.paper.circle(130, 110, 0).attr('class', 'dot dot-6');
    }
});

jQuery(function($){
    $('[data-toggle="popover"]').popover({
        html: true,
        container: 'body'
    });
});