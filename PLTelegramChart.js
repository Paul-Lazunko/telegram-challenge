class PLTelegramChart {
  constructor (options) {
    this.defaults = {
      color: '#333',
      exceptionKeys: [
        'x'
      ],
      months: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ],
      days: [
        'Sun',
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat'
      ],
      canvas: {
        width: 600,
        height: 400,
        darkMode: false,
        controlsWidth: 6
      }
    };
    this.formatData(options.data);
    this.chart = options.chart || this.defaults.canvas;
    this.index = options.index || 0;
    this.touches = [];
    this.points = {};
    this.parentElementId = options.parentElementId;
    this.checkBoxes = Object.keys(this.data);
    this.excludedKeys = [];
    this._markers = { start: 0, end: 1 };
    this.setStrategies();
    this.overrideMethodsForExcludedKeys();
  }

  set markers ( value ) {
    this._markers = value;
    this.draw();
  }

  get markers () {
    return this._markers;
  }

  set darkMode (v) {
    this.chart.darkMode = v;
    this.setStyles();
    this.draw();
  }

  get darkMode () {
    return this.chart.darkMode;
  }

  draw() {
    this.setBackground();
    this.drawChart();
    this.drawDates();
  }

  overrideMethodsForExcludedKeys() {
    Object.defineProperty(this.excludedKeys, 'push', {
      enumerable: false,
      value: (v) => {
        Array.prototype.push.apply( this.excludedKeys, [v] );
        this.draw();
        this.showPoint();
      }
    });
    Object.defineProperty(this.excludedKeys, 'splice', {
      enumerable: false,
      value: (start, length) => {
        Array.prototype.splice.apply( this.excludedKeys, [start, length] );
        this.draw();
        this.showPoint();
      }
    });
  };

  set chartData(data){
    this.previouseState = Object.assign({}, this._chartData);
    this._chartData = data;
  }

  get chartData(){
    return this._chartData;
  }

  setStrategies () {
    let base = this.chart.width;
    let k = ( this.chart.controlsWidth * 2 ) / base;
    this.strategies = {};
    this.strategies.growLeft = (e) => {
      let x = this.getXAcrossEvents(e);
      this.growLeft(x);
    };
    this.strategies.growRight = (e) => {
      let x = this.getXAcrossEvents(e);
      this.growRight(x);
    };
    this.strategies.move = (e) => {
      let x = this.getXAcrossEvents(e);
      this.move(x);
    }
  }

  growLeft (x) {
    let element = document.getElementById(`control_${this.index}`);
    if(element && (x > 0 && this.markers.end > this.markers.start +0.2 || x < 0 && this.markers.start > 0.04)){
      let width = element.style.width;
      let ml = element.style.marginLeft;
      element.style.width = parseInt(width, 10) - x + 'px';
      element.style.marginLeft = parseInt(ml, 10) + x + 'px';
      element.style.backgroundPosition = `left ${this.chart.width - parseInt(element.style.marginLeft,10)}px top`;
    }
    this.calculate();
  }

  growRight (x) {
    let element = document.getElementById(`control_${this.index}`);
    if(element && (x < 0 && this.markers.end > this.markers.start +0.2 || x > 0 && this.markers.end < 1) ){
      let width = element.style.width;
      element.style.width = parseInt(width, 10) + x + 'px';
    }
    this.calculate();
  }

  move(x){
    let element = document.getElementById(`control_${this.index}`);
    if(element && (x > 0 && this.markers.end < 1 || x < 0 && this.markers.start > 0.04)){
      let ml = element.style.marginLeft;
      element.style.marginLeft = parseInt(ml, 10) + x + 'px';
      element.style.backgroundPosition = `left ${this.chart.width - parseInt(element.style.marginLeft,10)}px top`;
    }
    this.calculate();
  }

  calculate () {
    let control = document.getElementById(`control_${this.index}`),
      cr = control.getBoundingClientRect(),
      offset = 20,
      base = this.chart.width,
      start = cr.left/base,
      end = (cr.left + cr.width - offset)/base;
    this.markers =  { start, end };
    this.showPoint();
  }

  getStrategy (e) {
    let control = document.getElementById(`control_${this.index}`);
    let data = control.getBoundingClientRect();
    let x = e.clientX || e.changedTouches[0].clientX;
    if ( x > data.left && x < data.left + data.width ) {
      let perCentWidth = (x - data.left)/data.width;
      let k = 40 / this.chart.width;
      if ( perCentWidth < k ) {
        return this.strategies.growLeft;
      } else if ( perCentWidth > 1 - k ) {
        return this.strategies.growRight;
      } else {
        return this.strategies.move;
      }
    }

  }

  getXAcrossEvents (e) {
    let x = e.movementX;
    if ( !x && x !== 0) {
      let touch = event.touches[0] || event.changedTouches[0];
      x = this.x ? touch.clientX - this.x : 0;
      this.x = touch.clientX;
    }
    return x;
  }

  formatData (options) {
    let data = {};
    options.columns.map(column => {
      let key = column.splice(0,1)[0];
      data[key] = {
        data: column,
        color: options.colors[key] || this.defaults.color,
        type: options.types[key]
      }
    });
    this.data = data;
  }

  getCheckBoxesTemplate () {
    let template = '';
    this.checkBoxes.map(checkBox => {
      if(!this.defaults.exceptionKeys.includes(checkBox)){
        template += `<style>
        #checkbox_${checkBox}_${this.index}:checked + label {
            background-color: ${this.data[checkBox].color};
            border-color: ${this.data[checkBox].color};
        }
        </style>
        <div class="round">
          <input id="checkbox_${checkBox}_${this.index}" type="checkbox" checked="${!this.excludedKeys.includes(checkBox)}">
          <label for="checkbox_${checkBox}_${this.index}"></label>
          <span>${checkBox}</span>
        </div>`
      }
    });
    return template;
  }

  getStyles () {
    return `<style id="style_${this.index}">

        #Chart_${this.index}.chart {
            margin: 20px 0;
            width: ${this.chart.width}px;
            background-color: ${this.chart.darkMode ? '#111' : '#fff'};
            padding: 20px;
        }
        
        .hline {
            width: 100%;
            height: ${this.chart.height/5}px;
            line-height: ${this.chart.height/5}px;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #666;
        }
        
        #hlinesHolder_${this.index} {
            margin-bottom: -${this.chart.height}px;
            height: ${this.chart.height}px;
            width: ${this.chart.width}px;
        }
        #Chart_${this.index} .range {
            height: 40px;
            background: ${this.chart.darkMode ? '#111' : '#fff'};
            cursor: move;
            border: 1px solid ${this.chart.darkMode ? '#bbb' : '#444'};
            box-sizing: border-box;
            z-index:8;
            opacity: 0.25;
        }
        #control_${this.index} {
            height: 40px;
            opacity: 1;
            float: left;
            cursor: move;
            z-index: 10;
            margin-top: -41px;
            border: 1px solid ${this.chart.darkMode ? '#bbb' : '#444'};
        }

        #Chart_${this.index} .round {
            position: relative;
            display: inline-block;
            width: auto;
            border-radius: 20px;
            border: 1px solid ${this.chart.darkMode ? '#333' : '#ccc'};
            padding: 10px;
            height: 24px;
        }
        #Chart_${this.index} .checkboxHolder {
            margin-top: 18px;
        }

        #Chart_${this.index} .round label {
            background-color: ${this.chart.darkMode ? '#111' : '#fff'};
            border: 1px solid ${this.chart.darkMode ? '#333' : '#ccc'};
            border-radius: 50%;
            cursor: pointer;
            height: 28px;
            left: 7px;
            position: absolute;
            top: 7px;
            width: 28px;
        }

        #Chart_${this.index} .round label:after {
            border: 2px solid ${this.chart.darkMode ? '#fff' : '#111'};
            border-top: none;
            border-right: none;
            content: "";
            height: 6px;
            left: 7px;
            opacity: 0;
            position: absolute;
            top: 8px;
            transform: rotate(-45deg);
            width: 12px;
        }
        #Chart_${this.index} .round input[type="checkbox"] {
            visibility: hidden;
        }

        #Chart_${this.index} .round input[type="checkbox"]:checked + label:after {
            opacity: 1;
        }
        #Chart_${this.index} .round span {
            display: inline-block;
            min-width: 40px;
            margin-left: 10px;
            line-height: 24px;
            color: ${this.chart.darkMode ? '#eee': '#333'}
        }  
         #Chart_${this.index} #switcher_${this.index} {
            float: right;
        } 
        #Chart_${this.index} #dates_holder_${this.index} {
            width: ${this.chart.width}px;
            height: 20px; 
        }   
        #Chart_${this.index} #pointShower_${this.index} {
            position: absolute;
            background: ${this.chart.darkMode ? '#333': '#eee'};
            border-radius: 10px;
            border: 1px solid ${this.chart.darkMode ? '#eee': '#333'};
            width: 100px;
            padding: 10px;
        }  
        #pointShower_${this.index} .date {
            font-weight: bold;
            color: ${this.chart.darkMode ? '#eee': '#333'}
        }
        #pointShower_${this.index} .date {
            font-weight: bold;
            color: ${this.chart.darkMode ? '#eee': '#333'}
        } 
        #verticalLine_${this.index} {
            display: none;
            position: absolute;
            width: 1px;
            height: ${this.chart.height}px;
            margin-top: -${this.chart.height + 66}px;
            background-color: ${this.chart.darkMode ? '#eee': '#333'}
        }
        #pointsHolder_${this.index} {
            position: absolute;
            width: 8px;
            height: ${this.chart.height}px;
            margin-top: -${this.chart.height + 66}px;
             z-index: 10;

        }
        #linesHolder_${this.index} {
            height: ${this.chart.height}px;
            width: ${this.chart.width}px;
            margin-top: -${this.chart.height}px;
            opacity: 0.5;
            z-index: 2;
        }
    </style>`

  }

  setStyles () {
    let parent = document.getElementById(this.parentElementId);
    let oldStyle = document.getElementById(`style_${this.index}`);
    if ( parent ) {
      this.styles = document.createElement('template');
      this.styles.innerHTML = this.getStyles();
      oldStyle ? parent.replaceChild(this.styles.content, oldStyle) : parent.appendChild(this.styles.content);
    }
  }

  getTemplate () {
    return `<div class="chart" id="Chart_${this.index}">
                <div id="hlinesHolder_${this.index}">
                <div id="hline_${this.index}_0" class="hline"></div>
                <div id="hline_${this.index}_1" class="hline"></div>
                <div id="hline_${this.index}_2" class="hline"></div>
                <div id="hline_${this.index}_3" class="hline"></div>
                <div id="hline_${this.index}_4" class="hline"></div>
                </div>
                <canvas id="chart_${this.index}" width="${this.chart.width}" height="${this.chart.height}">
                </canvas>
                <div id="dates_holder_${this.index}"></div><div>
                <div class="range" id="range_${this.index}" style="width: ${this.chart.width}px;"></div>
                </div>
                <div id="control_${this.index}" style="width: ${Math.round(this.chart.width/2)}px; margin-left: ${Math.round(this.chart.width/4)}px"></div>
                <div id="verticalLine_${this.index}"></div>
                <div id="pointsHolder_${this.index}"></div>
                <div id="pointShower_${this.index}"></div>
                <div class="checkboxHolder">
                   ${this.getCheckBoxesTemplate()}
                   <div class="round" id="switcher_${this.index}">
                    <input id="checkbox_mode_${this.index}" type="checkbox" checked="${this.darkMode}">
                      <label for="checkbox_mode_${this.index}"></label>
                      <span>Dark mode</span>
                  </div>
                </div>
            </div>`
  }

  getPointTemplate (data) {
    let content =  '<div>'
    for ( let key in data ) {
      switch(key) {
        case 'left':
          break;
        case 'top':
          break;
        case 'x':
          let v = new Date(data[key]);
          content += `<div class="date">${this.defaults.days[v.getDay()]}, ${v.getDate()} ${this.defaults.months[v.getMonth()]}</div>`;
          break;
        default:
          content += `<div style="color: ${this.data[key].color}">${data[key]}</div>`;
          break;
      }
    }
    content +=  '</div>';
    return content;
  }

  drawDates() {
    let target = document.getElementById(`dates_holder_${this.index}`);
    let canvas = document.createElement('canvas');
    let { start, end } = this.markers;
    let Start = Math.floor(start * this.data['x'].data.length);
    let End = Math.ceil(end * this.data['x'].data.length);
    let xData = this.data['x'].data;
    let kx = this.chart.width / (End - Start);
    let width = kx * xData.length ;
    canvas.height = 20;
    canvas.width = width;
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if ( this.chart.darkMode ) {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.fillStyle = this.chart.darkMode ? '#eee' : '#333';
    let l = xData.length, diff = End - Start;
    let textY = Math.round(canvas.height * 2/3);
    for ( let i = Start; i <= End; i++ ) {
      let k = Math.round(this.chart.width / 40);
      if ( diff > k &&  !( i % Math.ceil(diff/k) ) || diff <= k ) {
        let value = new Date(xData[i]);
        ctx.fillText(`${value.getDate()} ${this.defaults.months[value.getMonth()]}`, kx * i, textY);
      }
    }
    target.style.background = `url(${canvas.toDataURL()})`;
    target.style['background-position'] = `left ${canvas.width * (1 - start)}px top`;
    // let lc = document.getElementById(`leftControl_${this.index}`);
    // lc.innerText = '';
    // if ( parseInt(lc.style.width, 10) >= 70 ) {
    //   lc.innerText = `from ${new Date(xData[Start]).getDate()} ${this.defaults.months[new Date(xData[Start]).getMonth()]}`;
    // }
    // let rc = document.getElementById(`rightControl_${this.index}`);
    // rc.innerText = '';
    // if ( parseInt(rc.style.width, 10) >= 70 ) {
    //   rc.innerText = `to ${new Date(xData[End]).getDate()} ${this.defaults.months[new Date(xData[End]).getMonth()]}`;
    // }
  }

  drawChart() {
    let
      canvas = document.getElementById(`chart_${this.index}`),
      ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let Max = [], Min = [];
    for ( let key in this.data ) {
      if ( ! this.defaults.exceptionKeys.includes(key) && !this.excludedKeys.includes(key)) {
        let { start, end } = this.markers;
        start = Math.round(start * this.data[key].data.length);
        end = Math.round(end * this.data[key].data.length);
        let yData = this.data[key].data.slice(start, end);
        let max = Math.max.apply(null, yData);
        let min = Math.min.apply(null, yData);
        Max.push(max);
        Min.push(min);
      }
    }

    let max = Math.max.apply(null, Max);
    let min = Math.min.apply(null, Min);
    let d = Math.round(canvas.height / 5);
    if ( Object.keys(this.data).length >  this.excludedKeys.length  + this.defaults.exceptionKeys.length) {
      for ( let key in this.data ) {
        if ( ! this.defaults.exceptionKeys.includes(key) && ! this.excludedKeys.includes(key)) {
          let ky = canvas.height / (max - min );
          let { start, end } = this.markers;
          start = Math.round(start * this.data[key].data.length);
          end = Math.round(end * this.data[key].data.length);
          let points = [];
          let yData = this.data[key].data.slice(start, end);
          let xData = this.data['x'].data.slice(start, end);
          let kx = canvas.width / xData.length;
          for (let i=0; i < yData.length; i++ ){
            let point = {
              x:  Math.round(kx * i),
              y:  (canvas.height - Math.round(ky * (yData[i] - min)))
            };
            points.push(point);
          }
          this.points[key] = points;
          ctx.strokeStyle = this.data[key].color;
          ctx.lineWidth = 1;
          ctx.moveTo(points[0].x, points[0].y);
          ctx.beginPath();
          if ( points.length < Math.round(this.chart.width / 20) ) {
            for ( let j = 0; j < points.length; j++ ) {
              ctx.lineTo(Math.round(points[j].x - kx/2), Math.round(points[j].y));
              ctx.lineTo(Math.round(points[j].x + kx/2), Math.round(points[j].y));
            }
          } else {
            for ( let j = 0; j < points.length; j++ ) {
              ctx.lineTo(Math.round(points[j].x), Math.round(points[j].y));
            }
          }
          ctx.lineTo(this.chart.width, points[points.length - 1].y);
          ctx.stroke();
          ctx.closePath();
        }
      }
      for ( let i =0; i < 5; i++ ){
        let l = document.getElementById(`hline_${this.index}_${i}`);
        l.innerHTML = Math.round(max * (5-i)/5).toString();
      }

    }
  }

  getChartData() {

    let _Max = [], _Min = [], Max = {}, Min = {}, yData = {}, points = {}, { start, end } = this.markers;
    for ( let key in this.data ) {
      if ( ! this.defaults.exceptionKeys.includes(key) && !this.excludedKeys.includes(key)) {
        let Start = Math.round(start * this.data[key].data.length);
        let End = Math.round(end * this.data[key].data.length);
        yData[key] = this.data[key].data.slice(Start, End);
        let max = Math.max.apply(null, yData[key]);
        let min = Math.min.apply(null, yData[key]);
        Max[key] = Max[key] || [];
        Min[key] = Min[key] || [];
        Max[key].push(max);
        Min[key].push(min);
        _Max.push(max);
        _Min.push(min);
        points[key] = [];
      }
    }
    let max = Math.max.apply(null, _Max);
    let min = Math.min.apply(null, _Min);
    let xData = this.data['x'].data.slice(Math.round(start * this.data.x.data.length), Math.round(end * this.data.x.data.length));
    let kx = this.chart.width / xData.length;
    if ( Object.keys(this.data).length >  this.excludedKeys.length  + this.defaults.exceptionKeys.length) {
      for ( let key in this.data ) {
        if ( ! this.defaults.exceptionKeys.includes(key) && ! this.excludedKeys.includes(key)) {
          let ky = this.chart.height / (max - min);
          for (let i=0; i < yData[key].length; i++ ){
            let point = {
              x:  Math.round(kx * i),
              y:  (this.chart.height - Math.round(ky * (yData[key][i] - min)))
            };
            points[key].push(point);
          }
        }
      }
    }
    this.chartData =  { points, Min, Max, _Min, _Max };
  }

  showPoint(data) {
    let pointShower = document.getElementById(`pointShower_${this.index}`);
    if ( data && Object.keys(data).length > 3 ) {
      pointShower.style.top = data.top - 20 + 'px';
      let template = document.createElement('template');
      template.innerHTML = this.getPointTemplate(data);
      pointShower.innerHTML = '';
      pointShower.append(template.content);
      let br = pointShower.getBoundingClientRect();
      pointShower.style.left = data.left + br.width/4 + 'px';
      pointShower.style.display = 'block';
    } else {
      pointShower.innerHTML = '';
      pointShower.style.display = 'none';
    }

  }

  drawBackground() {
    let canvas = document.createElement('canvas');
    canvas.width = this.chart.width;
    canvas.height = 40;
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = this.chart.darkMode ? '#111' : '#fff';
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fill();
    let Max = [], Min = [];
    if ( Object.keys(this.data).length >  this.excludedKeys.length  + this.defaults.exceptionKeys.length ) {
      for (let key in this.data) {
        if (! this.defaults.exceptionKeys.includes(key) && !this.excludedKeys.includes(key)) {
          let max = Math.max.apply(null, this.data[key].data);
          let min = Math.min.apply(null, this.data[key].data);
          Max.push(max);
          Min.push(min);
        }
      }
      for (let key in this.data) {
        if (!this.defaults.exceptionKeys.includes(key) && !this.excludedKeys.includes(key)) {
          let max = Math.max.apply(null, Max);
          let min = Math.min.apply(null, Min);
          let ky = canvas.height / (max - min) * 0.9;
          let points = [];
          let yData = this.data[key].data;
          let xData = this.data['x'].data;
          let kx = canvas.width / xData.length;
          this.kx = kx;
          for (let i = 0; i < yData.length; i++) {
            let point = {
              x: Math.round(kx * i),
              y: canvas.height - Math.round(ky * (yData[i] - min))
            };
            points.push(point);
          }
          ctx.strokeStyle = this.data[key].color;
          ctx.lineWidth = 1;
          ctx.moveTo(points[0].x, points[0].y);
          ctx.beginPath();
          for ( let j = 0; j < points.length; j++ ) {
            ctx.lineTo(points[j].x, points[j].y);
          }
          ctx.stroke();
          ctx.closePath();
        }
      }
    }
    return canvas.toDataURL();
  }

  setBackground () {
    let data = this.drawBackground();
    let target = document.getElementById(`range_${this.index}`);
    let target2 = document.getElementById(`control_${this.index}`);
    target.style.background = `url(${data})`;
    target2.style.background = `url(${data}) `;
    target2.style.backgroundColor = `none`;
    target2.style['background-position'] = `left ${Math.round(this.chart.width * (1 - this.markers.start)) + 28}px top`;
  }

  initEvents() {
    let target = document.getElementById(`range_${this.index}`), self = this;
    target.addEventListener('mousedown', function(e){
      e.preventDefault();
      let strategy = self.getStrategy(e);
      if ( strategy ) {
        target.addEventListener('mousemove', strategy );
        target.addEventListener('mouseup', (e) => {
          target.removeEventListener('mousemove', strategy);
        });
        target.addEventListener('mouseleave', (e) => {
          target.removeEventListener('mousemove', strategy);
        });
      }
    });
    target.addEventListener('touchstart', function(e){
      let strategy = self.getStrategy(e);
      if ( strategy ) {
        target.addEventListener('touchmove', strategy );
        target.addEventListener('touchend', (e) => {
          self.x = false;
          target.removeEventListener('touchmove', strategy);
        });
      }
    });
    this.checkBoxes.map(checkBox => {
      let chbx = document.getElementById(`checkbox_${checkBox}_${this.index}`);
      if ( chbx ) {
        let checked = true;
        chbx.addEventListener('change', function(e){
          if( checked ) {
            self.excludedKeys.push(checkBox);
          } else {
            self.excludedKeys.splice(self.excludedKeys.indexOf(checkBox),1);
          }
          checked = !checked;
        })
      }
    });
    let modeSwitcher = document.getElementById(`checkbox_mode_${this.index}`);
    modeSwitcher.addEventListener('change', function (e) {
      self.darkMode =  ! self.darkMode;
      this.setAttribute('checked', self.darkMode.toString() )
    });
    let canvas = document.getElementById(`chart_${this.index}`);
    let line = document.getElementById(`verticalLine_${this.index}`);
    line.style.display = 'none';
    let pointsHolder = document.getElementById(`pointsHolder_${this.index}`);
    canvas.addEventListener('mouseenter', function(e) {
      line.style.display = "block";
      pointsHolder.style.display = "block";
    });
    let mouseLeave = function(e) {
      let checkX = e.pageX < canvas.offsetLeft || e.pageX > canvas.offsetLeft + canvas.width;
      let checkY = e.pageY < canvas.offsetTop || e.pageY > canvas.offsetTop + canvas.height;
      if ( checkX || checkY || e.changedTouches) {
        line.style.display = "none";
        pointsHolder.style.display = "none";
        self.showPoint()
      }
    };
    canvas.addEventListener('mouseleave', mouseLeave);
    pointsHolder.addEventListener('mouseleave', mouseLeave);
    pointsHolder.addEventListener('touchend', mouseLeave);
    canvas.addEventListener('touchend', mouseLeave);
    let previousY = {};
    canvas.addEventListener('mousemove', function(e) {
      if ( e.movementX ) {
        let x = e.clientX;
        let X = e.clientX - canvas.offsetLeft;
        let { start, end } = self.markers;
        let k = X / canvas.width * (end - start);
        let k2 = X / canvas.width * (end - start) + start;
        let g = self.data.x.data.length * k;
        let index =  Math.round(g);
        let Index = Math.round(k2*self.data['x'].data.length);
        let data = { left: x + 30, top: e.offsetY + canvas.offsetTop };
        data['x'] = self.data['x'].data[Index];
        pointsHolder.innerHTML = '';
        for ( let key in self.points ) {
          let show = index > 0 && index < self.points[key].length - 1;
          if (! self.excludedKeys.includes(key) && show ) {
            if (  key !== 'x' ) {
              data[key] = self.data[key].data[Index];
              let element = document.createElement('span');
              element.style.width = '20px';
              element.style.boxSizing = 'border-box';
              element.style.height = '20px';
              element.style.borderRadius = '100%';
              element.style.border = `2px solid ${self.data[key].color}`;
              element.style.position = `absolute`;
              let ik = previousY[key] ? (previousY[key] +11 - self.points[key][index].y) * (g%1) : 0;
              element.style.top = self.points[key][index].y + ik -11 + 'px';
              element.style.left = '-11px';
              element.style.background = self.chart.darkMode ? '#111': '#eee';
              previousY[key] = self.points[key][index].y - 11;
              pointsHolder.appendChild(element);
            }
          }
        }
        line.style.left = x + 'px';
        pointsHolder.style.left = x  + 'px';
        self.showPoint(data);
      }
    });
    canvas.addEventListener('touchmove', function(e) {
      e.preventDefault();
      line.style.display = "block";
      pointsHolder.style.display = "block";
      let touch = event.touches[0] || event.changedTouches[0];
      let x = touch.clientX - canvas.offsetLeft;
      let y = touch.clientY;
      let Y = touch.pageY;
      let { start, end } = self.markers;
      let k = x / canvas.width * (end - start);
      let k2 = x / canvas.width * (end - start) + start;
      let g = self.data.x.data.length * k;
      let index =  Math.round(g);
      let Index = Math.round(k2*self.data['x'].data.length);
      let data = { left: x + 120, top: Y };
      data['x'] = self.data['x'].data[Index];
      pointsHolder.innerHTML = '';
      for ( let key in self.points ) {
        let show = index > 0 && index < self.points[key].length - 1;
        if (! self.excludedKeys.includes(key) && show ) {
          if (  key !== 'x' ) {
            data[key] = self.data[key].data[Index];
            let element = document.createElement('span');
            element.style.width = '20px';
            element.style.boxSizing = 'border-box';
            element.style.height = '20px';
            element.style.borderRadius = '100%';
            element.style.border = `2px solid ${self.data[key].color}`;
            element.style.position = `absolute`;
            element.style.top = self.points[key][index].y - 11 + 'px';
            element.style.left = '-11px';
            element.style.background = self.chart.darkMode ? '#111': '#eee';
            previousY[key] = self.points[key][index].y - 11;
            pointsHolder.appendChild(element);
          }
        }
      }
      line.style.left = x + 30 + 'px';
      pointsHolder.style.left = x + 30 + 'px';
      if ( Object.keys(data).length > 3) {
        self.showPoint(data);
      } else {
        line.style.display = "none";
        pointsHolder.style.display = "none";
        self.showPoint()
      }
    });
  }

  render () {
    let parent = document.getElementById(this.parentElementId);
    if ( parent ) {
      this.template = document.createElement('template');
      this.template.innerHTML = this.getTemplate();
      this.setStyles();
      parent.appendChild(this.template.content);
      this.calculate();
      this.initEvents();
      this.setBackground();
      this.draw();
    }
  }

  drawSVG(){
    this.getChartData();
    let svg = document.getElementById(`svg_${this.index}`);
    svg.innerHTML = ''
    for ( let key in this.chartData.points) {
      if ( ! this.defaults.exceptionKeys.includes(key) && ! this.excludedKeys.includes(key)) {
        svg.appendChild(this.getPopyline(key))
      }
    }
    this.drawDates()
  }

  getPopyline(key){
    let polyline = document.createElementNS("http://www.w3.org/2000/svg", 'polyline');
    polyline.setAttribute("points", this.chartData.points[key].map(point => point.x + ',' + point.y).join(' '));
    polyline.setAttribute("id", `polyline_${this.index}_${key}`);
    polyline.setAttribute("fill", 'none');
    polyline.setAttribute("stroke", this.data[key].color);

    return polyline;
  }

  static factory (data, options) {
    data.map((item, index) => {
      return new PLTelegramChart({
        index,
        parentElementId: options.parentElementId,
        data: item,
        chart: {
          darkMode: options.chart.darkMode,
          width: options.chart.width,
          height: options.chart.height,
          controlsWidth: options.chart.controlsWidth
        }
      })
        .render()
    })
  }

};
