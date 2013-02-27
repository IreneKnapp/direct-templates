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
        
        var tokens = source.split(/(\n)/);
        var newTokens = [];
        var line = 1;
        for(var i = 0; i < tokens.length; i += 2) {
            if(tokens[i].length > 0) {
                newTokens.push({
                    string: tokens[i],
                    line: line,
                });
            }
            
            if(i + 1 < tokens.length) {
                newTokens.push({
                    string: tokens[i + 1],
                    line: line,
                    type: "space",
                });
            }
            
            line++;
        }
        tokens = newTokens;
        var identify = function(pattern, type, hasContent) {
            var cycleLength = 2;
            if(hasContent) cycleLength++;
             
            var newTokens = [];
            for(var i in tokens) {
                var token = tokens[i];
                if(typeof token.type !== "undefined") {
                    newTokens.push(token);
                } else {
                    var pieces = token.string.split(pattern);
                    for(var j = 0; j < pieces.length; j += cycleLength) {
                        if(pieces[j].length > 0) {
                            newTokens.push({
                                string: pieces[j],
                                line: token.line,
                            });
                        }
                        
                        if(j + 1 < pieces.length) {
                            var piece = {
                                string: pieces[j + 1],
                                line: token.line,
                                type: type,
                            };
                            if(hasContent) piece.content = pieces[j + 2];
                            newTokens.push(piece);
                        }
                    }
                }
            }
            tokens = newTokens;
        }
        identify(/("((?:[^"\\]|\\"|\\\\)*)")/, "string", true);
        identify(/('((?:[^'\\]|\\'|\\\\)*)')/, "string", true);
        identify(/(\s+)/, "space", false);
        identify(/(\{|\}|\(|\))/, "punctuator", false);
        identify
          (/(!|~|\.|\+|-|\*|\/|%|\^|<|>|<=|>=|==|!=|&|&&|\||\|\||<<|>>)/,
           "operator", false);
        identify(/(if|else|for|in)/, "keyword", false);
        identify(/((?:[a-zA-Z_]|[^\x01-\x7F])(?:[a-zA-Z_0-9]|[^\x0a-\x7F])*)/,
                 "identifier", false);
        var newTokens = [];
        for(var i in tokens) {
            var token = tokens[i];
            if(typeof token.type === "undefined") {
                token.type = "raw-content";
            } else if(token.type == "punctuator") {
                token.subtype = token.string;
            } else if(token.type == "operator") {
                token.subtype = token.string;
            } else if(token.type == "keyword") {
                token.subtype = token.string;
            }
            newTokens.push(token);
        }
        tokens = newTokens;
        
        var result;
        var done = false;
        var stateStack = ["at top-level"];
        var symbolStack = [];
        var tokenTypes = [];
        var productions = {
            // block -> { statement-list }
            "block": {
                result: "block",
                arity: 3,
                f: function(o, soFar, c) {
                    return soFar;
                },
            },
            // statement-list ->
            "empty statement-list": {
                result: "statement-list",
                arity: 0,
                f: function() {
                    return [];
                },
            },
            // statement-list -> statement-list statement
            "nonempty statement-list": {
                result: "statement-list",
                arity: 2,
                f: function(soFar, item) {
                    soFar.push(item);
                    return soFar;
                },
            },
            // statement -> literal
            "literal-statement": {
                result: "statement",
                arity: 1,
                f: function(item) {
                    return {
                        line: item.line,
                        type: "literal-statement",
                        string: item.string,
                    };
                },
            },
            // statement -> { expression }
            "substitution-statement": {
                result: "statement",
                arity: 3,
                f: function(o, item, c) {
                    return {
                        line: o.line,
                        type: "substitution-statement",
                        expression: item.expression,
                    };
                },
            },
            // statement -> if ( expression ) block
            "if-statement": {
                result: "statement",
                arity: 5,
                f: function(k, o, expression, c, block) {
                    return {
                        line: keyword.line,
                        type: "if-statement",
                        expression: expression.expression,
                        ifTrue: block,
                        ifFalse: [],
                    };
                },
            },
            // statement -> if ( expression ) block else block
            "if-else-statement": {
                result: "statement",
                arity: 7,
                f: function(k1, o, expression, c, block1, k2, block2) {
                    return {
                        line: k1.line,
                        type: "if-else-statement",
                        expression: expression.expression,
                        ifTrue: block1,
                        ifFalse: block2,
                    };
                },
            },
            // expression -> identifier
            "identifier-expression": {
                result: "expression",
                arity: 1,
                f: function(item) {
                    return {
                        line: item.line,
                        type: "identifier-expression",
                        identifier: item.string,
                    };
                },
            },
            // literal -> string
            "string-literal": {
                result: "literal",
                arity: 1,
                f: function(item) {
                    return {
                        line: item.line,
                        type: "literal",
                        string: item.string,
                    };
                },
            },
            // literal -> space
            "space-literal": {
                result: "literal",
                arity: 1,
                f: function(item) {
                    return {
                        line: item.line,
                        type: "literal",
                        string: item.string,
                    };
                },
            },
            // literal -> operator
            "operator-literal": {
                result: "literal",
                arity: 1,
                f: function(item) {
                    return {
                        line: item.line,
                        type: "literal",
                        string: item.string,
                    };
                },
            },
            // literal -> identifier
            "identifier-literal": {
                result: "literal",
                arity: 1,
                f: function(item) {
                    return {
                        line: item.line,
                        type: "literal",
                        string: item.string,
                    };
                },
            },
            // literal -> raw-content
            "raw-content-literal": {
                result: "literal",
                arity: 1,
                f: function(item) {
                    return {
                        line: item.line,
                        type: "literal",
                        string: item.string,
                    };
                },
            },
        };
        var states = {
            "at top-level": {
                // start -> . statement-list end
                // statement-list -> .
                // statement-list -> . statement-list statement
                "statement-list": "in top-level statement-list",
                "reduce": "empty statement-list",
            },
            "in top-level statement-list": {
                // start -> statement-list . end
                // statement-list -> statement-list . statement
                // statement -> . literal
                // statement -> . { expression }
                // literal -> . string
                // literal -> . space
                // literal -> . operator
                // literal -> . identifier
                // literal -> . raw-content
                "end" : "accept",
                "statement": "after statement-list",
                "literal": "after literal-statement",
                "{": "in substitution-statement before expression",
                "string": "after string-literal",
                "space": "after space-literal",
                "operator": "after operator-literal",
                "identifier": "after identifier-literal",
                "raw-content": "after raw-content-literal",
            },
            "after statement-list": {
                // statement-list -> statement-list statement .
                "reduce": "nonempty statement-list",
            },
            "after literal-statement": {
                // statement -> literal .
                "reduce": "literal-statement",
            },
            "in substitution-statement before expression": {
                // statement -> { . expression }
                // expression -> . identifier
                "expression": "in substitution-statement after expression",
                "identifier": "after identifier-expression",
            },
            "in substitution-statement after expression": {
                // statement -> { expression . }
                "}": "after substitution-statement",
            },
            "after substitution-statement": {
                // statement -> { expression } .
                "reduce": "substitution-statement",
            },
            "after identifier-expression": {
                // expression -> identifier .
                reduce: "identifier-expression",
            },
            "after string-literal": {
                // literal -> string .
                "reduce": "string-literal",
            },
            "after space-literal": {
                // literal -> space .
                "reduce": "space-literal",
            },
            "after operator-literal": {
                // literal -> operator .
                "reduce": "operator-literal",
            },
            "after identifier-literal": {
                // literal -> identifier .
                "reduce": "identifier-literal",
            },
            "after raw-content-literal": {
                // literal -> raw-content .
                "reduce": "raw-content-literal",
            },
        };
        var shift, reduce, goto, accept, error;
        var shift = function(name) {
            //console.log("Shift " + tokens[0].type + "; now " + name);
            if(tokens.length > 0) {
                if(typeof states[name] === "undefined") {
                    throw "No state \"" + name + "\" for shift.";
                }
                
                stateStack.push(name);
                symbolStack.push(tokens.shift());
                tokenTypes.shift();
            }
        };
        var reduce = function(name) {
            //console.log("Reduce " + name);
            
            var production = productions[name];
            if(typeof production === "undefined") {
                throw "No production \"" + name + "\" for reduction.";
            }
            
            var parameters = [];
            for(var i = 0; i < production.arity; i++) {
                parameters.unshift(symbolStack.pop());
            }
            var result = production.f.apply(null, parameters);
            
            for(var i = 0; i < production.arity; i++) {
                stateStack.pop();
            }
            
            var resultType = production.result;
            tokenTypes.unshift(resultType);
            tokens.unshift(result);
        };
        var accept = function() {
            //console.log("Accept");
            result = symbolStack.pop();
            done = true;
        };
        var error = function(message) {
            var line = tokens[0].line;
            throw "Line " + line + ": " + message;
        };
        while(!done) {
            var tokenType;
            var tokenSubtype;
            if(tokens.length == 0) {
                tokenType = "end";
                tokenSubtype = undefined;
            } else if(tokenTypes.length > 0) {
                tokenType = tokenTypes[0];
                tokenSubtype = undefined;
            } else {
                tokenType = tokens[0].type;
                tokenSubtype = tokens[0].subtype;
            }
            
            var stateName = stateStack[stateStack.length - 1];
            
            var state = states[stateName];
            if(typeof state === "undefined") {
                error("No state \"" + stateName + "\" for dispatch.");
            }
            
            var nextStateName = state[tokenType] || state[tokenSubtype];
            if((tokenType == "end") && (nextStateName == "accept")) {
                accept();
            } else if(typeof nextStateName !== "undefined") {
                shift(nextStateName);
            } else if(typeof state["reduce"] !== "undefined") {
                reduce(state["reduce"]);
            } else {
                if(!tokenSubtype) {
                    error("Unexpected " + tokenType + " " + stateName + ".");
                } else {
                    error("Unexpected " + tokenType + " " + tokenSubtype + " "
                          + stateName + ".");
                }
            }
        }
        
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
    "page": "<html><head><title>{title}</title></head><body>\n"
          + "if({type} == \"front\") {\n"
          + "    foreach article {articles} {\n"
          + "        fill about {article}\n"
          + "    }\n"
          + "} else if({type} == \"article\") {"
          + "    <h1>{title}</h1>\n"
          + "    foreach paragraph in {article.paragraphs} {\n"
          + "        <p>{paragraph}</p>\n"
          + "    }\n"
          + "}\n"
          + "</body></html>\n",
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
