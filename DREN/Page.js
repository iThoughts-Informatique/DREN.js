const Tools = require('./Tools'),
	  Page = function Page(title, fileName, infos, content){
		  this.title = title;
		  this.fileName = fileName;
		  this.infos = infos;
		  this.content = content;
	  };
Page.fromJson = function fromJson(json){
	if(isNA(json)){
		throw new TypeError("Page.fromJson on undefined");
	}
	if(json.constructor.name !== "Object"){
		throw new TypeError("Page.fromJson argument is not an object");
	}
	if(!json.type === "page"){
		throw new TypeError("Page.fromJson first level object has unexpected 'type' => " + JSON.stringify(json.type));
	}
	return new Page(json.title, json.fileName, json.infos, Template.fromJson(json.content, {}))
}
Page.prototype.errorMessage = Tools.generateErrorMessage;
Page.prototype.toJson = function toJson(){
	var linker = {};
	return {
		type: "page",
		fileName: this.fileName,
		title: this.title,
		infos: this.infos,
		content: isNA(this.content) ? {} : this.content.toJson(linker)
	}
}
Page.prototype.render = function render(callback){
	var self = this;
	this.content.render(this, 'content', {}, function(err,content){
		if(err){
			sails.log.error("Error during render of page:",err);
			content = content || page.errorMessage(err);
		}
		var data = {
			content: '<div data-content-area="content">'+content+'</div>',
			title:self.title,
		};
		for(var i in self.infos){
			if(["title","filename","content","toJson","render"].indexOf(i) === -1 && typeof self.infos[i] != "function", "infos"){
				data[i] = self.infos[i];
			}
		}
		Tools.engine("../"+self.fileName+".ect", data, function(err, out){
			if(err){
				sails.log.error("Error during render of Page:", data, err);
			};
			callback(err, !err ? out : self.errorMessage(err));
		});
	});
}

module.exports = Page;