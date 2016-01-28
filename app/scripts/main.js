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

function swiperAnimateCache() {
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
    clearSwiperAnimate();
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

function clearSwiperAnimate() {
    for (var allBoxes = window.document.documentElement.querySelectorAll(".ani"), i = 0; i < allBoxes.length; i++) {
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
                        duration: _this.duration * (1-barWidth / totalWidth),
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
        this.index = this.index % this.slideLength;
        //将当前slide之前的指示器标识为结束
        this.slideNav.find('li:lt(' + (this.index) + ')').addClass('ended');
        if (this.index === 0) { //如果当前为第一个slide，则把指示器恢复到开始状态
            this.slideNav.find('li').removeClass('ended');
            this.slideNav.find('li .bar').css('width', '0%');
        }
        var _this = this;
        this.currentSlide = this.slideNav.find('li').eq(this.index);
        this.currentSlide.find('.bar').velocity({
            'width': '100%'
        }, {
            duration: _this.duration,
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
    'stop': function(){
        this.currentSlide.find('.bar').velocity("stop");
    }
});

jQuery(function($) {
    var slideIndicator = undefined;
    var fp = $('#fullpage').fullpage({
        controlArrows: false,
        slidesNavigation: true,
        animateAnchor: false,
        anchors: ['banner', 'secondPage', 'thirdPage', 'fourthPage', 'lastPage'],
        afterRender: function() {
            console.log('afterRender');
            if (slideIndicator === undefined) {
                slideIndicator = new LXR.SlideIndicator(10000, 'banner');
            }
        },
        afterLoad: function(anchorLink, index) {
            console.log('afterLoad:' + anchorLink + '-' + index);
            var loadedSection = $(this);
            if (anchorLink == 'banner') {
                swiperAnimateCache($('.nav')[0]); //隐藏动画元素 
                swiperAnimate($('.nav')[0]); //初始化完成开始动画
                if (slideIndicator === undefined) {
                    slideIndicator = new LXR.SlideIndicator(10000, 'banner');
                }
                var value =  window.location.hash.replace('#', '').split('/');
                var slide = value[1];
                slideIndicator.start(slide || 0);
            } else {
                if (slideIndicator) {
                    slideIndicator.stop();
                }
            }
        },
        onLeave: function(index, nextIndex, direction) {
            console.log('onleave:' + index + '-' + nextIndex + '-' + direction);
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
