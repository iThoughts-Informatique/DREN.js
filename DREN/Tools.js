/**
 * @file Various tools for DRENjs
 *
 * @author Gerkin
 * @copyright 2016 GerkinDevelopment
 * @license https://raw.githubusercontent.com/iThoughts-Informatique/DREN.js/master/LICENSE GPL-3.0
 * @package DRENjs
 *
 * @version 0.0.1
 */

module.exports = {
	engine: sails.config.views.engine.fn,
	generateErrorMessage: function generateErrorMessage(err){
		return "\n" + err + "\n";
	},
	randomString: function randomString(length, alphabet){
		if(isNA(alphabet)){
			alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		}
		var l = alphabet.length;
		return Array.apply(null, Array(length)).map(function() { return alphabet.charAt(Math.floor(Math.random() * l)); }).join('')
	}
}