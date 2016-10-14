/**
 * @file Default in-page request method
 * @description XHR default communication method for {@link client.DRENjs}
 *
 * @author Gerkin
 * @copyright 2016 GerkinDevelopment
 * @license https://raw.githubusercontent.com/iThoughts-Informatique/DREN.js/master/LICENSE GPL-3.0
 * @package dren.js
 *
 * @namespace Default-XHR
 * @memberof client
 *
 * @version 0.0.2
 */
(function(D){
	'use strict';

	D.sendRequest = {
		GET: function(url, postData, callback){
			sendRequest(url, "GET", postData, callback);
		},
		POST: function(url, postData, callback){
			sendRequest(url, "POST", postData, callback);
		},
		PUT: function(url, postData, callback){
			sendRequest(url, "PUT", postData, callback);
		},
		DELETE: function(url, postData, callback){
			sendRequest(url, "DELETE", postData, callback);
		}
	}
	function sendRequest(url,method, postData, callback) {
		var req = createXMLHTTPObject();
		if (!req) return;
		req.open(method,url,true);
		//req.setRequestHeader('User-Agent','XMLHTTP/1.0');
		req.responseType = 'json';
		req.setRequestHeader('Content-type','application/json');
		req.onreadystatechange = function () {
			if (req.readyState != 4) return;
			/*if (req.status != 200 && req.status != 304) {
				//          alert('HTTP error ' + req.status);
				return;
			}*/
			callback(req);
		}
		if (req.readyState == 4) return;
		req.send(postData);
	}

	var XMLHttpFactories = [
		function () {return new XMLHttpRequest()},
		function () {return new ActiveXObject("Msxml2.XMLHTTP")},
		function () {return new ActiveXObject("Msxml3.XMLHTTP")},
		function () {return new ActiveXObject("Microsoft.XMLHTTP")}
	];

	function createXMLHTTPObject() {
		var xmlhttp = false;
		for (var i=0;i<XMLHttpFactories.length;i++) {
			try {
				xmlhttp = XMLHttpFactories[i]();
			}
			catch (e) {
				continue;
			}
			break;
		}
		return xmlhttp;
	}
})(window.DRENjs)