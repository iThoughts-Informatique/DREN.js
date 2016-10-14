Each time you load a page with DRENjs (via normal HTTP request or via the differential process), DRENjs will compute a couple of objects to determine what to do exactly. Those objects are agnostics from the origin of the request: it means that you don't have to take care of if you have to send the full page or an object representing the diff.

## The Page object

The __Page__ object describe general datas about the content you want to display. Each page is described by an HTML-like file (computed by the underlying rendering engine) including stylesheets and scripts, a title, some metas, and a child template.

### The HTML-like file

By default, the rendering engine is ECT. The file name will be *whateveryouwant*.ect . Its content may be as follow:

	{@lang xml}
    <!-- In your HTML file -->
	<!DOCTYPE html>
	<html>
		<head>
			<title><%- @title %></title>
			<link href="..." rel="stylesheet">
			<%- @styles %>
			<%- @scripts.head %>
			<script src="..."></script>
		</head>

		<body>
			<% if typeof @content != "undefined" : %>
				<div id="main-container"><%- @content %></div>
			<% end %>
			<%- @scripts.foot %>
		</body>
	</html>

**Vars**, in ECT, are used with a heading *@*..
Following vars **MUST** appear in your document:

1. *@title*: Title of the page. It will be sent in every case to the client.
1. *@scripts.head* & *@scripts.foot*: Will be used to include **DRENjs** client-side framework.
1. *@content*: Value contained in your child Template

### Instanciating a Page

The **Page** constructor takes following arguments:

1. The template file path
1. The page title
1. Additionnal vars passed to the template (such as metas)
1. The var containing the main *Template* object

## The Template object