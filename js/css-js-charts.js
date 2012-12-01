//по мотивам http://atomicnoggin.ca/blog/2010/02/20/pure-css3-pie-charts/
//document.styleSheets

//прописывать opacity для каждого куска

(function (window) {

    window.Charts = function (container, options) {
        /* constructor */
        this.container = container;
        this.options = options;

        this.standartSettings = {
            "options": {
                "colors": ['#1E9E56', '#48B8E8', '#DB3957', '#EDDE37', '#F0611A'],
                "legend": false,
                "gradientColors": false,
                "radius": 130
            }
        };

        this.transformStyleNames = ['mozTransform', 'webkitTransform', 'oTransform', 'transform'];
        this.gradientPropertyNames = ['-webkit-radial-gradient', '-moz-radial-gradient', '-o-radial-gradient', '-ms-radial-gradient']

        this.pieceGt50 = document.createElement("div");
        this.pieceGt50.classList.add("gt50");
        this.pieceGt50.classList.add("piece");
        for(var j = 0; j < this.transformStyleNames.length; j++) {
            this.pieceGt50.style[this.transformStyleNames[j]] = "rotate(180deg) !important";
        }
    };

    window.Charts.prototype.buildChart = function () {
        var chartContainer = document.createElement("div");
            chartContainer.classList.add("chart");
            chartContainer.style.position = "relative";

        var radius = this.options.options.radius || this.standartSettings.options.radius;
        var widthHeight = (radius * 2).toString();
        //проверить options.parts (наличие, валидность)

        var lastDegree = 0;

        for(var i = 0, j = this.options.parts.length; i < this.options.parts.length; i++, j--) {
            var part = this.options.parts[i];

            var degree = lastDegree;  //угол поворота держателя

            var pt = part.percent / 100;
            var pieceDegree = 360 * pt; //угол поворота кусочка

            lastDegree += pieceDegree;

            //генерация куска
            //обертка
            var pieceHolder = document.createElement("div");
                pieceHolder.classList.add("piece-holder");

            //сам кусочек
            var piece = document.createElement("div");
                piece.classList.add("piece");

            /**/
            piece.addEventListener('click', function (event) {
                console.log(event.target);
            });
            /**/

            //приделываем стили, поворачивающие на нужный градус
            for(var k = 0; k < this.transformStyleNames.length; k++) {
                pieceHolder.style[this.transformStyleNames[k]] = "rotate(" + degree + "deg)";
                piece.style[this.transformStyleNames[k]] = "rotate(" + pieceDegree + "deg)";
            }
            pieceHolder.style.width = widthHeight + "px";
            pieceHolder.style.height = widthHeight + "px";
            pieceHolder.style.clip = "rect(0px," + widthHeight + "px, " + widthHeight + "px, " + radius + "px)";
            pieceHolder.style.position = "absolute";
            piece.style.width = widthHeight + "px";
            piece.style.height = widthHeight + "px";
            piece.style.clip = "rect(0px," + radius + "px, " + widthHeight + "px, 0px)";
            piece.style.position = "absolute";
            piece.style.borderRadius = radius + "px";

            //закрашиваем кусок
            piece.style.backgroundColor = this.options.options.colors[i];
            //piece.style.backgroundColor = HexToRgb(options.options.colors[i]);

            //эксперимент с градиентом
            if(this.options.options.gradient) {
                var disp = this.colorMethods.generateDispersion(this.options.options.colors[i], 2, 90);
                piece.style.background = "-webkit-radial-gradient(center, ellipse cover, " + disp[1].toStyleProperty() + " 10%, " + disp[0].toStyleProperty() + " 100%)";
            }

            pieceHolder.appendChild(piece); //сборка полного блока кусочка

            if(part.percent > 50) {
                pieceHolder.classList.add("gt50");
                pieceHolder.style.clip = "rect(auto, auto, auto, auto)";
                this.pieceGt50.style.width = widthHeight + "px";
                this.pieceGt50.style.height = widthHeight + "px";

                this.pieceGt50.style.backgroundColor = this.options.options.colors[i];
                //pieceGt50.style.backgroundColor = HexToRgb(options.options.colors[i]);
                //эксперимент с градиентом
                //this.pieceGt50.style.background = "-webkit-radial-gradient(center, ellipse cover, rgb(" + this.colorMethods.hexToR(this.options.options.colors[i]) + ", " + (this.colorMethods.hexToG(this.options.options.colors[i]) + 70) + ", " + this.colorMethods.hexToB(this.options.options.colors[i]) +") 0%, rgb(" + this.colorMethods.hexToR(this.options.options.colors[i]) + ", " + (this.colorMethods.hexToG(this.options.options.colors[i]) - 70) + ", " + this.colorMethods.hexToB(this.options.options.colors[i]) +") 100%)";
                if(this.options.options.gradient) {
                    this.pieceGt50.style.background = "-webkit-radial-gradient(center, ellipse cover, " + disp[1].toStyleProperty() + " 10%, " + disp[0].toStyleProperty() + " 100%)";
                }

                this.pieceGt50.style.clip = "rect(0px," + radius + "px, " + widthHeight + "px, 0px)";
                this.pieceGt50.style.borderRadius = radius + "px";

                this.pieceGt50.addEventListener('click', function (event) {
                    console.log(event.target);
                }); //? не срабатывает. разобраться
                pieceHolder.appendChild(this.pieceGt50);
            }

            chartContainer.appendChild(pieceHolder); //приделываем кусочек к контейнеру
            this.container.appendChild(chartContainer);
        }
    };

    window.Charts.prototype.colorMethods = {
        hexToR: function (h) {return parseInt((this.cutHex(h)).substring(0,2),16)},
        hexToG: function (h) {return parseInt((this.cutHex(h)).substring(2,4),16)},
        hexToB: function (h) {return parseInt((this.cutHex(h)).substring(4,6),16)},
        cutHex: function (h) {return (h.charAt(0)=="#") ? h.substring(1,7):h},
        hexToRGB: function (h, opacity) {
            var RGB = new Object({
                R: this.hexToR(h),
                G: this.hexToG(h),
                B: this.hexToB(h)
            });
            if(opacity) RGB.opacity = opacity;

            this._decorateRGBObject(RGB);
            return RGB;
        },
        generateDispersion: function (color, gradations, dispersion) {
            var RGB = this.hexToRGB(color);
            var bla = gradations * dispersion;
            if(bla > 255) {
                throw new Error("Common dispersion great than 255");
            }
            if(RGB.G - bla < 0) RGB.G = bla;
            var generated = [];
            var step = Math.round(((RGB.G + dispersion) - (RGB.G - dispersion)) / gradations);
            for(var i = RGB.G - dispersion; i < RGB.G + dispersion; i += step) {
                var _RGB = new Object({
                    R: RGB.R,
                    G: i,//step * i,//(RGB.G - dispersion * i),
                    B: RGB.B
                });
                this._decorateRGBObject(_RGB);
                generated.push(_RGB);
            }
            return generated;
        },
        _decorateRGBObject: function (RGBObject) {
            Object.defineProperties(RGBObject, {
                "toArray": {
                    value: function () {
                        var rgbArray = [this.R, this.G, this.B];
                        if(this.opacity) rgbArray.push(this.opacity);
                        return rgbArray;
                    },
                    enumerable: false
                },
                "toStyleProperty": {
                    value: function () {
                        var style = this.R + ", " + this.G + ", " + this.B;
                        if(this.opacity) style += ", " + this.opacity;
                        return "rgb(" + style + ")";
                    },
                    enumerable: false
                }
            });
        }
    };

})(window);