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
    this.lastX = 0;
    this._markers = { start: 0, end: 1 };

    this.setStrategies();
    this.overrideMethodsForExcludedKeys();
  }

  set markers ( value ) {
    this._markers = value;
    this.drawChart();
  }

  get markers () {
    return this._markers;
  }

  set darkMode (v) {
    this.chart.darkMode = v;
    this.setStyles();
    this.drawBackground();
    this.drawChart();
  }

  get darkMode () {
    return this.chart.darkMode;
  }

  overrideMethodsForExcludedKeys() {
    Object.defineProperty(this.excludedKeys, 'push', {
      enumerable: false,
      value: (v) => {
        Array.prototype.push.apply( this.excludedKeys, [v] );
        this.drawChart();
        this.drawBackground();
        this.showPoint();
      }
    });
    Object.defineProperty(this.excludedKeys, 'splice', {
      enumerable: false,
      value: (start, length) => {
        Array.prototype.splice.apply( this.excludedKeys, [start, length] );
        this.drawChart();
        this.drawBackground();
        this.showPoint();
      }
    });
  };

  setStrategies () {
    let base = this.chart.width;
    let k = (this.chart.controlsWidth*2)/base;
    this.strategies = {};
    this.strategies[`rightSubControl_${this.index}`] =  (e) => {
      let x = this.getXAcrossEvents(e);
      if ( this.markers.start < this.markers.end - 2 * k ) {
        this.decreaseWidth(`rightControl_${this.index}`, x);
      } else if ( x < 0 ) {
        if ( this.markers.start > 0 ) {
          this.decreaseWidth(`rightControl_${this.index}`, x);
          this.increaseWidth(`leftControl_${this.index}`, x);
        }
      } else {
        this.decreaseWidth(`rightControl_${this.index}`, x);
      }
    };
    this.strategies[`leftSubControl_${this.index}`] = (e) => {
      let x = this.getXAcrossEvents(e);
      if ( this.markers.start < this.markers.end - 2 * k ) {
        this.increaseWidth(`leftControl_${this.index}`, x);
      } else if ( x > 0 ) {
        if ( this.markers.end  < 1) {
          this.decreaseWidth(`rightControl_${this.index}`, x);
          this.increaseWidth(`leftControl_${this.index}`, x);
        }
      } else {
        this.increaseWidth(`leftControl_${this.index}`, x);
      }
    };
    this.strategies[`range_${this.index}`] = (e) => {
      let x = this.getXAcrossEvents(e);
      if ( this.markers.start - k/6 > 0 && x < 0 || this.markers.end + k/6 < 1 && x > 0 ) {
        this.increaseWidth(`leftControl_${this.index}`, x);
        this.decreaseWidth(`rightControl_${this.index}`, x);
      }

    };
  }

  getStrategy (target) {
    let id = target.getAttribute('id');
    return this.strategies[id];
  }

  getXAcrossEvents (e) {
    let x = e.movementX;
    if ( !x ) {
      let touch = event.touches[0] || event.changedTouches[0];
      x = this.x ? touch.clientX - this.x : 0;
      this.x = touch.clientX;
    }

    console.log({x})
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
        #chart_${this.index} {
          border-top-left-radius: 18px;
          border-top-right-radius: 18px;
        }
        #Chart_${this.index}.chart {
            margin: 20px 0;
            width: ${this.chart.width}px;
            background-color: ${this.chart.darkMode ? '#111' : '#fff'};
            padding: 20px;
            border-radius: 20px;
        }
        #Chart_${this.index} .range {
            height: 40px;
            background: ${this.chart.darkMode ? '#111' : '#fff'};
            cursor: move;
            border: 1px solid ${this.chart.darkMode ? '#bbb' : '#444'};
        }
        #Chart_${this.index} .leftControl {
            height: 40px;
            background-color: ${this.chart.darkMode ? '#333' : '#ccc'};
            opacity: 0.75;
            float: left;
            cursor: auto;
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            color: ${this.chart.darkMode ? '#eee' : '#111'};
            line-height: 40px;
        }
        #Chart_${this.index} .leftSubControl {
            width: ${this.chart.controlsWidth}px;
            height: 40px;
            background-color: ${this.chart.darkMode ? '#bbb' : '#444'};
            opacity: 0.95;
            float: left;
            cursor: w-resize;
            z-index: 999;
        }
        #Chart_${this.index} .rightControl {
            height: 40px;
            background-color: ${this.chart.darkMode ? '#333' : '#ccc'};
            opacity: 0.75;
            float: right;
            cursor: auto;
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            color: ${this.chart.darkMode ? '#eee' : '#111'};
            line-height: 40px;
        }
        #Chart_${this.index} .rightSubControl {
            width: ${this.chart.controlsWidth}px;
            height: 40px;
            background-color: ${this.chart.darkMode ? '#bbb' : '#444'};
            opacity: 0.95;
            float: right;
            cursor: e-resize;
            z-index: 999;
        }
        #Chart_${this.index} .canvas {
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
            cursor: pointer;         

        }   
        #Chart_${this.index} #pointShower_${this.index} {
            position: absolute;
            background: ${this.chart.darkMode ? '#333': '#eee'};
            border-radius: 10px;
            border: 1px solid ${this.chart.darkMode ? '#eee': '#333'};
            width: 90px;
            padding: 10px;
        }  
        #pointShower_${this.index} .date {
            font-weight: bold;
            color: ${this.chart.darkMode ? '#eee': '#333'}
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
                <canvas class="canvas" width="${this.chart.width}" height="${this.chart.height}" id="chart_${this.index}"></canvas>
                <div id="dates_holder_${this.index}"></div>
                <div class="range" id="range_${this.index}" style="width: ${this.chart.width}px;">
                  <div class="leftControl" id="leftControl_${this.index}" style="width: ${Math.round(this.chart.width/4)}px;"></div>
                  <div class="leftSubControl" id="leftSubControl_${this.index}"></div>
                  <div class="rightControl" id="rightControl_${this.index}" style="width: ${Math.round(this.chart.width/4)}px;"></div>
                  <div class="rightSubControl" id="rightSubControl_${this.index}"></div>
                </div>
                <div id="pointShower_${this.index}" draggable="true"></div>
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

  decreaseWidth (id, x) {
    let element = document.getElementById(id);
    if(element){
      let width = element.style.width || 120;
      element.style.width = parseInt(width, 10) - x + 'px';
    }
    this.calculate();
  }

  increaseWidth (id, x) {
    let element = document.getElementById(id);
    if ( element ) {
      let width = element.style.width || 120;
      element.style.width = parseInt(width, 10) + x + 'px';
    }
    this.calculate();
  }

  calculate () {
    let rsc = document.getElementById(`rightControl_${this.index}`),
      lsc = document.getElementById(`leftControl_${this.index}`),
      c = document.getElementById(`range_${this.index}`),
      base = parseInt(c.style.width, 10),
      start = parseInt(lsc.style.width, 10)/base,
      end = (base - parseInt(rsc.style.width, 10))/base;
    this.markers =  { start, end };
    this.showPoint();
  }

  drawDates() {
    let target = document.getElementById(`dates_holder_${this.index}`);
    let canvas = document.createElement('canvas');
    let { start, end } = this.markers;
    let Start = Math.round(start * this.data['x'].data.length);
    let End = Math.round(end * this.data['x'].data.length);
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
    for ( let i=0; i < l; i++ ) {
      if ( i >= Start && i <= End ) {
        let k = Math.round(this.chart.width / 40);
        if ( diff > k &&  !( i % Math.ceil(diff/k) ) || diff <= k ) {
          let value = new Date(xData[i]);
          ctx.fillText(`${value.getDate()} ${this.defaults.months[value.getMonth()]}`, kx * i, textY);
        }
      }
    }
    target.style.background = `url(${canvas.toDataURL()})`;
    target.style['background-position'] = `left ${canvas.width * (1 - start)}px top`;
    let lc = document.getElementById(`leftControl_${this.index}`);
    lc.innerText = '';
    if ( parseInt(lc.style.width, 10) >= 70 ) {
      lc.innerText = `from ${new Date(xData[Start]).getDate()} ${this.defaults.months[new Date(xData[Start]).getMonth()]}`;
    }

    let rc = document.getElementById(`rightControl_${this.index}`);
    rc.innerText = '';
    if ( parseInt(rc.style.width, 10) >= 70 ) {
      rc.innerText = `to ${new Date(xData[End]).getDate()} ${this.defaults.months[new Date(xData[End]).getMonth()]}`;
    }
  }

  drawChart() {
    let
      canvas = document.getElementById(`chart_${this.index}`),
      ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let Max = [], Min = [];
    let d = Math.round(canvas.height / 5);
    for ( let key in this.data ) {
      if ( ! this.defaults.exceptionKeys.includes(key) && !this.excludedKeys.includes(key)) {
        let max = Math.max.apply(null, this.data[key].data);
        let min = Math.min.apply(null, this.data[key].data);
        Max.push(max);
        Min.push(min);
      }
    }
    let max = Math.max.apply(null, Max);
    let min = Math.min.apply(null, Min);
    for ( let i =0; i < canvas.height; i = i + d ){
      ctx.strokeStyle = this.chart.darkMode ? '#333' : '#eee';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - i );
      ctx.lineTo(canvas.width, canvas.height - i);
      ctx.stroke();
      ctx.closePath();
      ctx.moveTo(0, canvas.height - i );
    }
    if ( Object.keys(this.data).length >  this.excludedKeys.length  + this.defaults.exceptionKeys.length) {
      for ( let key in this.data ) {
        if ( ! this.defaults.exceptionKeys.includes(key) && ! this.excludedKeys.includes(key)) {
          let ky = canvas.height / (max - min ) * 0.9;
          let { start, end } = this.markers;
          start = Math.round(start * this.data[key].data.length);
          end = Math.round(end * this.data[key].data.length);
          let points = [];
          let yData = this.data[key].data.slice(start, end);
          let xData = this.data['x'].data.slice(start, end);
          let kx = canvas.width / xData.length;
          for (let i=0; i < yData.length; i++ ){
            let point = {
              x: i === yData.length - 1 ? canvas.width : Math.round(kx * i),
              y:  (canvas.height - Math.round(ky * (yData[i] - min)))
            };
            points.push(point);
          }
          ctx.strokeStyle = this.chart.darkMode ? '#333' : '#eee';
          ctx.lineWidth = 1;
          ctx.strokeStyle = this.data[key].color;
          ctx.lineWidth = 1;
          ctx.moveTo(points[0].x, points[0].y);
          ctx.beginPath();
          points.map(point => {
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
          });
          ctx.closePath();
          this.points[key] = points;
        }
      }
      for ( let i = 1; i < canvas.height; i = i + d  ){
        ctx.fillStyle = this.chart.darkMode ? '#eee' : '#333';
        ctx.fillText(Math.round(max * ( i + d ) / canvas.height).toString(), 20, canvas.height - i - d/2)
      }
    }
    this.drawDates();
  }

  showPoint(data) {
    let pointShower = document.getElementById(`pointShower_${this.index}`);
    if ( data ) {
      pointShower.style.left = data.left + 'px';
      pointShower.style.top = data.top + 'px';
      let template = document.createElement('template');
      template.innerHTML = this.getPointTemplate(data);
      pointShower.innerHTML = '';
      pointShower.append(template.content);
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
          for (let i = 0; i < yData.length; i++) {
            let point = {
              x: Math.round(kx * i),
              y: canvas.height - Math.round(ky * (yData[i] - min))
            };
            points.push(point);
          }
          ctx.strokeStyle = this.data[key].color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          points.map(point => {
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
          });
          ctx.closePath();
        }
      }
    }
    let target = document.getElementById(`range_${this.index}`);
    target.style.background = `url(${canvas.toDataURL()})`;
  }

  initEvents() {
    let target = document.getElementById(`range_${this.index}`), self = this;
    target.addEventListener('mousedown', function(e){
      e.preventDefault();
      let strategy = self.getStrategy(e.target);
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
      let strategy = self.getStrategy(e.target);
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
    let ctx = canvas.getContext('2d');
    canvas.addEventListener('mousemove', function(e) {
      e.preventDefault();
      let color = ctx.getImageData(e.offsetX, e.offsetY, 1, 1).data;
      color = "#" +
        ("0" + parseInt(color[1], 10).toString(16)).slice(-2) +
        ("0" + parseInt(color[2], 10).toString(16)).slice(-2) +
        ("0" + parseInt(color[3], 10).toString(16)).slice(-2);
      if ( color !== '#000000' && color !== '#ffffff' ) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }
    });
    canvas.addEventListener('click', function(e) {
      e.preventDefault();
      if ( canvas.style.cursor === 'pointer' ) {
        let x = e.clientX - canvas.offsetLeft;
        let y = e.offsetY + canvas.offsetTop;
        let { start, end } = self.markers;
        let k = x / canvas.width * (end - start) + start;
        let data = { left: x, top: y };
        let index = Math.round( self.data.x.data.length * k );
        for ( let key in self.data ) {
          if ( ! self.excludedKeys.includes(key)) {
            data[key] = self.data[key].data[index];
          }
        }
        self.currentPoint = data;
        self.showPoint(data);
      } else {
        self.showPoint();
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
      this.drawBackground();
    }
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
