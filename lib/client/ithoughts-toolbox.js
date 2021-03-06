/**
 * @file Minify compliant generic shorthands
 * @description jslint globals: Element
 *
 * @author Alexandre Germain
 * @copyright 2016 iThoughts informatique
 * @license https://www.gnu.org/licenses/gpl-3.0.html GPLv3
 * @package iThoughts-toolbox
 *
 * @version 0.0.2
 */
/**
 * @namespace iThoughts_Toolbox
 * @memberof client
 * @description iThoughts Helper object, with minified & cross-browser shorthands
 */
(function (T) {
	'use strict';

	function isNA(value) {
		return value === null || typeof value === 'undefined';
	}
	function hop (s, v) {
		return s.hasOwnProperty(v);
	}

	var d = document,
		w = window,
		el = Element,
		et = typeof EventTarget !== 'undefined' && !isNA(EventTarget) ? EventTarget : document.createDocumentFragment().constructor,
		dc = T.deepClone = function (obj) {
			var newT, i;
			if (!isNA(obj)) {
				switch (obj.constructor) {
					case Object:
						newT = {};
						for (i in obj) {
							if (hop(obj, i)) {
								newT[i] = dc(obj[i]);
							}
						}
						return newT;
						break;

					case Array:
						newT = [];
						for (i in obj) {
							if (hop(obj, i)) {
								newT[i] = dc(obj[i]);
							}
						}
						return newT;
						break;

					default:
						return obj;
				}
			} else {
				return obj;
			}
		};
	T.d = d;
	T.w = w;
	/**
	 * @function isNA
	 * @description Check if value is null or undefined
	 * @author Gerkin
	 * @memberof client.iThoughts_Toolbox
	 * @instance
	 * @param {*} value The value tu check
	 * @returns {boolean} True if null or undefined, false otherwise
	 */
	T.isNA = isNA;
	/**
	 * @function waitFor
	 * @description Look into `scope` for property `prop` every `every`ms, then execute `callback` when the property exists
	 * @author Gerkin
	 * @memberof client.iThoughts_Toolbox
	 * @instance
	 * @param {*} scope The parent scope to check for property in
	 * @param {string} prop Name of the property to wait for
	 * @param {integer} [every] Time in ms between each checks
	 * @param {function} callback Function to execute once property exists
	 * @returns {undefined} Async
	 */
	T.waitFor = function (scope, prop, every, callback) {
		var timer;

		if (typeof every === 'function') {
			callback = every;
			every = undefined;
		}
		if ((typeof scope !== 'object' || typeof prop !== 'string' || typeof every === 'number') && (typeof callback !== 'function' || typeof callback !== 'function')) {
			throw new TypeError('"waitFor" expects following types combinations:\n' + '\t{Object} scope, {String} prop, {Number} every, {Function} callback\n' + '\t{Object} scope, {String} prop, {Function} callback');
		}
		if (hop(scope, prop)) {
			callback();
		} else {
			timer = setInterval(function () {
				if (hop(scope, prop)) {
					clearInterval(timer);
					callback();
				}
			}, every || 100);
		}
		var timer = null;
	};
	/**
	 * @function mergeRecursive
	 * @description Combine each object from left to right, keeping the left-most value
	 * @author Gerkin
	 * @memberof client.iThoughts_Toolbox
	 * @instance
	 * @param {...(object|array)} objects Any number of objects/arrays to merge
	 * @returns {boolean} True if null or undefined, false otherwise
	 */
	T.mergeRecursive = function () {
		var newObj = null, j, curObj, recurse = function (obj1, obj2) {
			var i, val, newT;
			if (!isNA(obj2)) {
				switch (obj2.constructor) {
					case Object:
						if (!isNA(obj1) && obj1.constructor == Object) {
							newT = dc(obj1);
						} else {
							newT = {};
						}
						for (i in obj2) {
							if (hop(obj2, i)) {
								val = obj2[i];
								newT[i] = recurse(newT[i], obj2[i]);
							}
						}
						return newT;
						break;

					case Array:
						if (!isNA(obj1) && obj1.constructor == Array) {
							newT = dc(obj1);
						} else {
							newT = [];
						}
						for (i in obj2) {
							if (hop(obj2, i)) {
								val = obj2[i];
								newT[i] = recurse(newT[i], obj2[i]);
							}
						}
						return newT;
						break;

					default:
						return obj2;
				}
			} else {
				return obj2;
			}
		};
		for (j in arguments) {
			curObj = arguments[j];
			if (!isNA(curObj) && (curObj.constructor == Object || curObj.constructor == Array)) {
				newObj = recurse(newObj, curObj);
			}
		}
		return newObj;
	};
	T.docWidth = function () {
		return w.innerWidth || w.documentElement.clientWidth || w.body.clientWidth || w.body.offsetWidth;
	};
	T.docHeight = function () {
		return w.innerHeight || w.documentElement.clientHeight || w.body.clientHeight || w.body.offsetHeight;
	};
	/**
	 * @function gei
	 * @description Minification shorthand for {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementById Document.getElementById}
	 * @author Gerkin
	 * @memberof client.iThoughts_Toolbox
	 * @instance
	 * @param {string} s The id of the searched element
	 * @returns {Element|null} The Element, or null if not found
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementById
	 */
	T.gei = function (s) {
		return d.getElementById(s);
	};
	/**
	 * @function qs
	 * @description Minification shorthand for {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelector Element.querySelector}
	 * @author Gerkin
	 * @memberof client.iThoughts_Toolbox
	 * @instance
	 * @param {string} s The selector of the searched element
	 * @returns {Element|null} The Element, or null if not found
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelector
	 */
	T.qs = function (s, e) {
		return (e || d).querySelector(s);
	};
	/**
	 * @function qsa
	 * @description Minification shorthand for {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll Element.querySelectorAll}
	 * @author Gerkin
	 * @memberof client.iThoughts_Toolbox
	 * @instance
	 * @param {string} s The selector of the searched element
	 * @returns {NodeList} The NodeList containing every elements matching the selector
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll
	 */
	T.qsa = function (s, e) {
		return (e || d).querySelectorAll(s);
	};
	/**
	 * @function geiN
	 * @description Like {@link Document.gei}, but returns an empty object instead of null to allow 1lvl attribute definition without tests
	 * @author Gerkin
	 * @memberof client.iThoughts_Toolbox
	 * @instance
	 * @param {string} s The selector of the searched element
	 * @returns {Element|{}} The Element, or an empty object if not found
	 */
	T.geiN = function (s, e) {
		return gei(s, e) || {};
	};
	/**
	 * @function qsN
	 * @description Like {@link Element.qsN}, but returns an empty object instead of null to allow 1lvl attribute definition without tests
	 * @author Gerkin
	 * @memberof client.iThoughts_Toolbox
	 * @instance
	 * @param {string} s The selector of the searched element
	 * @returns {Element|{}} The Element, or an empty object if not found
	 */
	T.qsN = function (s, e) {
		return qs(s, e) || {};
	};
	/**
	 * @function hop
	 * @description Minification shorthand for {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty Object.hasOwnProperty}
	 * @author Gerkin
	 * @memberof client.iThoughts_Toolbox
	 * @instance
	 * @param {string} v The name of the attribute
	 * @returns {Boolean} Returns the same than {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty Object.hasOwnProperty}
	 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty
	 */
	T.hop = hop
	/**
	 * @function waitUntil
	 * @description Loops until `until` function returns true or `max`ms is elapsed, doing the test every `every`ms, then execute function `fct`
	 * @author Gerkin
	 * @memberof client.iThoughts_Toolbox
	 * @instance
	 * @param {function} fct Function to execute once timeout or test function is OK.
	 * @param {function} until Function executed on each loop.
	 * @param {number} every Time to wait between each test.
	 * @param {number|false} [max=false]  Time after which `fct` will be executed even if `until` still returns false. Set it to false to not set max timeout
	 */
	T.waitUntil = function (fct, until, every, max) {
		if (isNA(until) || until.constructor.name !== 'Function')
			throw TypeError('Calling "Function.waitUntil" without test function. Call setTimeout instead');
		max = !isNA(max) && !isNaN(parseInt(max)) ? parseInt(max) : false;
		setTimeout(function () {
			until() || max !== false && max < 1 ? fct() : waitUntil(fct, until, every, max ? max - every : max);
		}, every);
	};
	/**
	 * @function on
	 * @description Bind events with specified functions on specified elements
	 * @memberof client.iThoughts_Toolbox
	 * @alias client.iThoughts_Toolbox.attachEvent
	 * @param {EventTarget|EventTarget[]}					a	EventTarget to bind
	 * @param {string|string[]}					b	Events to bind
	 * @param {EventFunction|EventFunction[]}	c	Functions to attach
	 * @since 0.1.0
	 */
	function on(a, b, c) {
		/**
		 * @function _on
		 * @description Inner function of {@link client.iThoughts_Toolbox.on}
		 * @memberof client.iThoughts_Toolbox
		 * @param {string}			e Event to bind
		 * @param {EventFunction}	f Function to attach
		 * @private
		 * @see client.iThoughts_Toolbox.on
		 * @since 0.1.0
		 */
		function _on(s, e, f) {
			var i = e && f && (s.addEventListener || s.attachEvent).call(s, e, f);
		}
		if (isNA(a) || a.constructor.name !== 'Array') {
			a = [a];
		}
		if (isNA(b) || b.constructor.name !== 'Array') {
			b = [b];
		}
		if (isNA(c) || c.constructor.name !== 'Array') {
			c = [c];
		}
		var i = 0, j = 0, k = 0, I = a.length, J = b.length, K = c.length;
		for (i = 0; i < I; i++) {
			for (j = 0; j < J; j++) {
				for (k = 0; k < K; k++) {
					a[i] instanceof et && _on(a[i], b[j], c[k]);
				}
			}
		}
	}
	T.on = T.attachEvent = on;
	/**
	 * @function off
	 * @description Unbind events with specified functions on specified elements
	 * @memberof client.iThoughts_Toolbox
	 * @alias client.iThoughts_Toolbox.detachEvent
	 * @param {EventTarget|EventTarget[]}					a	EventTarget to unbind
	 * @param {string|string[]}					b	Events to unbind
	 * @param {EventFunction|EventFunction[]}	c	Functions to detach
	 * @since 0.1.0
	 */
	function off(a, b, c) {
		/**
		 * @function _off
		 * @description Inner function of {@link client.iThoughts_Toolbox.off}
		 * @memberof client.iThoughts_Toolbox
		 * @param {string}			e Event to unbind
		 * @param {EventFunction}	f Function to detach
		 * @private
		 * @see client.iThoughts_Toolbox.off
		 * @since 0.1.0
		 */
		function _off(s, e, f) {
			var i = e && f && (s.removeEventListener || s.detachEvent).call(s, e, f);
		}
		if (isNA(a) || a.constructor.name !== 'Array') {
			a = [a];
		}
		if (isNA(b) || b.constructor.name !== 'Array') {
			b = [b];
		}
		if (isNA(c) || c.constructor.name !== 'Array') {
			c = [c];
		}
		var i = 0, j = 0, k = 0, I = a.length, J = b.length, K = c.length;
		for (i = 0; i < I; i++) {
			for (j = 0; j < J; j++) {
				for (k = 0; k < K; k++) {
					a[i] instanceof et && _off(a[i], b[j], c[k]);
				}
			}
		}
	}
	T.off = T.detachEvent = off;
	/**
	 * @function go
	 * @description Trigger events on specified elements
	 * @memberof client.iThoughts_Toolbox
	 * @alias client.iThoughts_Toolbox.triggerEvent
	 * @param {EventTarget|EventTarget[]}					a	EventTarget to trigger event on
	 * @param {string|string[]}					b	Name of the events
	 * @since 0.1.0
	 */
	function go(a, b) {
		/**
		 * @function _go
		 * @description Inner function of {@link client.iThoughts_Toolbox.go}
		 * @memberof client.iThoughts_Toolbox
		 * @param {string}			b Event name
		 * @param e Minification helper. Do not use
		 * @private
		 * @see client.iThoughts_Toolbox.go
		 * @since 0.1.0
		 */
		function _go(s, b, e) {
			if (b) {
				if (d.createEvent) {
					e = new Event(b);
					s.dispatchEvent(e);
				} else {
					e = d.createEventObject();
					s.fireEvent('on' + b, e);
				}
			}
		}
		if (isNA(a) || a.constructor.name !== 'Array') {
			a = [a];
		}
		if (isNA(b) || b.constructor.name !== 'Array') {
			b = [b];
		}
		var i = 0, j = 0, k = 0, I = a.length, J = b.length;
		for (i = 0; i < I; i++) {
			for (j = 0; j < J; j++) {
				a[i] instanceof et && _go(a[i], b[j]);
			}
		}
	}
	T.go = T.triggerEvent = go;

	/**
	 * @function setCookie
	 * @description Writes the specified cookie name with provided value
	 * @memberof client.iThoughts_Toolbox
	 * @param {string} cname	Name of the cookie
	 * @param {string} cvalue	Value of the cookie
	 * @param {number} exdays	Lifetime of the cookie
	 * @returns {boolean} True on success
	 * @see http://www.w3schools.com/js/js_cookies.asp
	 * @since 0.2.0
	 */
	T.setCookie = function setCookie(cname, cvalue, exdays) {
		try {
			var d = new Date();
			d.setTime(d.getTime() + (exdays*24*60*60*1000));
			var expires = "expires="+ d.toUTCString();
			document.cookie = cname + "=" + cvalue + "; " + expires;
			return true;
		} catch(e){
			console.error("Error while writing cookie:", e);
			return false;
		}
	}

	/**
	 * @function getCookie
	 * @description Get the value of specfied cookie
	 * @memberof client.iThoughts_Toolbox
	 * @param {string} cname	Name of the cookie
	 * @returns {string} Value of the cookie
	 * @see http://www.w3schools.com/js/js_cookies.asp
	 * @since 0.2.0
	 */
	T.getCookie = function getCookie(cname) {
		var name = cname + "=";
		var ca = document.cookie.split(';');
		for(var i = 0; i <ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length,c.length);
			}
		}
		return "";
	}

	T.formToObject = function formToObject(form) {
		var json = {};
		for(var i = 0, I = form.length; i < I; i++){
			var formvalue = form[i],
				nestingIndex = formvalue.name.indexOf('['),
				nestingsCount,
				jsonLocal,
				nestings,
				i,
				fvn = formvalue.value || '';
			if(formvalue.name != ""){
				if (nestingIndex > -1) {
					jsonLocal = json;
					nestings = formvalue.name.replace(/\]/gi, '').split('[');
					for (i = 0, nestingsCount = nestings.length; i < nestingsCount; i++) {
						if (i === nestingsCount - 1) {
							if(nestings[i] != ""){
								if (jsonLocal[nestings[i]]) {
									if (typeof jsonLocal[nestings[i]] === 'string') {
										jsonLocal[nestings[i]] = [jsonLocal[nestings[i]]];
									}
									jsonLocal[nestings[i]].push(fvn);
								} else {
									jsonLocal[nestings[i]] = fvn;
								}
							} else {
								jsonLocal.push(fvn);
							}
						} else {
							jsonLocal = jsonLocal[nestings[i]] = jsonLocal[nestings[i]] || (nestings[i + 1] === "" ? [] : {});
						}
					}
				} else {
					if (json[formvalue.name] !== undefined) {
						if (!json[formvalue.name].push) {
							json[formvalue.name] = [json[formvalue.name]];
						}
						json[formvalue.name].push(fvn);
					} else {
						json[formvalue.name] = fvn;
					}
				}
			}
		}
		return json;
	};

	T.objectToForm = function objectToForm(object, form){
		var formInputs = form.length;

		function exploreObject(subobject, path){
			for(var key in subobject){
				if(!subobject.hasOwnProperty(key) || iThoughts_Toolbox.isNA(subobject[key])) continue;

				var subPath = path ? path + "[" + key + "]" : key;
				if(subobject[key].constructor.name === "Object"){
					exploreObject(subobject, subPath)
				} else {
					for(var i = 0; i < formInputs; i++){
						var input = form[i];

						// Check if the input name is the path
						if(input.name !== subPath) continue;

						// Set the value
						input.value = subobject[key];
					}
				}
			}
		}

		exploreObject(object, false);
	}
}(window.iThoughts_Toolbox || (window.iThoughts_Toolbox = {})));
