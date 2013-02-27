var DirectTemplates = (function() {
    var _runningUnderNode = (typeof module !== "undefined") && module.exports;
    
    var _processOptions = function(provided, defaults) {
        provided = provided || {};
        defaults = defaults || {};
        
        var result = provided;
        for(key in defaults) {
            if(typeof result[key] == "undefined")
                result[key] = defaults[key];
        }
        return result;
    };

    var _defaultOptions = {
        templateSelector: "body > script[type=template][name]",
        nameAccessor: function(node) { return node.getAttribute("name"); },
        sourceAccessor: function(node) { return node.textContent; },
        returnAs: _runningUnderNode ? "string" : "dom",
    };
    
    var DirectTemplates = function() {
        var options;
        var templateSources;
        if(_runningUnderNode) {
            templateSources = arguments[0];
            options = arguments[1];
        } else {
            templateSources = {};
            options = arguments[0];
        }
        options = _defaultOptions = _processOptions(options, _defaultOptions);
        
        if(!_runningUnderNode) {
            var nodes = document.querySelectorAll(options.templateSelector);
            for(var i = 0; i < nodes.length; i++) {
                var node = nodes.item(i);
                templateSources[options.nameAccessor(node)] =
                    options.sourceAccessor(node);
            }
        }
        
        var problems = {};
        for(var name in templateSources) {
            try {
                DirectTemplates.templates[name] =
                    DirectTemplates.compile(templateSources[name], options);
            } catch(problem) {
                problems[name] = problem;
                DirectTemplates.templates[name] = (function(name) {
                    return function() {
                        throw "Template \"" + name + "\" failed to compile.";
                    };
                })(name);
            }
        }
        var description = "";
        for(var name in problems) {
            description += "While compiling template \"" + name + "\": ";
            description += problems[name];
            description += "\n";
        }
        if(description != "") throw description;
    };
    
    DirectTemplates.compile = function(source, options) {
        options = _processOptions(options, _defaultOptions);
        
        var code = "";
        var indentation = 0;
        var appendLine = function(line) {
            for(var i = 0; i < indentation; i++)
                code += "    ";
            code += line;
            code += "\n";
        }
        appendLine("var text = \"\";");
        appendLine("");
        
        if(options.returnAs == "string") {
            appendLine("return text;");
        } else if(options.returnAs == "dom") {
            // TODO
        } else {
            throw "Unknown options.returnAs value \""
                  + options.returnAs + "\".";
        }
        
        console.log(code);
        return new Function("context", code);
    };
    
    DirectTemplates.templates = {};
    
    return DirectTemplates;
})();

DirectTemplates({
    "page": "<html><head><title>{title}</title></head><body>"
          + "if({type} == \"front\") {"
          + "foreach {article} in {articles} {"
          + "about({article})"
          + "}"
          + "} else if({type} == \"article\") {"
          + "<h1>{title}</h1>"
          + "foreach {paragraph} in {article.paragraphs} {"
          + "<p>{paragraph}</p>"
          + "}"
          + "}"
          + "</body></html>",
    "about": "<h2>{title}</h2><p>{blurb}</p>",
});
console.log(DirectTemplates.templates.page({
    "title": "Front Page",
    "type": "front",
    "articles": [{
        "title": "Test Article",
        "blurb": "This is a test.",
    }, {
        "title": "Normal Article",
        "blurb": "This is actually also a test.",
    }],
}));
console.log(DirectTemplates.templates.page({
    "title": "Test Article",
    "type": "article",
    "paragraphs": ["First paragraph.", "Middle paragraph.", "Last paragraph."],
}));
