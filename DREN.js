/**
 * @file Main includer file
 *
 * @author Gerkin
 * @copyright 2016 GerkinDevelopment
 * @license https://raw.githubusercontent.com/iThoughts-Informatique/DREN.js/master/LICENSE GPL-3.0
 * @package DRENjs
 *
 * @version 0.0.1
 */

module.exports = {
	render: function(){
		switch(arguments.length){
			case 3:{
				renderOrJsonPage.apply(null, arguments);
			} break;
			case 4:{
				renderOrJsonFile.apply(null, arguments);
			} break;
		}	
	},
	Page: require("./DREN/Page"),
	Template: require("./DREN/Template"),
}

function renderOrJsonFile(file, args, req, res){
	var engine = sails.config.views.engine.fn;
	engine("../"+file+".ect", args, function(err, bodyContent){
		args.bodyContent = bodyContent;
		if(err){
			sails.log.error(err);
			return res.serverError();
		}
		if(req.isSocket){
			sails.log.silly("Responding to socket");
			return res.json(args);
		} else {
			sails.log.silly("Responding to Http");
			addConstant(args);
			return res.view("layouts/main", args);
		}
	});
}
function renderOrJsonPage(page, req, res){
	var err;
	var timer = new Date().getTime();
	if(req.isSocket){
		sails.log.silly("Responding to socket");
		if(isNA(req.session.previousPage)){
			var response = {reload: true};
			if(res.constructor.name === "Function"){
				return res(null, response)
			} else {
				return res.json(response);
			}
		} else {
			return pageDiff(Page.fromJson(req.session.previousPage), page, function(err, diff){
				req.session.previousPage = page.toJson();
				sails.log.silly("Rendered Diff in " + (new Date().getTime() - timer) + "ms");
				if(res.constructor.name === "Function"){
					return res(null, diff)
				} else {
					return res.json(diff);
				}
			});
		}
	} else {
		sails.log.silly("Responding to Http");
		req.session.previousPage = page.toJson();
		page.render(function(err, html){
			sails.log.silly("Rendered Page in " + (new Date().getTime() - timer) + "ms");
			if(res.constructor.name === "Function"){
				return res(null, html)
			} else {
				return res.send(200, html);
			}
		});
	}
}

/**
 * @namespace PageDiff
 */
/**
 * @function pageDiff
 */
function pageDiff(pageBefore, pageAfter, callback){
	
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
	function simplifyLevel(prev, key, index){
		var value = this[key];
		switch(value.constructor.name){
			case "Template": {
				prev[key] = value;
			} break;

			case "Object": {
				var subDiff = Object.keys(value).reduce(simplifyLevel.bind(value), {});
				for(var i in subDiff){
					prev[key + "." + i] = subDiff[i];
				}
			} break;
		}
		return prev;
	}

	if(pageBefore.fileName != pageAfter.fileName){
		sails.log.silly("Page changed file");
		return pageAfter.render(callback);
	} else {
		var diff = {content:templateDiff(pageBefore.content, pageAfter.content)},
			monolevelDiff = Object.keys(diff).reduce(simplifyLevel.bind(diff), {});
		if(diff){// check if diff contains something
			sails.log.silly("Page have area changes");
			var linker = {};
			Async.mapValues(monolevelDiff, function(value, key, cb){
				value.render(pageAfter, key, linker, cb);
			}, function(err, content){
				return callback(err, {content:content});
			});
		} else{
			sails.log.silly("Page have no area changes");
			callback(null, {});
		}
	}


	function templateDiff(templateBefore, templateAfter){
		if(templateBefore.fileName != templateAfter.fileName){
			return templateAfter;
		} else if(templateAfter.options.forceReload === true){
			return templateAfter;
		} else {
			var templateContentDiff = objectDiff(templateBefore.content, templateAfter.content);
			if(templateContentDiff === true){
				return templateAfter;
			} else {
				return templateContentDiff;
			}
		}
	}
	function objectDiff(a,b){
		if(typeof a != "object" || typeof b != "object"){
			return true;
		}

		var keys = Object.keys(a).concat(Object.keys(b)).filter(function(item, pos, self){return self.indexOf(item)==pos;});
		for(var i = 0, I = keys.length; i < I; i++){
			var key = keys[i],
				av = a[key],
				bv = b[key];
			if(typeof av !== typeof bv){
				if(isNA(bv)){
					return true;
				}
				if(bv.constructor.name === "Template"){
					return bv;
				}
				return true;
			}
			switch(b[key].constructor.name){
				case "Template":{
					var diff = templateDiff(av, bv);
					if(diff === true){
						return bv;
					} else {
						var container = {};
						container[key] = diff;
						return container;
					}
				} break;

				case "Object": {
					var diff = objectDiff(av, bv);
					if(diff === true){
						return b[key];
					} else {
						var container = {};
						container[key] = diff;
						return container;
					}
				} break

				case "Array": {
					if(av.length != bv.length){
						return true;
					}
					var diff = objectDiff(av, bv);
					if(diff === true){
						return bv;
					} else {
						var container = {};
						container[key] = diff;
						return container;
					}
				} break

				default: {
					return av === bv;
				}
			}
		}
		return false;
	}
}