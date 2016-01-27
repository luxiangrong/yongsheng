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


jQuery(function($) {
    $('#fullpage').fullpage({
    	controlArrows: false,
    	anchors: ['banner', 'secondPage', 'thirdPage', 'fourthPage', 'lastPage'],
    	afterLoad: function(anchorLink, index){
            var loadedSection = $(this);
            if(anchorLink == 'banner'){
                swiperAnimateCache($('.nav')[0]); //隐藏动画元素 
    			swiperAnimate($('.nav')[0]); //初始化完成开始动画
            }
        }
    });
});
