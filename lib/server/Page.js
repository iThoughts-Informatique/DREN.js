/**
 * @file Page class file
 *
 * @author Gerkin
 * @copyright 2016 GerkinDevelopment
 * @license https://raw.githubusercontent.com/iThoughts-Informatique/DREN.js/master/LICENSE GPL-3.0
 * @package dren.js
 *
 * @version 0.0.2
 */

/* jshint esversion: 6 */
const check = require('check-types'),
	  _ = require('lodash');

module.exports = (DRENjs=>{
	const Tools = DRENjs.Tools;

	/**
	 * @class Page
	 * @memberof server
	 * @description Top-level object representing a web-page. It usually contains the page title, metas, links to script & styles, etc etc
	 * @param {string} title The title of the page
	 * @param {string} filename The path to the Page file
	 * @param {object} infos Additionnal options
	 * @param {boolean} [infos.reload=false] Force reload the page
	 * @param {Template} content Template to use as content
	 */
	const Page = function Page(title, filename, infos, content) {
		this.title = title;
		this.filename = filename;
		this.infos = infos;
		if(content.constructor.name !== "Template"){
			throw new TypeError(`"content" should be a Template`);
		}
		this.content = content;
	};

	/**
	 * @member DRENjs
	 * @description Reference to the {@link DRENjs DRENjs instance}.
	 * @memberof server.Page
	 * @static
	 * @type {server.DRENjs}
	 */
	Page.DRENjs = DRENjs;

	/**
	 * @member cacheValidation
	 * @description Validation items
	 * @memberof server.Page
	 * @instance
	 * @type {object}
	 */
	Page.prototype.cacheValidation = {};

	/**
	 * @method fromJson
	 * @description Parse the given object to a Page instance. The object should have been generated using {@link Page#toJson}.
	 * @memberof server.Page
	 * @static
	 * @param {object} json The JSON to parse as Page
	 * @returns {Page} The parsed page
	 */
	Page.fromJson = function fromJson(json) {
		if (Tools.isNA(json)) {
			throw new TypeError('Page.fromJson on undefined');
		}
		if (json.constructor.name !== 'Object') {
			throw new TypeError('Page.fromJson argument is not an object');
		}
		if (json.type !== 'page') {
			throw new TypeError('Page.fromJson first level object has unexpected \'type\' => ' + JSON.stringify(json.type));
		}
		const parsedPage = new Page(json.title, json.filename, json.infos, Template.fromJson(json.content, {}));
		parsedPage.cacheValidation = json.cacheValidation;
		return parsedPage;
	};

	/**
	 * @method errorMessage
	 * @description Function used to generate the error message.
	 * @memberof server.Page
	 * @instance
	 * @param {Error} err The error generated
	 * @returns {string} The error string
	 */
	Page.prototype.errorMessage = Tools.generateErrorMessage;

	/**
	 * @method toJson
	 * @description Converts the Page instance and its components in plain JS object, allowing to store it as a string
	 * @memberof server.Page
	 * @instance
	 * @returns {object} The JSON object allowing to parse this page
	 */
	Page.prototype.toJson = function toJson() {
		var linker = {};
		return {
			type: 'page',
			filename: this.filename,
			title: this.title,
			infos: this.infos,
			content: Tools.isNA(this.content) ? {} : this.content.toJson(linker),
			cacheValidation: this.cacheValidation
		};
	};

	/**
	 * @method render
	 * @description Render each components to generate the response
	 * @memberof server.Page
	 * @instance
	 * @param {FailableCallback} callback Function to call afterwards with the result
	 * @async
	 * @returns {undefined} Async
	 */
	Page.prototype.render = function render(callback) {
		const thisPage = this;
		thisPage.content._page = thisPage.infos;
		thisPage.content.render('content', {}, function (err, content) {
			if (err) {
				sails.log.error('Error during render of page:', err);
				content = content || Page.errorMessage(err);
			}

			// Data used to render the Page template
			var data = {
				content: '<div data-content-area="content" data-containing="'+thisPage.content.filename+'">' + content + '</div>',
				title: thisPage.title,
				scripts: {
					head: '',
					foot: ''
				},
				styles: '<link rel="stylesheet" type="text/css" href="'+Page.DRENjs.assetsUrl.css+'/dren'+(Page.DRENjs.minified ? '.min' : '')+'.css"/>',
				registerLink: Tools.registerLink
			};

			var headScripts = [
				'<script id="initDeps">(window.DRENjs || (window.DRENjs = {})).initDeps = '+JSON.stringify(Page.DRENjs.clientSide.initDeps, null, 4)+';</script>',
				'<script id="requirejs" data-main="'+Page.DRENjs.clientSide.main+'" src="'+Page.DRENjs.assetsUrl.js+'/require'+(Page.DRENjs.minified ? '.min' : '')+'.js" async></script>',
			];
			if(check.object(Page.DRENjs.templatesConfig.templateScripts)){
				headScripts.push('<script id="template_scripts">(window.DRENjs || (window.DRENjs = {})).template_scripts = '+JSON.stringify(Page.DRENjs.templatesConfig.templateScripts, null, 4)+';</script>');
			} else if(check.nonEmptyString(Page.DRENjs.templatesConfig.templateScripts)){
				headScripts.push('<script id="template_scripts">(window.DRENjs || (window.DRENjs = {})).template_scripts = "'+Page.DRENjs.templatesConfig.templateScripts+'";</script>');
			}
			data.scripts.head = headScripts.join("\n");

			const skipProp = [
					'title',
					'filename',
					'content',
					'toJson',
					'render'
				];
			for (var i in thisPage.infos) {
				if (skipProp.indexOf(i) === -1) {
					data[i] = thisPage.infos[i];
				}
			}
			Page.DRENjs.engine(thisPage.filename + Page.DRENjs.ext, data, function (err, out) {
				if (err) {
					sails.log.error('Error during render of Page:', data, err);
				}
				callback(err, !err ? out : thisPage.errorMessage(err));
			});
		});
	};

	return Page;
});
