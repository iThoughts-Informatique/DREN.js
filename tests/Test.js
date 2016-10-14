/**
 * @file Tests & benchmarks
 *
 * @author Gerkin
 * @copyright 2016 GerkinDevelopment
 * @license https://raw.githubusercontent.com/iThoughts-Informatique/DREN.js/master/LICENSE GPL-3.0
 * @package dren.js
 *
 * @version 0.0.2
 */

module.exports = {
	test: function(req, res){
		var timer = new Date().getTime();
		Async.parallel({
			DRENjs: function(cb){	
				const diff1_1 = new Template("partials/tests/component-diff1-1", {}),
					  diff1_2 = new Template("partials/tests/component-diff1-2", {}),
					  diff2_1 = new Template("partials/tests/component-diff2-1", {}),
					  diff2_2 = new Template("partials/tests/component-diff2-2", {}),
					  diff1 = new Template("partials/tests/component-diff1", {part1_1:diff1_1,part1_2:diff1_2}),
					  diff2 = new Template("partials/tests/component-diff2", {part2_1:diff2_1,part2_2:diff2_2}),
					  diff = new Template("pages/tests/diff", {diff1:diff1,diff2:diff2}),
					  fullPage = new Page("test", "layouts/tests/diff", {}, diff);

				return Render(fullPage, req, function(err, out){
					sails.log.verbose(`Time for diff render ===> ${ (new Date().getTime()) - timer }ms`)
					return cb(err, out);
				});
			},
			ECT: function(cb){
				sails.config.views.engine.fn("../pages/tests/stdr.ect", {layout: "layouts/tests/stdr.ect"}, function(err, out){
					if(err){
						sails.log.error(err);
					}
					sails.log.verbose(`Time for stdr render ===> ${ (new Date().getTime()) - timer }ms`)
					return cb(err, out);
				});
			}
		});
	}
}