/**
 * @file Various tools for DRENjs
 *
 * @author Gerkin
 * @copyright 2016 GerkinDevelopment
 * @license https://raw.githubusercontent.com/iThoughts-Informatique/DREN.js/master/LICENSE GPL-3.0
 * @package dren.js
 *
 * @version 0.0.2
 */

/* jshint esversion: 6 */

const Tools = {
	generateErrorMessage: function generateErrorMessage(err) {
		return '\n' + err + '\n';
	},
	isNA: function isNA(value){
		return value === null || typeof value === 'undefined';
	},
	randomString: function randomString(length, alphabet) {
		if (Tools.isNA(alphabet)) {
			alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		}
		var l = alphabet.length;
		return Array.apply(null, Array(length)).map(function () {
			return alphabet.charAt(Math.floor(Math.random() * l));
		}).join('');
	},
	registerLink: function(href){
		return 'href="'+href+'" drenjs'
	}
};

module.exports = Tools;