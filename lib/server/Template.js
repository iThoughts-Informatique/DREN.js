/**
 * @file Template class file
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

/**
 * @typedef {object} Linker
 * @description Used to handle references while parsing/jsoning Templates
 */

module.exports = (DRENjs=>{
	const Tools = DRENjs.Tools;
	/**
 * @class Template
 * @memberof server
 * @description A Template is like a "partial" in other rendering engines. It can't be the top level markup, and thus, should not contain the <html>, <body> or <head> tags, which should be in the Page file
 * @param {string} filename The path to the Template ECT file
 * @param {object} content Parameters given to the template for rendering
 * @param {object} [options] Additionnal options
 * @param {object} [options.allowed = []] Other templates filename that can be in this slot, and which may not be replaced. Thus, the <em>filename</em> would be a "default" value
 */
	const Template = function Template(filename, content, options) {
		if(!(this.placeholder = Tools.isNA(filename) && Tools.isNA(content) && Tools.isNA(options))){
			this.filename = filename;
			this.options = options || {};
			this.content = content;
		}
	};

	Template.DRENjs = DRENjs;

	/**
 * @method fromJson
 * @description Parse the given object to a Template instance. The object should have been generated using {@link Template#toJson}.
 * @memberof server.Template
 * @static
 * @param {object} json The JSON to parse as Template
 * @param {Linker} linker Used to keep references between templates
 * @param {boolean} [skipTest = false] Set to true to avoid double check
 * @returns {Template} The parsed Template
 */
	Template.fromJson = function fromJson(json, linker, skipTest) {
		skipTest = !!skipTest;
		if (Tools.isNA(linker)) {
			linker = {};
		}
		if (linker[json.id]) {
			return linker[json.id];
		}
		if (json.type != 'template') {
			throw '';
		}
		function nestedTemplatesParse(object) {
			var newObj = {};
			for (var k in object) {
				var value = object[k];
				if (!Tools.isNA(value)) {
					if (Template.testJson(value)) {
						newObj[k] = Template.fromJson(value, linker, true);
					}
					if (Tools.isNA(newObj[k])) {
						switch (value.constructor.name) {
							case 'Template': {
								newObj[k] = Template.fromJson(value, linker);
							}
								break;
							case 'Object':
							case 'Array': {
								newObj[k] = nestedTemplatesParse(value);
							}
								break;
							default: {
								newObj[k] = value;
							}
								break;
						}
					}
				}
			}
			return newObj;
		}
		if (skipTest || Template.testJson(json)) {
			if(json.placeholder){
				return new Template();
			} else {
				return new Template(json.filename, nestedTemplatesParse(json.content), json.options);
			}
		}
		return undefined;
	};

	/**
 * @method errorMessage
 * @description Function used to generate the error message.
 * @memberof Page
 * @instance
 * @param {Error} err The error generated
 * @returns {string} The error string
 */
	Template.prototype.errorMessage = Tools.generateErrorMessage;

	/**
 * @method testJson
 * @description Check if given plain object seems to be a valid JSON of Template
 * @memberof server.Template
 * @static
 * @param {object} json The JSON to test
 * @returns {boolean} True if it seems ok, false otherwise
 */
	Template.testJson = function (json) {
		return json.type && (json.placeholder || (!json.placeholder && (json.filename && json.options && json.content && json.id)));
	};

	/**
 * @method toJson
 * @description Converts the Template in a simple JSON object
 * @memberof Tempalte
 * @instance
 * @param {Linker} linker Used to keep references between templates
 * @returns {Template} The parsed Template
 */
	Template.prototype.toJson = function toJson(linker) {
		function nestedTemplatesToJson(object) {
			var newObj = {};
			for (var k in object) {
				var value = object[k];
				if (!Tools.isNA(value)) {
					switch (value.constructor.name) {
						case 'Template': {
							newObj[k] = value.toJson(linker);
						}
							break;
						case 'Object': {
							newObj[k] = nestedTemplatesToJson(value);
						}
							break;
						case 'Array': {
							newObj[k] = value;
						}
							break;
						default: {
							newObj[k] = value;
						}
							break;
					}
				}
			}
			return newObj;
		}
		var linkerKeys = Object.keys(linker), linkerKeysLength = linkerKeys.length, i = -1, json = { type: 'template' }, id;
		while (++i < linkerKeysLength) {
			var linkerKey = linkerKeys[i], linkerItem = linker[linkerKey];
			if (linkerKey === this) {
				sails.log.silly('==> Reusing reference ' + linkerKey);
				json.id = linkerKey;
				return json;
			}
		}
		do {
			id = Tools.randomString(16);
		} while (linker[id]);
		linker[id] = this;

		return this.placeholder ? {
			type: 'template',
			id: id,
			placeholder: true
		} : {
			type: 'template',
			id: id,
			filename: this.filename,
			options: this.options,
			content: nestedTemplatesToJson(this.content),
			placeholder: false
		};
	};

	/**
 * @method render
 * @description Render each components to generate the response
 * @memberof server.Template
 * @instance
 * @param {string} prefix String used to mark the path to the template
 * @param {Linker} linker Used to keep track of relations
 * @param {FailableCallback} callback Function to call afterwards with the result
 * @async
 * @returns {undefined} Async
 */
	Template.prototype.render = function render(prefix, linker, callback) {
		const thisTemplate = this;

		function nestedTemplatesToRenders(object, cbR) {
			return Async.mapValues(object, function (value, key, cb) {
				if (!Tools.isNA(value)) {
					switch (value.constructor.name) {
						case 'Template': {
							var subk = prefix + '.' + key;
							if(value.placeholder){
								return cb(null, '<div data-content-area="' + subk + '" data-containing="_"></div>');
							} else {
								value._page = thisTemplate._page;
								return value.render(subk, linker, function (err, data) {
									if(err){
										console.error(err);
									}
									return cb(err, '<div data-content-area="' + subk + '"><div data-containing="'+value.filename+'">' + data + '</div></div>');
								});
							}
						}
							break;
						case 'Object': {
							return nestedTemplatesToRenders(value, cb);
						}
							break;
						case 'Array': {
							return cb(null, value);
						}
							break;
						default: {
							return cb(null, value);
						}
							break;
					}
				} else {
					return cb(null, value);
				}
			}, function (err, out) {
				if (err) {
					sails.log.error('Error during composition content of Template:', out, err);
				}
				cbR(err, !err ? out : thisTemplate.errorMessage(err));
			});
		}

		nestedTemplatesToRenders(this.content, function (err, data) {
			if (err) {
				return callback(err, data);
			}
			_.extend(data, {
				registerLink: Tools.registerLink,
				insertTemplate: Tools.insertTemplate,
				key: prefix,
				_page: thisTemplate._page
			});
			//sails.log.silly('Rendering ' + self.filename + ' with ', data);
			Template.DRENjs.engine(thisTemplate.filename + Template.DRENjs.ext, data, function (err, out) {
				if (err) {
					sails.log.error('Error during render of Template:', data, err);
				}
				callback(err, !err ? out : thisTemplate.errorMessage(err));
			});
		});
	};

	return Template;
});
