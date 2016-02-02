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
        var l1 = icon1.paper.line(0,15, 156, 15).attr('stroke-dasharray', '20,40');
        var l2 = icon1.paper.line(0,35, 156, 35).attr('stroke-dasharray', '34,50');
        var l3 = icon1.paper.line(0,60, 156, 60).attr('stroke-dasharray', '31,50');
        var l4 = icon1.paper.line(0,85, 156, 85).attr('stroke-dasharray', '28,50');
        var l5 = icon1.paper.line(0,112, 156, 112).attr('stroke-dasharray', '24.5,50');
        var l6 = icon1.paper.line(0,140, 156, 140).attr('stroke-dasharray', '27,50');
        lineGroup.add(l1,l2,l3,l4,l5,l6);

        var circlePath1 = 'M5 78 A73 73,0 1 0 5 77M110 78A33 33, 0 1 1 110 77Z';
        var circle1 = icon1.paper.path(circlePath1).attr('stroke', 'black').attr('fill', 'red');

        var clip = icon1.paper.el('clipPath',{'id': 'circleClip'});
        // var circle1 = icon1.paper.circle(78, 78, 70);
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
    }
});

jQuery(function($) {
    new LXR.SvgIcon();


    var slideIndicator = undefined,
        layerMove1, layerMove2, layerMove3;
    var animateManager = new LXR.Animate();
    var fp = $('#fullpage').fullpage({
        controlArrows: false,
        slidesNavigation: false,
        animateAnchor: false,
        verticalCentered: false,
        scrollingSpeed: 1200,
        anchors: ['banner', 'secondPage', 'thirdPage', 'fourthPage', 'lastPage'],
        afterRender: function() {
            console.log('afterRender');

            slideIndicator = new LXR.SlideIndicator(1110000, 'banner');

            console.log(LXR.SlideIndicator.getCurrentAnchorLink());

            if (LXR.SlideIndicator.getCurrentAnchorLink() == 'banner' || LXR.SlideIndicator.getCurrentAnchorLink() == 1) {
                console.log();
                slideIndicator.start(LXR.SlideIndicator.getCurrentSlideIndex());
                animateManager.navSlideDownIn();
            }

            //创建层移动
            layerMove1 = new LXR.LayerMove($('.layer-1'), -0.15, document).start();
            layerMove2 = new LXR.LayerMove($('.layer-2'), -0.10, document).start();
            layerMove3 = new LXR.LayerMove($('.layer-3'), -0.05, document).start();

            $('.layer').velocity('transition.bounceIn', {
                duration: 1000,
                stagger: 200,
                delay: 1200,
                display: 'none',
                backwards: true
            });
        },
        afterLoad: function(anchorLink, index) {
            console.log('afterLoad:' + anchorLink + '-' + index);
            var loadedSection = $(this);
            if (anchorLink == 'banner') {
                if (slideIndicator) {
                    slideIndicator.start(LXR.SlideIndicator.getCurrentSlideIndex());
                }


            } else {
                $('.tel').hide();
            }
        },
        onLeave: function(index, nextIndex, direction) {
            console.log('onleave:' + index + '-' + nextIndex + '-' + direction);
            //离开第一屏时，结束层移动句柄，减少不必要的性能开销
            if (index == 1) {
                layerMove1.stop();
                layerMove2.stop();
                layerMove3.stop();
                animateManager.navRightOut();
                if (slideIndicator) {
                    slideIndicator.stop();
                }
                // $('.layer').velocity('transition.bounceOut', {
                //     duration: 1000,
                //     stagger: 200,
                //     display: 'none',
                //     backwards: true
                // });
            }
            //进入第一屏时
            if (nextIndex == 1) {
                layerMove1.start();
                layerMove2.start();
                layerMove3.start();

                animateManager.navRightIn();

                $('.layer').velocity('transition.bounceIn', {
                    duration: 1000,
                    stagger: 200,
                    display: 'none',
                    backwards: true
                });
            }
        },
        onSlideLeave: function(anchorLink, index, slideIndex, direction, nextSlideIndex) {
            console.log('onSlideLeave:' + anchorLink + '-' + index + '-' + slideIndex + '-' + direction + '-' + nextSlideIndex);
            slideIndicator.setIndex(nextSlideIndex);
        },
        afterSlideLoad: function(anchorLink, index, slideAnchor, slideIndex) {
            console.log('afterSlideLoad:' + anchorLink + '-' + index + '-' + slideAnchor + '-' + slideIndex);
            // slideIndicator.setIndex(slideIndex);
        },


    });
});
