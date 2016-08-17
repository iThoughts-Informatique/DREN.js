const Tools = require('./Tools'),
	  Template = function Template(filename, content, options){

		  this.fileName = filename;
		  this.options = options || {};
		  this.content = content;
	  }
Template.fromJson = function fromJson(json, linker){
	if(isNA(linker)){
		linker = {};
	}
	if(linker[json.id]){
		return linker[json.id]
	}

	if(json.type != "template"){
		throw "";
	}

	function nestedTemplatesParse(object){
		var newObj = {};
		for(var k in object){
			var value = object[k];
			if(!isNA(value)){
				if(Template.testJson(value)){
					newObj[k] = Template.fromJson(value, linker);
				} 
				if(isNA(newObj[k])){
					switch(value.constructor.name){
						case "Template":{
							newObj[k] = Template.fromJson(value, linker);
						} break;

						case "Object":
						case "Array":{
							newObj[k] = nestedTemplatesParse(value);
						} break;

						default:{
							newObj[k] = value;
						} break;
					}
				}
			}
		}
		return newObj;
	}
	if(Template.testJson(json)){
		return new Template(json.fileName, json.options, nestedTemplatesParse(json.content));
	}
	return undefined;
}
Template.testJson = function(json){
	return json.type && json.fileName && json.options && json.content && json.id
}
Template.prototype.toJson = function toJson(linker){
	function nestedTemplatesToJson(object){
		var newObj = {};
		for(var k in object){
			var value = object[k];
			if(!isNA(value)){
				switch(value.constructor.name){
					case "Template":{
						newObj[k] = value.toJson(linker);
					} break;

					case "Object":{
						newObj[k] = nestedTemplatesToJson(value);
					} break;

					case "Array":{
						newObj[k] = value;
					} break;

					default:{
						newObj[k] = value;
					} break;
				}
			}
		}
		return newObj;
	}



	var linkerKeys = Object.keys(linker),
		linkerKeysLength = linkerKeys.length,
		i = -1,
		json = {
			type: "template"
		},
		id;
	while(++i < linkerKeysLength){
		var linkerKey = linkerKeys[i],
			linkerItem = linker[linkerKey];
		if(linkerKey === this){
			sails.log.silly("==> Reusing reference " + linkerKey);
			json.id = linkerKey;
			return json;
		}
	}

	do {
		id = Tools.randomString(16)
	} while(linker[id]);
	linker[id] = this;
	return {
		type: "template",
		id: id,
		fileName: this.fileName,
		options: this.options,
		content: nestedTemplatesToJson(this.content)
	}
}
Template.prototype.render = function render(page, prefix, linker, callback){
	var self = this;

	function nestedTemplatesToRenders(object, cbR){
		Async.mapValues(object, function(value, key, cb){
			if(!isNA(value)){
				switch(value.constructor.name){
					case "Template":{
						var subk = prefix + '.' + key;
						value.render(page, subk, linker, function(err, data){
							cb(err, '<div data-content-area="' + subk + '">' + data + '</div>');
						});
					} break;

					case "Object":{
						nestedTemplatesToRenders(value, cb);
					} break;

					case "Array":{
						cb(null, value);
					} break;

					default:{
						cb(null,value);
					} break;
				}
			}
		}, function(err, out){
			if(err){
				sails.log.error("Error during composition content of Template:", out, err);
			};
			cbR(err, !err ? out : page.errorMessage(err));
		});
	}

	nestedTemplatesToRenders(this.content, function(err, data){
		if(err){
			return callback(err, data);
		}
		sails.log.silly("Rendering " + self.fileName + " with ", data);
		Tools.engine("../"+self.fileName+".ect", data, function(err, out){
			if(err){
				sails.log.error("Error during render of Template:", data, err);
			};
			callback(err, !err ? out : page.errorMessage(err));
		});
	})
}

module.exports = Template;