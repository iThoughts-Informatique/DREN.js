## What is DRENjs

_DRENjs_ is a *rendering engine* wrapper for [ECT](http://ectjs.com/), which is known for being extremelly fast.

DRENjs allow you to make no-js compliant one-page-sites with a simple clientside & serverside framework. It helps you create your pages in a most abstract way, with several optimizations & nice features such as the "**render what changed**". The main need at the origin of DRENjs is to build one-page apps based on text content, which was problematic with frameworks such as MeteorJS.

You can use it in the framework you want, on every or just a part of your pages.

## Installation

For now, installation is manual. You have to clone the GitHub repository.

DRENjs is composed by a server-side & client-side framework. To get started, simply include both files in the appropriate place:

	{@lang javascript}
    // In your server-side script:
    const DRENjs = new (require("dren.js"))({
			engine: ect.render,
			assetsDir: "assets/js",
			assetsUrl: "/js"
		}),
        Page = DRENjs.Page,
        Template = DRENjs.Template;

<div style="margin:-35px 0;"></div>

	{@lang xml}
    <!-- In your HTML file -->
	<!DOCTYPE html>
	<html>
		<head>
			<title><%- @title %></title>
			<meta name="description" content="<%- @metas.description %>">
			<%- @styles %>
			<%- @scripts.head %>
		</head>

		<body>
			<% if typeof @content != "undefined" : %>
				<div id="main-container"><%- @content %></div>
			<% end %>
			<%- @scripts.foot %>
		</body>
	</html>

Then, on your server, compose your page using Templates & Pages.

	{@lang javascript}
    const mycontent  = new Template("mycontent", { foo: "bar" }),
          myTemplate = new Template("myTemplate", { mycontent: mycontent, baz: "bat" }),
          myPage     = new Page("body", "This is my title", {}, myTemplate);
The same object may be used for differential rendering and plain rendering. For example, if your client is requesting with a plain HTTP request, you may render the full page.

	{@lang javascript}
    myPage.render(function(err, rendered){
		// `rendered` is the plain web page as a string. You should send it to the client.
        /* ... */
    });
Alternatively, if the request is coming via your one-page-app request method, you may use a differential rendering

	{@lang javascript}
	DRENjs.diffRender(myPage, oldPageOfClient, function(err, diff){
		// Here, `diff` contains an object you should send back to the client's DRENjs, and it will load the page.
		/* ... */
	});