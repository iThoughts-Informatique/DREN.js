/**
 * @file Main file of DRENjs
 *
 * @author Gerkin
 * @copyright 2016 GerkinDevelopment
 * @license https://raw.githubusercontent.com/iThoughts-Informatique/DREN.js/master/LICENSE GPL-3.0
 * @package dren.js
 *
 * @version 0.0.2
 */

/* jshint esversion: 6 */

/**
 * @namespace server
 * @description Server-side functions & classes
 */

/**
 * @typedef ClientSendRequest
 * @description Object describing how to send a request to the server
 * @property {string} file The script file to use. Must be absolute
 * @property {string} fct The function to use as {@link client.DRENjs.sendRequest}
 */

const crypto = require("crypto"),
	  path = require('path'),
	  fs = require('fs-extra'),
	  Tools = require('./DREN/Tools');

/**
 * @class DRENjs
 * @memberof server
 * @description Engine core, defining configuration of DRENjs
 * @param {object} conf Object defining how this instance will behave
 * @param {RenderFunction} conf.engine Function used to render a template
 * @param {string} conf.assetsDir Path to the directory containing the assets
 * @param {string} conf.assetsUrl Url to the directory containing the assets
 * @param {boolean} [conf.unminified = false] Serve unminified DRENjs client resources. Set to true to debug
 * @param {boolean} conf.mainClient Main client-side script (typically, the requirejs dependency handler)
 * @param {object} conf.templates_scripts Maps the templates arborescence with their associed scripts
 * @param {ClientSendRequest} [conf.clientSendRequest] TODO describe
 * @param {object} [conf.clientSide] Client-side additionnal conf
 * @param {boolean} [conf.clientSide.unminified = false] Same as conf.unminified. Takes predecence
 * @param {boolean} conf.clientSide.main Same as conf.main. Takes predecence
 * @param {object} conf.clientSide.templates_scripts Same as conf.templates_scripts. Takes predecence
 * @param {boolean} [conf.clientSide.nofix = false] Do not replace client-side files even if changed
 * @param {string[][]} [conf.clientSide.dependencies = [[]]] Url or array of urls to dependencies (for the clientSendRequest functions, for example)
 * @param {function} [conf.errorMessage] Function used to generate the error message. It takes a single parameter: the error
 * @param {object} [conf.log] Dictionnary of log functions to use
 * @param {server.DRENjs.ENVIRONMENTS} [conf.environment={@link server.DRENjs.ENVIRONMENTS:development}] Environment of the instance
 */
const DRENjs = function DRENjs(conf) {
	const unminified = (!Tools.isNA(conf.clientSide) && conf.clientSide.unminified === true) || (conf.unminified === true),
		  nofix = (!Tools.isNA(conf.clientSide) && conf.clientSide.nofix === true);

	this.minified = !unminified;

	if (!Tools.isNA(conf.log)) {
		Object.assign(Tools.log, conf.log);
	}

	if (typeof conf.engine !== 'function') {
		throw new ReferenceError('Missing required function parameter "conf.engine"');
	}
	this.engine = conf.engine;

	if (typeof conf.assetsDir !== "string") {
		throw new ReferenceError('Missing required string parameter "conf.assetsDir"');
	}
	this.assetsDir = conf.assetsDir;

	if (typeof conf.assetsUrl !== "string") {
		throw new ReferenceError('Missing required string parameter "conf.assetsUrl"');
	}
	this.assetsUrl = conf.assetsUrl;

	this.clientSide = {
		initDeps: [
			[
				this.assetsUrl + '/ithoughts-toolbox' + (unminified ? '' : '.min') + '.js'
			]
		]
	};
	this.clientSide.main = this.assetsUrl + '/dren' + (unminified ? '' : '.min') + '.js'
	/*
	(!Tools.isNA(conf.clientSide) && conf.clientSide.main) || conf.mainClient
	if (typeof this.clientSide.main !== "string") {
		throw new ReferenceError('Missing required string parameter "conf.clientSide.main"');
	}*/

	this.clientSide.template_scripts = (!Tools.isNA(conf.clientSide) && conf.clientSide.template_scripts) || conf.template_scripts;
	if (typeof this.clientSide.template_scripts !== "object") {
		throw new ReferenceError('Missing required string parameter "conf.clientSide.template_scripts"');
	}

	if(conf.clientSide.dependencies){
		this.clientSide.initDeps = this.clientSide.initDeps.concat(conf.clientSide.dependencies);
		/*	if(conf.clientSide.dependencies.constructor == []){
			this.clientSide.initDeps = this.clientSide.initDeps.concat(conf.clientSide.dependencies)
		} else if (typeof conf.clientSide.initDeps == "string"){
			this.clientSide.initDeps.push(conf.clientSide.dependencies)
		}*/
	}

	installClientSideLib(conf.assetsDir, nofix, 'require' + (unminified ? '' : '.min') + '.js');
	installClientSideLib(conf.assetsDir, nofix, 'dren' + (unminified ? '' : '.min') + '.js');
	installClientSideLib(conf.assetsDir, nofix, 'ithoughts-toolbox' + (unminified ? '' : '.min') + '.js');
	installClientSideLib(conf.assetsDir, nofix, 'dren' + (unminified ? '' : '.min') + '.css');

	if(Tools.isNA(conf.clientSendRequest)){
		installClientSideLib(conf.assetsDir, nofix, 'default-xhr' + (unminified ? '' : '.min') + '.js');
	} else {
		if((!!conf.clientSendRequest.file) ^ (!!conf.clientSendRequest.fct)){
			if(conf.clientSendRequest.file){
				if(this.clientSide.initDeps.filter(function(elem){ // Inject script in deps
					var index = elem.indexOf("clientSendRequest");
					if(index != -1){
						elem[index] = conf.clientSendRequest.file;
						return true;
					}
					return false;
				}).length == 0){
					throw 'Could not find "clientSendRequest" in dependencies';
				}
			} else {
				throw "Not implemented";
			}
		} else {
			throw new TypeError("Malformed clientSendRequest configuration object");
		}
	}



	/**
	 * @constant {server.Page} Page
	 * @memberof server.DRENjs
	 * @description Exposition of the {@link server.Page Page constructor}, configured with this DRENjs instance
	 * @readonly
	 * @instance
	 */
	const Page = (new require('./DREN/Page'))(this); // Inject DRENjs instance into the Page
	this.Page = Page;

	/**
	 * @constant {server.Template} Template
	 * @memberof server.DRENjs
	 * @description Exposition of the {@link server.Template Template constructor}, configured with this DRENjs instance
	 * @readonly
	 * @instance
	 */
	const Template = (new require('./DREN/Template'))(this); // Inject DRENjs instance into the Template
	this.Template = Template;


	if(typeof conf.errorMessage == "function"){
		this.Page.errorMessage = conf.errorMessage;
	}

	if(typeof conf.errorMessage == "function"){
		this.Template.errorMessage = conf.errorMessage;
	}
};
DRENjs.prototype.diffRender = function diffRender(thisPage, previousPage, callback) {
	return pageDiff(previousPage, thisPage, callback);
};

/**
 * @constant {server.Tools} Tools
 * @memberof server.DRENjs
 * @description Exposition of the {@link server.Tools Tools util object}, configured with this DRENjs instance
 * @readonly
 * @instance
 */
DRENjs.prototype.Tools = Tools;

/**
 * @constant {string} ENVIRONMENTS
 * @memberof server.DRENjs
 * @description Environments of DRENjs. Set to "Production" as soon as you won't change views to allow optimizations
 * @enum
 */
DRENjs.ENVIRONMENTS = Object.freeze({
	/**
	 * @property {string} server.DRENjs.ENVIRONMENTS.development
	 * @description Default environment if none specified
	 */
	development: 0,
	/**
	 * @property {string} server.DRENjs.ENVIRONMENTS.production
	 * @description Production environment. Some improvments & optimizations will be done... Later
	 */
	production: 1
});

/**
 * @function installClientSideLib
 * @description Check if the file in the assets directory need to be reinstalled.
 * @private
 * @param {string} assetsDir Path to the directory of assets
 * @param {boolean} nofix Set it to true if you don't want to rewrite changed lib files
 * @param {string} filename Name of the file to check or write
 * @param {string} [content] Content of the file to write
 */
function installClientSideLib(assetsDir, nofix, filename, content) {
	var installed = false,
		hashAssets,
		hashLib;
	const assetsFile = path.resolve(process.cwd(), assetsDir + '/' + filename),
		  libFile = path.resolve(__dirname, 'lib/client/' + filename);
	try {
		hashAssets = md5file(assetsFile);
		Tools.log.silly(`The MD5 sum of "${ filename }" in assets is "${ hashAssets }"`);
	} catch (e) {
		Tools.log.info(`"${ filename }" is not installed in the assets folder`);
		installed = doInstall();
	}
	if (!installed) {
		if(!nofix){
			if(Tools.isNA(content)){
				hashLib = md5file(libFile);
				Tools.log.silly(`The MD5 sum of "${ filename }" in lib is "${ hashLib }"`);
			} else {
				hashLib = md5string(content);
				Tools.log.silly(`The MD5 sum of "${ filename }" in lib GIVEN AS STRING is "${ hashLib }"`);
			}
			if (hashAssets !== hashLib) {
				Tools.log.warn('Checksums mismatch, reinstall the client side lib');
				installed = doInstall();
			}
		} else {
			Tools.log.warn("Nofix mode for file "+filename);
		}
	}
	function doInstall() {
		try {
			fs.copySync(libFile, assetsFile);
			Tools.log.silly(`"${ libFile }" successfully copied to "${ assetsFile }"`);
			return true;
		} catch (e) {
			Tools.log.error(`Could not copy "${ libFile }" to "${ assetsFile }": ${ e }`);
			return false;
		}
	}
}

/**
 * @namespace PageDiff
 */

/**
 * @function pageDiff
 */
function pageDiff(pageBefore, pageAfter, callback) {
	/**
	 * @function arrayDiff
	 * @description Returns an array that is the difference between the 2 arrays providen
	 * @memberof PageDiff
	 * @param {array} a1 First array
	 * @param {array} a2 Second array
	 * @return {array} Difference between both arrays
	 * @inner
	 */
	function arrayDiff(a1, a2) {
		var result = [];
		for (var i = 0; i < a1.length; i++) {
			if (a2.indexOf(a1[i]) === -1) {
				result.push(a1[i]);
			}
		}
		for (i = 0; i < a2.length; i++) {
			if (a1.indexOf(a2[i]) === -1) {
				result.push(a2[i]);
			}
		}
		return result;
	}

	/**
	 * @function arraySubstract
	 * @description Substract members of a2 from a1
	 * @memberof PageDiff
	 * @param {array} a1 First array
	 * @param {array} a2 Second array
	 * @return {array} Array where a2 is took off of a1
	 * @inner
	 */
	function arraySubstract(a1, a2) {
		var result = [];
		for (var i = 0; i < a1.length; i++) {
			if (a2.indexOf(a1[i]) === -1) {
				result.push(a1[i]);
			}
		}
		return result;
	}

	/**
	 * @function simplifyLevel
	 * @description Called by "reduce" with an object as "this" scope. Unwrap all sub-members to a single level
	 * @memberof PageDiff
	 * @param {*} prev Previous value
	 * @param {string} key Key used for this loop
	 * @param {number} index numerical index of the key
	 * @return {object} Single-level object with nested members names are joined with "." 
	 * @inner
	 */
	function simplifyLevel(prev, key, index) {
		var value = this[key];
		if(Tools.isNA(value)){
			return prev;
		}
		switch (value.constructor.name) {
			case 'Template': {
				prev[key] = value;
			}
				break;
			case 'Object': {
				var subDiff = Object.keys(value).reduce(simplifyLevel.bind(value), {});
				for (var i in subDiff) {
					prev[key + '.' + i] = subDiff[i];
				}
			}
				break;
		}
		return prev;
	}

	function templateDiff(templateBefore, templateAfter) {
		if (templateBefore.fileName != templateAfter.fileName) {
			return templateAfter;
		} else if (templateAfter.options.forceReload === true) {
			return templateAfter;
		} else {
			var templateContentDiff = objectDiff(templateBefore.content, templateAfter.content);
			if (templateContentDiff === true) {
				return templateAfter;
			} else {
				return templateContentDiff;
			}
		}
	}
	function objectDiff(a, b) {
		if (typeof a != 'object' || typeof b != 'object') {
			return true;
		}
		var container = {},
			keys = Object.keys(a).concat(Object.keys(b)).filter(function (item, pos, self) {
				return self.indexOf(item) == pos;
			})
		for (var i = 0, I = keys.length; i < I; i++) {
			var key = keys[i], av = a[key], bv = b[key];
			if (typeof av !== typeof bv) {
				if (Tools.isNA(bv)) {
					return true;
				}
				if (bv.constructor.name === 'Template') {
					return bv;
				}
				return true;
			}
			var diff;
			if(Tools.isNA(b[key])){
				return true;
			}
			switch (b[key].constructor.name) {
				case 'Template': {
					diff = templateDiff(av, bv);
					if (diff === true) {
						return bv;
					} else {
						if(!container){
							container = {};
						}
						container[key] = diff;
					}
				}
					break;
				case 'Object': {
					diff = objectDiff(av, bv);
					if (diff === true) {
						if(!container){
							container = {};
						}
						container[key] = diff;
					}
				}
					break;
				case 'Array': {
					if (av.length != bv.length) {
						return true;
					}
					diff = objectDiff(av, bv);
					if (diff === true) {
						if(!container){
							container = {};
						}
						container[key] = diff;
					}
				}
					break;
				default: {
					if(av !== bv){
						return true;
					}
				}
			}
		}
		return container;
	}

	function pageNotMetaDiff(pageBefore, pageAfter){
		const ignoredDiffs = ["metas"];

		const attrsSum = Object.keys(pageBefore.infos).concat(Object.keys(pageAfter.infos));

		var mustExit = false;
		const attrs = arraySubstract(attrsSum, ignoredDiffs).filter(function onlyUnique(value, index, self) {
			if(mustExit){
				return false;
			}
			var diff = self.indexOf(value);
			if(diff === -1){
				mustExit = true;
				return;
			}
			return diff === index;
		});
		if(mustExit){
			return "notSameSize";
		}

		for(var i = 0, I = attrs.length; i < I; i++){
			var attr = attrs[i];
			let diff = objectDiff(pageBefore.infos[attr], pageAfter.infos[attr]);
			if(diff && (typeof diff !== "object" || Object.keys(diff).length > 5)){
				return {diff, attrBefore:pageBefore.infos[attr], attrAfter: pageAfter.infos[attr]};
			}
		}
	}


var swap;
	if (pageBefore.fileName != pageAfter.fileName) {
		Tools.log.verbose('Page changed file');
		return pageAfter.render(callback);
	} else if(swap = pageNotMetaDiff(pageBefore, pageAfter)){
		Tools.log.verbose(`Page changed constants:${ JSON.stringify(swap) }`);
		return callback(null, {reload: true});
	} else {
		sails.log.silly('Looking into templates');
		var diff = templateDiff(pageBefore.content, pageAfter.content);
		console.log(diff);
		if(diff){
			diff = {
				content:diff
			};
		} else {
			return callback(null, {});
		}
		var monolevelDiff = Object.keys(diff).reduce(simplifyLevel.bind(diff), {});
		Tools.log.silly(`Diffs aligned on same level is: ${ JSON.stringify(monolevelDiff) }`);
		if (monolevelDiff && Object.keys(monolevelDiff).length > 0) {
			// check if diff contains something
			Tools.log.verbose('Page have area changes');
			var linker = {};
			Async.mapValues(monolevelDiff, function (value, key, cb) {
				value.render(key, linker, function(err, html){
					cb(err, {
						template_name: value.fileName,
						html: html
					});
				});
			}, function (err, content) {
				return callback(err, { content: content });
			});
		} else {
			Tools.log.verbose('Page have no area changes');
			return callback(null, {});
		}
	}
}

module.exports = DRENjs;


function md5string(string){
	return crypto
		.createHash('md5')
		.update(string, 'utf8')
		.digest('hex');
}
function md5file(file){
	return crypto
		.createHash('md5')
		.update(fs.readFileSync(path.resolve(".", file), 'utf8'),'utf8')
		.digest('hex');
}