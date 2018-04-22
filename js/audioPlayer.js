// 从网站http://www.90lrc.cn/获取.lrc的歌词

/*
	@author:wangzhonglu

	总结：

		技术：
			1、原生JS的ajax异步请求文件；
			2、正则表达式，对string的操作方法；
			3、对dom的增删改查；
			4、对class的增删改查,(classList)；
			5、缓动动画；
			6、使用监听addEventListener；
			7、自定义属性操作data-*,(dataset)；
			8、动画时防止抖动，节流；
			9、封装对象；
			10、字体阴影；
		功能：播放、暂停、下一首、上一首、歌词同步、随机背景、加载提示；

 */ 

function AudioPlayer() {
	this.panelParent = document.querySelector(".lyric-section");
	this.lyricPanel = document.querySelector("#lyrics_content");
	this.loadingAudio = document.querySelector(".loadingAudio");
	this.loadingLyric = document.querySelector(".loadingLyric");
	this.background = document.querySelector(".main");
	this.audio = document.querySelector("audio");
	this.playBtn = document.querySelector(".play");
	this.lastBtn = document.querySelector(".previous");
	this.nextBtn = document.querySelector(".next");
	this.newSrc = "01chengfu";
	this.songs = ["01chengfu","02ganjuezijishijuxing","03weiyenadedongtian","04woleyi"];
	this.bgImg = ["bg1","bg2","bg3","bg4","bg5","bg6","bg7","bg8"];
}

AudioPlayer.prototype = {
	init: function () {
		this.bindEvent();
	},

	// 输入歌名，以ajax获取歌词资源，得到字符串然后处理：
	getLyrics: function (songName) {
					var xhr,that = this; 
					if (!xhr) {
						if (window.XMLHttpRequest) {
						  	xhr = new XMLHttpRequest();
						} else { 
						  	xhr = new ActiveXObject("Microsoft.XMLHTTP");
						}  
					}
					xhr.onreadystatechange = function() {
					  if (xhr.readyState==4 && xhr.status==200) {
					    	// 将标题和内容分开，将时间和歌词分开
					    	var outputArr = that.parseLyrics(xhr.responseText);
					    	//将数组的内容加到HTML上
					    	that.addLyrics(outputArr);
					    }
					  };
					xhr.open("GET","source/" + songName + ".lrc",true);
					xhr.send(null);
				},
	// 解析歌词：将标题和内容分开，将时间和歌词分开
	parseLyrics: function (lyrics) {
						// 把每一句歌词以“回车换行”为界截出并放入数组中
						var dateAndLyricArr = lyrics.split("\r\n");
						// 正则表达式分离出[xx:xx.xx]和歌词两部分，并将没有时间段的前几行分离出来
						var dateRegExp = /\[\d{2}:\d{2}.\d{2}\]/g;
						var dateAndLyricArrLen = dateAndLyricArr.length;
						var headerArr = [];
						var contentArr = [];
						var outputArr = [];
						for (var i = 0; i < dateAndLyricArrLen; i++) {
							var individual = dateAndLyricArr[i];
							if (dateRegExp.test(individual)) {
								//正文部分,已取出每一句的正文
								var lyric = individual.replace(dateRegExp,"");
								var timeStr = individual.match(dateRegExp)[0];
								// 时间字符串截成两个数组：00(分钟) 00.00(秒)
								timeArr = timeStr.slice(1, -1).split(":");
								// time为每一句话播放时的时间
								var time = parseInt(timeArr[0]) * 60 + parseFloat(timeArr[1]);
								//将每一行的时间和歌词绑定在一个数组里，再将这个数组放入内容数组里
								contentArr.push([time,lyric]);
							} else {
								//标题部分
								var headerLineArr = individual.slice(1, -1).split(":");
								var lineheaderStr;
								if (headerLineArr[0] == "ti") {
									lineheaderStr = "歌曲：" + headerLineArr[1];
									headerArr.push(lineheaderStr);
								} else if (headerLineArr[0] == "ar") {
									lineheaderStr = "演唱：" + headerLineArr[1];
									headerLineArr = [lineheaderStr];
									headerArr.push(lineheaderStr);
								}
							}
						}
						//目前已将header部分和content部分分离，下一步将contentArr内的数组按时间从小到大排序；
						contentArr.sort(function (a,b) { return a[0] - b[0]; });
						outputArr.push(headerArr,contentArr);
						return outputArr;
				 },

	// 将总的歌词数组传入函数内，在函数内添加到ul.lyrics_content里：
	addLyrics: function (lyricsArr) {	
					//先遍历header数组，再遍历content数组
					var headerArr = lyricsArr[0];
					var contentArr = lyricsArr[1];
					var domStr = "";
					for (var i in headerArr) {
						 domStr += "<li>" + headerArr[i] + "</li>";
					}
				    for (var j in contentArr) {
				    	var lineContentArr = contentArr[j];
				    	domStr += "<li class='changeColor' data-time=" + lineContentArr[0] + ">" + lineContentArr[1] + "</li>";
					}
					this.loadingLyric.classList.add("hiddenNone");
					this.lyricPanel.classList.remove("hiddenNone");
					this.lyricPanel.innerHTML = domStr;
				},

	// 找到数组li.changeColor并让data-time和currentTime对比，返回当前active的li
	currentLine: function (currentTime) {
					var changeLinsArr = document.querySelectorAll(".changeColor");
					var changeLinsArrLen = changeLinsArr.length;
					var liDom;
					for (var i = 0; i < changeLinsArrLen; i++) {
						liDom = changeLinsArr[i];
						var liDomTime = liDom.dataset.time;
						if (liDomTime <= currentTime && (i + 1) < changeLinsArrLen) {
							var liDomNext = changeLinsArr[i + 1];
							var liDomNextTime = liDomNext.dataset.time;
							if (currentTime < liDomNextTime) {
								this.setArrClass(changeLinsArr,"active","changeColor");
								//当前行添加active变色
								liDom.classList.add("active");
								return liDom;
							}
						}
						if (i == (changeLinsArrLen - 1) && liDomTime <= currentTime) {
							this.setArrClass(changeLinsArr,"active","changeColor");
							//表明这是最后一行
							liDom.classList.add("active");
							return liDom;
						}
					}
				},

	// 清理domArr上的class并添加class
	setArrClass: function (domArr,removeClass,addClass) {
					for (var i = 0; i < domArr.length; i++) {
						var dom = domArr[i];
						dom.classList.remove(removeClass);
						dom.classList.add(addClass);
					}
			   },

	// 让歌词自动滑动，active始终显示在最中间
	lyricsScroll: function (currentDom) {
						if (currentDom) {
								// 距离父元素顶部位置并判断当前行是否低于中间位置
								var distanceToTop = currentDom.offsetTop;
								var ulDom = this.lyricPanel;
								var lyricSectionDom = this.panelParent;
								var centerLine = lyricSectionDom.offsetHeight / 2;
								if (centerLine <= distanceToTop) {
									this.animatePanel(ulDom,centerLine - distanceToTop);
								}
						  }
				   },

	// 缓动动画 obj是运动的对象 target是要运动的距离
	animatePanel: function (obj,target) {
						// 防抖动
						if (obj.run) {
							return;
						}
						obj.run = true;
						obj.timer = setInterval(function() {
							var step = (target - obj.offsetTop) / 5;
							step = step > 0 ? Math.ceil(step):Math.floor(step);
							if (Math.abs(step) > 1) {
								obj.style.top = obj.offsetTop + step + "px";
							}
							else {
								obj.style.top = target + "px";
								clearInterval(obj.timer);
								obj.run = false;
							}
						},30);
				},

	// 生成随机背景
	randomBgImg: function (bgArr) {
					var random = parseInt(Math.random() * bgArr.length);
					var mainDom = this.background;
					var oldImg = mainDom.dataset.bg;
					var newImg = bgArr[random];
					if (oldImg == newImg) {
						this.randomBgImg(bgArr);
					} else {
						mainDom.dataset.bg = newImg;
						mainDom.style.backgroundImage = "url(images/" + newImg + ".jpg)";
					}
				},

	// 绑定监听事件
	bindEvent: function () {
					var that = this;
					var audio = that.audio;

					// 监听播放按钮
					that.playBtn.addEventListener("click",function() {
						that.playState();
					},false);

					// 监听next按钮
					that.nextBtn.addEventListener("click",function() {
						that.nextSong(that.songs,1);
					},false);

					// 监听previous按钮
					that.lastBtn.addEventListener("click",function() {
						that.nextSong(that.songs,-1);
					},false);

					// 监听当前播放时间
					audio.addEventListener("timeupdate",function() {
						if (audio.currentTime == 0) {
							var ulDom = that.lyricPanel;
							clearInterval(ulDom.timer);
							ulDom.run = false;
							ulDom.style.top = "0px";
						}
						that.lyricsScroll(that.currentLine(audio.currentTime));
						var DValue = Math.abs(audio.currentTime - audio.duration);
						if (DValue <= 1) {
							that.playBtn.className = "";
							that.playBtn.className = "play";
							that.nextSong(that.songs,1);
						}
					},false);

					// 因缓冲而暂停时调用
					audio.addEventListener("waiting",function() {
						that.lyricPanel.classList.add("hiddenNone");
						that.loadingAudio.classList.remove("hiddenNone");
					},false);

					// 缓冲完成时调用
					audio.addEventListener("canplay",function() {
						that.loadingAudio.classList.add("hiddenNone");
						that.loadingLyric.classList.remove("hiddenNone");
						that.getLyrics(that.newSrc);
					},false);
					
					// 有时canplay不会调用，备用
					audio.addEventListener("canplaythrough",function() {
						that.loadingAudio.classList.add("hiddenNone");
						that.loadingLyric.classList.remove("hiddenNone");
						that.getLyrics(that.newSrc);
					},false);

					// 监听窗口变化
					window.addEventListener("resize",function () {
						that.lyricsScroll(that.currentLine(audio.currentTime));
					},false);
				},

	// 获取audio上的data-src并重新设置data-src,然后返回最新src
	// order:1=>下一个；-1=>上一个
	getDataSrc: function (dom,srcArr,order) {
					var src = dom.dataset.src;
					for(var index in srcArr) {
						if (src === srcArr[index]) {
							var num = order + parseInt(index);
							var maxIndex = srcArr.length - 1;
							index = num < 0 ? maxIndex : (num % srcArr.length);
							src = srcArr[index];
							dom.dataset.src = src;
							return src;
						}
					}
				 },

	// 判断播放按钮的状态
	playState: function playState() {
					var that = this;
					if (that.audio.paused) {
						that.playBtn.className = "";
						that.playBtn.className = "pause";
						that.audio.play();
					} else {
						that.playBtn.className = "";
						that.playBtn.className = "play";
						that.audio.pause();
					}
				},

	// 播放下一首
	nextSong: function (sourceArr,order) {
					var that = this;
					that.randomBgImg(that.bgImg);
					var newSrc = that.getDataSrc(that.audio,sourceArr,order);
					this.newSrc = newSrc;
					that.audio.src = "source/" + newSrc + ".mp3";
					that.audio.currentTime = 0;
					that.playState();
					that.audio.play();
				},
};
