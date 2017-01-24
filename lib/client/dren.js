/**
 * @file Main client-side framework file
 * @description Client-side functions
 *
 * @author Gerkin
 * @copyright 2016 GerkinDevelopment
 * @license https://raw.githubusercontent.com/iThoughts-Informatique/DREN.js/master/LICENSE GPL-3.0
 * @package dren.js
 *
 * @namespace client
 *
 * @version 0.0.2
 */
/**
 * @namespace DRENjs
 * @description DRENjs client-side framework
 * @memberof client
 */
(function (DRENjs, T) {
	'use strict';

	function log(){
		//console.log.apply(console, arguments);
	}

	var isNA,
		qsa,
		Require = requirejs;

	var chainedDeps = DRENjs.initDeps,
		i = 0,
		I = chainedDeps.length;
	function iterateDeps(){
		var callback = i === I - 1 ? endInitDeps : iterateDeps;
		Require(chainedDeps[i], callback);
		i++;
	}
	function endInitDeps(){
		var DRENjs = window.DRENjs,
			iThoughts_Toolbox = window.iThoughts_Toolbox;
		DRENjs.init(iThoughts_Toolbox);
	}
	if(typeof DRENjs.template_scripts == "string"){
		Require([DRENjs.template_scripts], function(template_scripts){
			DRENjs.template_scripts = template_scripts;
			iterateDeps();
		});
	} else {
		iterateDeps();
	}

	/**
	 * @name sendRequest
	 * @type {object}
	 * @memberof client.DRENjs
	 * @description Function used to send requests
	 * @virtual
	 * @public
	 * @instance
	 * @property {RequestFunction} GET Function used to send GET requests
	 * @property {RequestFunction} POST Function used to send POST requests
	 * @property {RequestFunction} PUT Function used to send PUT requests
	 * @property {RequestFunction} DELETE Function used to send DELETE requests
	 */
	/**
	 * @typedef RequestFunction
	 * @description Function used to send a request to the server
	 * @type {function}
	 * @param {string} url Url to send request to
	 * @param {object} args Object to send along with request
	 * @param {function} callback Function to call afterwards. It takes the following parameters
	 * @param {*} callback.response Object containing the body of the response
	 * @param {XHR} callback.xhr XHR response
	 */

	/**
	 * @name Methods
	 * @description Enum string values.
	 * @memberof client.DRENjs
	 * @readonly
	 * @enum {string}
	 */
	DRENjs.Methods = {
		POST: 1,
		GET: 2,
		PUT: 4,
		DELETE: 8
	};
	/**
	 * @function loadPage
	 * @description Load specified page and initialize new areas
	 * @memberof client.DRENjs
	 * @param {string} url Url to call
	 * @param {DRENjs.Methods} method The method of the request
	 * @param {object} [args] Object to send along with request
	 * @param {function} [callback] function to execute before initializing content with {DRENjs.init}
	 * @async
	 * @returns {undefined} Async
	 */
	DRENjs.loadPage = function (url, method, args, callback) {
		// Check the method
		method = method.toUpperCase();
		if (isNA(DRENjs.Methods[method])) {
			console.error('Trying to use unknown method ' + method);
			return;
		}
		// Log & push history
		console.info('Accessing url ' + url + ' via ' + method);
		history.pushState({}, null, url);
		// Do the request
		DRENjs.sendRequest[method.toUpperCase()](url, args, function (response, jwr) {
			log("Response",response, jwr);
			switch (jwr.statusCode) {
				case 200: {
					if (!isNA(response) && response) {
						if(Object.keys(response).length === 1 && response.reload === true){ // If ask to reload
							window.location.reload();
						} else if (response.constructor.name == 'Object') {
							if (response.head) {
							}
							var content = response.content;
							log(content)
							if (!isNA(content)) {
								if (typeof content == 'object') {
									for (var i in content) {
										log(i);
										if (!T.hop(content, i))
											continue;
										var value = content[i],
											initer = DRENjs.scriptsIniters[i],
											area = DRENjs.domElements.areas[i];

										if(!isNA(initer)){ // Try to unload
											if(initer.unload){
												initer.unload(area, T);
											}
										}

										if (typeof value === 'object') {
											area.innerHTML = value.html;
											area.setAttribute("data-containing", value.template_name)
										} else {
											area.innerHTML = value;
										}
										area.templateInited = undefined;
									}
								} else if (typeof content == 'string') {
									//log("Defining content", w.domElements.content);
									DRENjs.domElements.areas.content.innerHTML = content;
									DRENjs.domElements.areas.content.templateInited = undefined;
								} else {
									log("Response type not catched", content);
								}
							}
						}
					}
				}
					break;

				case 302: {
					DRENjs.loadPage(jwr.headers.location, "GET");
				} break;

				case 404: {
					break;
				}
			}
			if (!isNA(callback))
				callback.apply(response);
			DRENjs.init();
		});
	};

	DRENjs.pretendLoadPage = function(url){
		// Log & push history
		console.info('Pretending access url ' + url);
		history.pushState({}, null, url);
	}


	DRENjs.scriptsIniters = {};

	function loopRequire(scriptsRequired, scriptIndex, templatePath, template){
		var thisScript = scriptsRequired[scriptIndex];

		log("Doing script ", scriptIndex, thisScript)
		// Load the script and handle want was defined by it
		Require(thisScript, function(){
			log("Script required:", thisScript, arguments)
			for(var j = 0, J = arguments.length; j < J; j++){
				var defined = arguments[j];

				// If the definition is only a function, run it providing template & toolbox
				if(typeof defined == "function"){
					defined(template, T);
				} else if (typeof defined == "object"){ // else if this is an object, store it in memory and eventually run it
					DRENjs.scriptsIniters[templatePath] = defined;
					if(defined.load){
						defined.load(template, T);
					} else {
						console.error("Not catched");
					}
				} else if(!isNA(defined)){
					console.info("Script loader not catched", defined);
				}
			}
			scriptIndex++;
			if(scriptsRequired[scriptIndex]){
				log("Looping require");
				return loopRequire(scriptsRequired, scriptIndex, templatePath, template);
			}
		});
	}

	// Function to override default behaviors
	function bindType(type, events, eventHandler){
		var type_s = type + "s",
			prop = "bound_" + type;

		var unbound = DRENjs.domElements[type_s].filter(function (elem) {
			return elem[prop] ^ (elem[prop] = true);  // Returns true if `boundLink` is not set or false, and define it as true
		});
		if (unbound.length) {
			log("Bounding new "+type_s+":", unbound);
		}
		T.on(unbound, events, function (event) {
			event.preventDefault();
			eventHandler(event.target);
			return false;
		});
	}

	/**
	 * @function init
	 * @description Initialize new areas
	 * @memberof client.DRENjs
	 */
	DRENjs.init = function (t) {
		if(!T && t){
			T = t;
			isNA = T.isNA;
			qsa = T.qsa;
		}
		var domElements = {
			head: {
				title: T.qs('title'),
				description: T.qs('meta[name="description"]')
			},
			links: [].slice.call(qsa('a[drenjs][href^="/"]')),
			forms: [].slice.call(qsa('form[drenjs]')),
			areas: [].reduce.call(qsa('[data-content-area]'), function (previous, elem, index) {
				previous[elem.getAttribute('data-content-area')] = elem;
				return previous;
			}, {}),
			templates: [].reduce.call(qsa('[data-containing]'), function (previous, elem, index) {
				previous[elem.getAttribute('data-containing')] = elem;
				return previous;
			}, {})
		};
		/**
		 * @member domElements
		 * @description List of important DOM elements, such as metas, links or areas
		 * @memberof client.DRENjs
		 * @property {object} head Metas & page title
		 * @property {DOMElement[]} links Links to bind with DRENjs
		 * @property {object} areas Content areas handled by DRENjs
		 */
		DRENjs.domElements = domElements;

		// Override default link behavior
		bindType("link", ["click"], function(elem){
			DRENjs.loadPage(elem.href, 'GET', null);
		});
		// Override default form behavior
		bindType("form", ["submit"], function(elem){
			var formContent = T.formToObject(elem);
			if(typeof elem.getAttribute('data-noreload') !== "undefined"){
				DRENjs.sendRequest[elem.method.toUpperCase()](elem.action || T.w.location.href, formContent, function (response, jwr) {
					var newEvent = new CustomEvent('formresponded', {detail: {response: response, jwr: jwr}});
					elem.dispatchEvent(newEvent);
				});
			} else {
				DRENjs.loadPage(elem.action || T.w.location.href, elem.method.toUpperCase(), formContent, function(){
					var newEvent = new CustomEvent('formresponded', {detail: this});
					elem.dispatchEvent(newEvent);
				});
			}
		});

		if(!isNA(DRENjs.template_scripts)){
			var templatesUnInited = {};
			Object.keys(domElements.templates).filter(function(templateName){
				return domElements.templates[templateName].templateInited ^ (domElements.templates[templateName].templateInited = true)
			}).forEach(function(key){
				templatesUnInited[key] = domElements.templates[key];
			});
			if (Object.keys(templatesUnInited).length) {
				log('Initing new templates:', templatesUnInited);
			}

			// For each templates
			for(var i in templatesUnInited){
				if(!templatesUnInited.hasOwnProperty(i)) continue;

				// Asyncify
				setTimeout((function(templatePath, template, scriptsRequired){
					return function(){

						// Do nothing if no script associated with the template
						if(!scriptsRequired){
							return;
						}

						// Force format [[string]]
						if(scriptsRequired.constructor.name !== "Array"){
							scriptsRequired = [[scriptsRequired]];
						}
						if(scriptsRequired.filter(function(script){return script.constructor.name === "Array"}).length === 0){ // Force format [array]
							scriptsRequired = [scriptsRequired];
						}
						for(var k = 0, K = scriptsRequired.length; k < K; k++){
							if(scriptsRequired[k].constructor.name !== "Array"){
								scriptsRequired[k] = [scriptsRequired[k]];
							}
						}
						log("Requiring scripts successions: ",{template: templatePath, scripts: scriptsRequired});

						k = 0; // Reset counter
						return loopRequire(scriptsRequired, k, templatePath, template);
					}
				}(i, templatesUnInited[i], DRENjs.template_scripts[i])), 0);
			}
		}
		if(DRENjs.postInit){
			DRENjs.postInit();
		}
	};
}(window.DRENjs || (window.DRENjs = {})));
