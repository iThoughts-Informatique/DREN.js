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

module.exports = (DRENjs=>{
	const Tools = DRENjs.Tools;

	/**
 * @class Page
 * @memberof server
 * @description Top-level object representing a web-page. It usually contains the page title, metas, links to script & styles, etc etc
 * @param {string} title The title of the page
 * @param {string} fileName The path to the Page file
 * @param {object} infos Additionnal options
 * @param {boolean} [infos.reload=false] Force reload the page
 * @param {Template} content Template to use as content
 */
	const Page = function Page(title, fileName, infos, content) {
		this.title = title;
		this.fileName = fileName;
		this.infos = infos;
		if(content.constructor.name !== "Template"){
			throw new TypeError(`"content" should be a Template`);
		}
		this.content = content;
	};

	Page.DRENjs = DRENjs;

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
		return new Page(json.title, json.fileName, json.infos, Template.fromJson(json.content, {}));
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
			fileName: this.fileName,
			title: this.title,
			infos: this.infos,
			content: Tools.isNA(this.content) ? {} : this.content.toJson(linker)
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
		var self = this;
		this.content.render('content', {}, function (err, content) {
			if (err) {
				sails.log.error('Error during render of page:', err);
				content = content || Page.errorMessage(err);
			}
			var data = {
				content: '<div data-content-area="content" data-containing="'+self.content.fileName+'">' + content + '</div>',
				title: self.title,
				scripts: {
					head: '',
					foot: ''
				},
				styles: '<link rel="stylesheet" type="text/css" href="'+Page.DRENjs.assetsUrl+'/dren'+(Page.DRENjs.minified ? '.min' : '')+'.css"/>',
				registerLink: Tools.registerLink
			};

			var headScripts = [
				'<script id="initDeps">(window.DRENjs || (window.DRENjs = {})).initDeps = '+JSON.stringify(Page.DRENjs.clientSide.initDeps, null, 4)+';</script>',
				'<script id="requirejs" data-main="'+Page.DRENjs.clientSide.main+'" src="'+Page.DRENjs.assetsUrl+'/require'+(Page.DRENjs.minified ? '.min' : '')+'.js" async></script>',
				'<script id="template_scripts">(window.DRENjs || (window.DRENjs = {})).template_scripts = '+JSON.stringify(Page.DRENjs.clientSide.template_scripts, null, 4)+';</script>',
			];
			data.scripts.head = headScripts.join("\n");

			for (var i in self.infos) {
				if ([
					'title',
					'filename',
					'content',
					'toJson',
					'render'
				].indexOf(i) === -1 && typeof self.infos[i] != 'function', 'infos') {
					data[i] = self.infos[i];
				}
			}
			Page.DRENjs.engine(self.fileName + '.ect', data, function (err, out) {
				if (err) {
					sails.log.error('Error during render of Page:', data, err);
				}
				callback(err, !err ? out : self.errorMessage(err));
			});
		});
	};

	return Page;
});
