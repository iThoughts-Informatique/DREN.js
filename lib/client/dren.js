/**
 * @namespace client
 * @description Client-side functions
 */
/**
 * @namespace DRENjs
 * @description DRENjs client-side framework
 * @memberof client
 */
(function (D, T) {
	'use strict';

	var chainedDeps = [["/js/ithoughts-toolbox.js"]].concat(D.initDeps),
		i = 0,
		I = chainedDeps.length;
	function iterateDeps(){
		var callback = i === I - 1 ? endInitDeps : iterateDeps;
		console.log(chainedDeps[i], i);
		requirejs(chainedDeps[i], callback);
		i++;
	}
	function endInitDeps(){
		var DRENjs = window.DRENjs,
			iThoughts_Toolbox = window.iThoughts_Toolbox;
		DRENjs.init(iThoughts_Toolbox);
	}
	iterateDeps();

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
	D.Methods = {
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
	D.loadPage = function (url, method, args, callback) {
		// Check the method
		method = method.toUpperCase();
		if (T.isNA(D.Methods[method])) {
			console.error('Trying to use unknown method ' + method);
			return;
		}
		// Log & push history
		console.info('Accessing url ' + url + ' via ' + method);
		history.pushState({}, null, url);
		// Do the request
		D.sendRequest[method.toUpperCase()](url, args, function (response, jwr) {
			console.log(response, jwr);
			switch (jwr.statusCode) {
				case 200: {
					if (!T.isNA(response) && response) {
						if (response.constructor.name == 'Object') {
							if (response.head) {
							}
							var content = response.content;
							if (!T.isNA(content)) {
								if (typeof content == 'object') {
									for (var i in content) {
										if (!T.hop(content, i))
											continue;
										var value = content[i],
											initer = D.scriptsIniters[i],
											area = D.domElements.areas[i];
										
										if(!T.isNA(initer)){ // Try to unload
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
									//console.log("Defining content", w.domElements.content);
									D.domElements.areas.content.innerHTML = content;
									D.domElements.areas.content.templateInited = undefined;
								} else {
									console.log("Not catched");
								}
							}
						}
					}
				}
					break;
				case 404: {
					break;
				}
			}
			if (!T.isNA(callback))
				callback.apply(response);
			D.init();
		});
	};
	
	
	D.scriptsIniters = {};
	
	/**
	 * @function init
	 * @description Initialize new areas
	 * @memberof client.DRENjs
	 */
	D.init = function (t) {
		if(!T && t){
			T = t;
		}
		var domElements = {
			head: {
				title: T.qs('title'),
				description: T.qs('meta[name="description"]')
			},
			links: [].slice.call(T.qsa('a[drenjs][href^="/"]')),
			areas: [].reduce.call(T.qsa('[data-content-area]'), function (previous, elem, index) {
				previous[elem.getAttribute('data-content-area')] = elem;
				return previous;
			}, {}),
			templates: [].reduce.call(T.qsa('[data-containing]'), function (previous, elem, index) {
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
		D.domElements = domElements;

		console.log(domElements.templates);



		var unbound = domElements.links.filter(function (elem) {
			return elem.boundLink ^ (elem.boundLink = true);  // Returns true if `boundLink` is not set or false, and define it as true
		});
		if (unbound.length) {
			console.log('Bonding new links:', unbound);
		}
		T.on(unbound, ['click'], function (event) {
			event.preventDefault();
			D.loadPage(event.target.href, 'GET', null);
			return false;
		});

		if(!T.isNA(D.template_scripts)){
			var templatesUnInited = {};
			Object.keys(domElements.templates).filter(function(templateName){
				return domElements.templates[templateName].templateInited ^ (domElements.templates[templateName].templateInited = true)
			}).forEach(function(key){
				templatesUnInited[key] = domElements.templates[key];
			});
			if (Object.keys(templatesUnInited).length) {
				console.log('Initing new templates:', templatesUnInited);
			}
			for(var i in templatesUnInited){
				if(!templatesUnInited.hasOwnProperty(i)) continue;
				var scripts = D.template_scripts[i];
				console.log("Requiring ",scripts);
				if(scripts.constructor !== []){
					scripts = [scripts];
					console.log("Force cast to array");
				}
				if(scripts){
					requirejs(scripts, function(){
						for(var j = 0, J = arguments.length; j < J; j++){
							var templateObject = arguments[j];
							if(typeof templateObject == "function"){
								templateObject(templatesUnInited[i], T);
							} else if (typeof templateObject == "object"){
								D.scriptsIniters[i] = templateObject;
								if(templateObject.load){
									templateObject.load(templatesUnInited[i], T);
								} else {
									console.error("Not catched");
								}
							} else {
								console.error("Not catched");
							}
						}
					});
				}
			}
		}
		if(D.postInit){
			D.postInit();
		}
	};
}(window.DRENjs || (window.DRENjs = {})));