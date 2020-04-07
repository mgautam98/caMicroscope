// menu.js
//
// let __ = {};
(function($) {
  $.SimpleContextMenu = function(target, options) {
    this.elt = createElement();
    this.target = target;
    if (!this.target) {
      console.error(`${this.className}:No TARGET to operation`);
      return;
    }

    this.target.appendChild(this.elt);

    this.events = {
      eventClose: eventClose.bind(this),
      eventOpen: eventOpen.bind(this),
    };

    this.elt.style.zIndex = options.zIndex || 650;

    // style event
    const list = this.elt.querySelectorAll('.style a');
    list.forEach((a)=> a.addEventListener('click', selectStyle.bind(this)));

    // color event
    const input = this.elt.querySelector('.color input');
    const box = this.elt.querySelector('.color div.icons');

    box.style.backgroundColor = input.value;
    box.setAttribute('data-color', input.value);
    input.parentNode.insertBefore(box, input);
    input.type = 'hidden';
    this.picker = new CP(box);
    this.picker.on('change', function(color) {
      input.value = '#' + color;
      box.style.backgroundColor = '#' + color;
      this.raiseEvent('style-changed', this.getStyle());
    }.bind(this));

    // clear event
    const clear = this.elt.querySelector('.clear');
    clear.addEventListener('click', function() {
      this.raiseEvent('clear', {});
    }.bind(this));

    // Width event
    const width = this.elt.querySelector('.penWidth');
    width.addEventListener('click', function() {
      console.log("Setting thickness");
    }.bind(this));

    if (options.isOn) this.on();
  };
  $.SimpleContextMenu.prototype.on = function() {
    this.close(true);
    this.target.addEventListener('contextmenu', this.events.eventOpen);
    this.target.addEventListener('click', this.events.eventClose);
  };

  $.SimpleContextMenu.prototype.off = function() {
    this.close(true);
    this.target.removeEventListener('contextmenu', this.events.eventOpen);
    this.target.removeEventListener('click', this.events.eventClose);
  };

  $.SimpleContextMenu.prototype.open = function({x = 0, y = 0, target = null}) {
    //
    const items = this.elt.querySelectorAll('.item');
    items.forEach((item) => item.classList.remove('list'));
    if (target) {
      // get pos on screen
      const height = target.offsetHeight;
      // const width = target.offsetWidth;
      for (var left=0, top=0; target != null;
        left += target.offsetLeft, top += target.offsetTop, target = target.offsetParent);
      top += height;
      left += 2;// width;
      items.forEach((item) => item.classList.add('list'));
      this.elt.style.display = '';
      this.elt.style.left = `${left}px`;
      this.elt.style.top = `${top}px`;
      this.elt.style.visibility = `visible`;
      this.elt.querySelector('.flag').checked = true;
    } else {
      this.elt.style.display = '';
      this.elt.style.left = `${x}px`;
      this.elt.style.top = `${y}px`;
      setTimeout(function() {
        this.elt.style.visibility = `visible`;
        this.elt.querySelector('.flag').checked = true;
      }.bind(this), 100);
    }
  };
  $.SimpleContextMenu.prototype.getStyle = function() {
    const color = this.elt.querySelector('.color input[type=hidden]').value;
    const width = 2;
    const model = this.elt.querySelector('.style .active').dataset.model;
    return {
      style: {
        color: color,
        lineJoin: 'round', // "bevel" || "round" || "miter"
        lineCap: 'round', // "butt" || "round" || "square"
        penWidth: width,
      },
      model: model,
    };
  };
  $.SimpleContextMenu.prototype.close = function(immediate = false) {
    this.picker.exit();
    this.elt.querySelector('.flag').checked = false;
    if (immediate) {
      this.elt.style.visibility = ``;
      this.elt.style.display = 'none';
      return;
    }
    setTimeout(function() {
      this.elt.style.visibility = ``;
      this.elt.style.display = 'none';
    }.bind(this), 100);
  };
  function eventOpen(e) {
    this.open({x: e.clientX, y: e.clientY});
    e.preventDefault();
  }
  function eventClose(e) {
    if (!e) {
      this.close();
      return;
    }
    const isClickOnMenu = clickInsideElement( e, 'draw-menu-wrap' );
    if ( isClickOnMenu ) return;

    this.close();
  }
  /**
 * Add an event handler for a given event.
 * @function
 * @param {String} eventName - Name of event to register.
 * @param {OpenSeadragon.EventHandler} handler - Function to call when event is triggered.
 * @param {Object} [userData=null] - Arbitrary object to be passed unchanged to the handler.
 */
  $.SimpleContextMenu.prototype.addHandler = function( eventName, handler, userData ) {
    let events = this.events[eventName];
    if ( !events ) {
      this.events[eventName] = events = [];
    }
    if ( handler && typeof handler === 'function' ) {
      events[events.length] = {handler: handler, userData: userData || null};
    }
  };

  /**
 * Remove a specific event handler for a given event.
 * @function
 * @param {String} eventName - Name of event for which the handler is to be removed.
 * @param {OpenSeadragon.EventHandler} handler - Function to be removed.
 */
  $.SimpleContextMenu.prototype.removeHandler = function( eventName, handler ) {
    const events = this.events[eventName];
    const handlers = [];
    let i;
    if ( !events ) {
      return;
    }
    if ( $.isArray( events ) ) {
      for ( i = 0; i < events.length; i++ ) {
        if ( events[i].handler !== handler ) {
          handlers.push( events[i] );
        }
      }
      this.events[eventName] = handlers;
    }
  };


  /**
 * Remove all event handlers for a given event type. If no type is given all
 * event handlers for every event type are removed.
 * @function
 * @param {String} eventName - Name of event for which all handlers are to be removed.
 */
  $.SimpleContextMenu.prototype.removeAllHandlers = function( eventName ) {
    if ( eventName ) {
      this.events[eventName] = [];
    } else {
      for ( const eventType in this.events ) {
        if (this.events.hasOwnProperty(eventType)) {
          this.events[eventType] = [];
        }
      }
    }
  },

  /**
 * Get a function which iterates the list of all handlers registered for a given event, calling the handler for each.
 * @function
 * @param {String} eventName - Name of event to get handlers for.
 */
  $.SimpleContextMenu.prototype.getHandler = function( eventName ) {
    let events = this.events[eventName];
    if ( !events || !events.length ) {
      return null;
    }
    events = events.length === 1 ?
        [events[0]] :
        Array( ...events );
    return function( source, args ) {
      let i;
      const length = events.length;
      for ( i = 0; i < length; i++ ) {
        if ( events[i] ) {
          args.eventSource = source;
          args.userData = events[i].userData;
          events[i].handler( args );
        }
      }
    };
  },

  /**
 * Trigger an event, optionally passing additional information.
 * @function
 * @param {String} eventName - Name of event to register.
 * @param {Object} eventArgs - Event-specific data.
 */
  $.SimpleContextMenu.prototype.raiseEvent = function( eventName, eventArgs ) {
    // uncomment if you want to get a log of all events
    // $.console.log( eventName );
    const handler = this.getHandler( eventName );

    if ( handler ) {
      if ( !eventArgs ) {
        eventArgs = {};
      }

      handler( this, eventArgs );
    }
  };
  function selectStyle(e) {
    // var e = event;
    const theTool = e.target.parentNode;
    const toolbarItems = this.elt.querySelectorAll('ul.style li');
    for (let i = 0; i < toolbarItems.length; ++i) {
      toolbarItems[i].className = '';
      // do something with items[i], which is a <li> element
    }
    theTool.className = 'active';
    this.raiseEvent('style-changed', this.getStyle());
  }

  function createElement() {
    const elt = document.createElement('div');
    elt.style.display = 'none';
    // create wrap for all menu
    elt.classList.add('draw-menu-wrap');

    const flag = document.createElement('input');
    flag.type = 'checkbox';
    flag.classList.add('flag');
    elt.appendChild(flag);

    // color
    const color = document.createElement('div');
    color.classList.add('color');
    color.classList.add('item');
    // color.title = 'Color';

    // color block/picker
    const picker = document.createElement('div');
    picker.classList.add('icons');
    picker.style.backgroundColor ='#7CFC00';
    // hidden color value
    const colorInput = document.createElement('input');
    colorInput.type = 'hidden';
    colorInput.value='#7CFC00';

    color.appendChild(picker);
    color.appendChild(colorInput);

    elt.appendChild(color);

    // clear
    const clear = document.createElement('div');
    // clear.title = 'Clear';
    clear.classList.add('clear');
    clear.classList.add('item');

    clearIcon = document.createElement('div');
    clearIcon.classList.add('material-icons');
    clearIcon.classList.add('icons');
    clearIcon.textContent = 'layers_clear';
    clear.appendChild(clearIcon);
    elt.appendChild(clear);

    // penWidth
    const width = document.createElement('div');
    width.classList.add('penWidth');
    width.classList.add('item');
    width.title = 'Width';

    widthIcon = document.createElement('div');
    widthIcon.classList.add('material-icons');
    widthIcon.classList.add('icons');
    widthIcon.textContent = 'hdr_strong';
    width.appendChild(widthIcon);
    elt.appendChild(width);

    // mode/draw-style
    const style = document.createElement('ul');
    style.classList.add('style');
    style.classList.add('item');
    style.title = 'Style';
    const free = document.createElement('li');
    free.classList.add('active');
    free.dataset.model = 'free';
    const styleFree = document.createElement('a');
    styleFree.classList.add('material-icons');
    styleFree.textContent = 'gesture';
    free.appendChild(styleFree);


    const rect = document.createElement('li');
    rect.dataset.model = 'rect';
    // free.classList.add('active');
    const styleRect = document.createElement('a');
    styleRect.classList.add('material-icons');
    styleRect.textContent = 'crop_portrait';
    rect.appendChild(styleRect);

    const point = document.createElement('li');
    point.dataset.model = 'point';
    // free.classList.add('active');
    const stylePoint = document.createElement('a');
    stylePoint.classList.add('material-icons');
    stylePoint.textContent = 'fiber_manual_record';
    point.appendChild(stylePoint);


    style.appendChild(free);
    style.appendChild(rect);
    style.appendChild(point);
    elt.appendChild(style);

    return elt;
  }
})(__);
