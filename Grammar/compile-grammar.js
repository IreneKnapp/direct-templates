var grammar =
{"strings":["end","if","else","for","fill","identifier","space","{","}","(",")","!","&&","||","==","!=","<",">","<=",">=","+","-","*","/","%",".","string","raw-content","top-level","block","statement-list","statement","if-statement","if-statement-head","else-clause","for-statement","fill-statement","parenthesized-expression","expression","expression6","expression5","expression4","expression3","expression2","expression1","content","content1","operator","S","ifFalse","type","condition","ifTrue","left","right"],"compressed":"GxUBAgEBBGEeYQACAwL/AAMHYQgCAQIFB2EeYQgEBAIAAQIDHmEfBQIAAgIEBR5hLWEfBAL/AQABHwUC/wIAAgMtYR8EAgEAASUCAQABIAIBAAEjAgEAASQBBgMAAAExAgMhYSIBCgP/ATIBAjMCNAQFAWElYR0BAgECAwJhHQEKA/8BMgMCBQImBAcDYQVhJWEdAQoD/wEyBAIFAiYEBQRhBWElAQIBAgQJYSYKAQIBAAInYQMKA/8BMgwCNQA2AwQnDGEoCgP/ATINAjUANgMEJw1hKAIBAAEoBwYD/wEyDgAEKA5hKQYD/wEyDwAEKA9hKQYD/wEyEAAEKBBhKQYD/wEyEQAEKBFhKQYD/wEyEgAEKBJhKQYD/wEyEwAEKBNhKQIBAAEpAwYD/wEyFAAEKRRhKgYD/wEyFQAEKRVhKgIBAAEqBAYD/wEyFgAEKhZhKwYD/wEyFwAEKhdhKwYD/wEyGAAEKhhhKwIBAAErAgYD/wEyGQAEKxlhLAIBAAEsAwIBAAEaAgEAAQUCAQABJQMEAgABAQItLgUCAAIBAgMtMC4EAv8BAAEuBAIBAAEaAgEAAS8CAQABBQIBAAEbDwEAAQsBAAEZAQABFAEAARUBAAEWAQABFwEAARgBAAESAQABEwEAARABAAERAQABDgEAAQ8BAAEMAQABDQIEAv8BAAEGBAIAAQECMAYA=="}
;

Base64 = {
decode: function(input) {
    var output = [];
    var charCodeBrackets = [
        "A".charCodeAt(0), "Z".charCodeAt(0) + 1, 0,
        "a".charCodeAt(0), "z".charCodeAt(0) + 1, 26,
        "0".charCodeAt(0), "9".charCodeAt(0) + 1, 52,
        "+".charCodeAt(0), "+".charCodeAt(0) + 1, 62,
        "/".charCodeAt(0), "/".charCodeAt(0) + 1, 63,
    ];
    var bitBundles = [];
    var mod3 = 0;
    for(var i = 0; i < input.length; i++) {
        var charCode = input[i].charCodeAt(0);
        for(var j = 0; j < charCodeBrackets.length; j += 3) {
            if((charCode >= charCodeBrackets[j])
               && (charCode < charCodeBrackets[j + 1]))
            {
                bitBundles.push(charCode - charCodeBrackets[j]
                                + charCodeBrackets[j + 2]);
                mod3 = 0;
                break;
            }
        }
        if((j == charCodeBrackets.length) && (input[i] == "=")) {
            mod3++;
        }
    }
    while(bitBundles.length > 4) {
        output.push((bitBundles[0] << 2) + (bitBundles[1] >> 4));
        output.push((bitBundles[1] << 4) % 256 + (bitBundles[2] >> 2));
        output.push((bitBundles[2] << 6) % 256 + (bitBundles[3]));
        bitBundles = bitBundles.slice(4);
    }
    if(mod3 == 1) {
        output.push((bitBundles[0] << 2) + (bitBundles[1] >> 4));
    } else if(mod3 == 2) {
        output.push((bitBundles[0] << 2) + (bitBundles[1] >> 4));
        output.push((bitBundles[1] << 4) % 256 + (bitBundles[2] >> 2));
    } else if(mod3 == 0) {
        output.push((bitBundles[0] << 2) + (bitBundles[1] >> 4));
        output.push((bitBundles[1] << 4) % 256 + (bitBundles[2] >> 2));
        output.push((bitBundles[2] << 6) % 256 + (bitBundles[3]));
    }
    return output;
}
};


function compileGrammar() {
    var flattened = Base64.decode(grammar.compressed);
    delete grammar.compressed;
    var nTokens = flattened.shift();
    var nNonterminals = flattened.shift();
    var nSymbols = 1 + nTokens + nNonterminals;
    var productionsByNonterminal = [];
    var productions = [];
    var productionCode = 0;
    for(var nonterminalCode = 0;
        nonterminalCode < nNonterminals;
        nonterminalCode++)
    {
        productionsByNonterminal.push([]);
        var nProductionsHere = flattened.shift();
        for(var i = 0; i < nProductionsHere; i++) {
            var headLength = flattened.shift();
            var head = [];
            for(var j = 0; j < headLength; j++) {
                head.push(flattened.shift());
            }
            
            var nSymbolsHere = flattened.shift();
            var productionsHere = [[]];
            var deletedSymbolsHere = [[]];
            for(var j = 0; j < nSymbolsHere; j++) {
                var symbolCode = flattened.shift();
                var isOptional = false;
                if(symbolCode >= nSymbols) {
                    symbolCode -= nSymbols;
                    isOptional = true;
                }
                
                var newProductionsHere = [];
                var newDeletedSymbolsHere = [];
                if(!isOptional) {
                    for(var k in productionsHere) {
                        newProductionsHere.push
                            (productionsHere[k].concat([symbolCode]));
                        newDeletedSymbolsHere.push
                            ([].concat(deletedSymbolsHere[k]));
                    }
                } else {
                    for(var k in productionsHere) {
                        newProductionsHere.push(productionsHere[k]);
                        newProductionsHere.push
                            (productionsHere[k].concat([symbolCode]));
                        newDeletedSymbolsHere.push
                            ([].concat(deletedSymbolsHere[k], [j]));
                        newDeletedSymbolsHere.push
                            ([].concat(deletedSymbolsHere[k]));
                    }
                }
                
                productionsHere = newProductionsHere;
                deletedSymbolsHere = newDeletedSymbolsHere;
            }
            
            for(var j in productionsHere) {
                var adjustIndex = function(index) {
                    if(index == 255) return 255;
                    var result = index;
                    for(var k = 0; k < deletedSymbolsHere[j].length; k++) {
                        var deletedIndex = deletedSymbolsHere[j][k];
                        if(index == deletedIndex) return 255;
                        if(index > deletedIndex) result--;
                    }
                    return result;
                };
                
                var headHere = [].concat(head);
                var resultType = headHere.shift();
                var reducerSource;
                if(resultType == 0) {
                    reducerSource = "return null;";
                } else if(resultType == 1) {
                    var headIndex = headHere.shift();
                    reducerSource =
                        "return arguments[" + adjustIndex(headIndex) + "];";
                } else if(resultType == 2) {
                    var headIndex = headHere.shift();
                    var fieldCount = headHere.shift();
                    var fieldMap = [];
                    for(var k = 0; k < fieldCount; k++) {
                        fieldMap.push(headHere.shift());
                    }
                    if(headIndex != 255) {
                        reducerSource =
                            "return arguments[" + adjustIndex(headIndex)
                            + "].concat([";
                    } else {
                        reducerSource = "return [";
                    }
                    for(var k in fieldMap) {
                        if(k > 0) reducerSource += ", ";
                        reducerSource += "arguments["
                            + adjustIndex(fieldMap[k]) + "]";
                    }
                    if(headIndex != 255) {
                        reducerSource += "]);";
                    } else {
                        reducerSource += "];";
                    }
                } else if(resultType == 3) {
                    var headIndex = headHere.shift();
                    var constantFieldCount = headHere.shift();
                    var constantFieldMap = {};
                    for(var k = 0; k < constantFieldCount; k++) {
                        var key = grammar.strings[headHere.shift()];
                        var value = grammar.strings[headHere.shift()];
                        constantFieldMap[key] = value;
                    }
                    var variableFieldCount = headHere.shift();
                    var variableFieldMap = {};
                    for(var k = 0; k < variableFieldCount; k++) {
                        var key = grammar.strings[headHere.shift()];
                        var value = headHere.shift();
                        variableFieldMap[key] = value;
                    }
                    if(headIndex != 255) {
                        reducerSource =
                            "var result = arguments[" + adjustIndex(headIndex)
                            + "]; ";
                        for(var key in constantFieldMap) {
                            var value = constantFieldMap[key];
                            reducerSource +=
                                "result[\"" + key + "\"] = \"" + value + "\"; ";
                        }
                        for(var key in variableFieldMap) {
                            var value = variableFieldMap[key];
                            reducerSource +=
                                "result[\"" + key + "\"] = arguments["
                                + adjustIndex(value) + "]; ";
                        }
                        reducerSource += "return result;";
                    } else {
                        reducerSource = "return {";
                        for(var key in constantFieldMap) {
                            var value = constantFieldMap[key];
                            reducerSource +=
                                " \"" + key + "\": \"" + value + "\",";
                        }
                        for(var key in variableFieldMap) {
                            var value = variableFieldMap[key];
                            reducerSource +=
                                " \"" + key + "\": arguments["
                                + adjustIndex(value) + "],";
                        }
                        reducerSource += " };";
                    }
                }
                var reducer = new Function([], reducerSource);
                
                productionsByNonterminal[nonterminalCode].push(productionCode);
                productions.push({
                    left: nonterminalCode,
                    right: productionsHere[j],
                    arity: productionsHere[j].length,
                    reducer: reducer,
                });
                productionCode++;
            }
        }
    }
    
    var states = [];
    var shifts = [];
    var reductions = [];
    
    var augmentItemSetByItem = function(itemSet, item) {
        for(var i in itemSet) {
            var foundItem = itemSet[i];
            if((foundItem[0] == item[0]) && (foundItem[1] == item[1])) return;
        }
        itemSet.push(item);
        return itemSet;
    }
    
    var augmentItemSetByNonterminal = function(itemSet, nonterminalCode) {
        var newItemSet = [];
        
        for(var i in itemSet) newItemSet.push(itemSet[i]);
        
        for(var i in productionsByNonterminal[nonterminalCode]) {
            var productionCode = productionsByNonterminal[nonterminalCode][i];
            var found = false;
            for(var j in newItemSet) {
                var item = newItemSet[j];
                if((item[0] == 0) && (item[1] == productionCode)) {
                    found = true;
                    break;
                }
            }
            if(!found) {
                newItemSet = augmentItemSetByItem
                    (newItemSet, [0, productionCode]);
            }
        }

        return newItemSet;
    }
    
    var advanceItemSet = function(itemSet, symbolCode) {
        var newItemSet = [];
        for(var i in itemSet) {
            var item = itemSet[i];
            var rhs = productions[item[1]].right;
            if((item[0] < rhs.length) && (rhs[item[0] + 1] == symbolCode))
            {
                newItemSet = augmentItemSetByItem
                    (newItemSet, [item[0] + 1, item[1]]);
            }
        }
        
        newItemSet = transitivelyCloseItemSet(newItemSet);
        
        return newItemSet;
    }
    
    var transitivelyCloseItemSet = function(itemSet) {
        for(var i = 0; i < itemSet.length; i++) {
            var item = itemSet[i];
            var rhs = productions[item[1]].right;
            if(item[0] < rhs.length) {
                var symbolCode = rhs[item[0]];
                if(symbolCode >= 1 + nTokens) {
                    var nonterminalCode = symbolCode - (1 + nTokens);
                    itemSet = augmentItemSetByNonterminal
                        (itemSet, nonterminalCode);
                }
            }
        }
        
        return itemSet;
    }
    
    var possibleSymbols = function(itemSet) {
    }
    
    var addState = function(itemSet) {
        states.push(itemSet);
        shifts.push([]);
        reductions.push([]);
    }

    var shiftToState = function(stateCode, itemSet) {
        var found = false;
        for(var i in states) {
            if(states[i].length != itemSet.length) continue;
            for(var j in states[i]) {
            }
        }
    }
    
    addState(augmentItemSetByNonterminal([], 0));
    addState(advanceItemSet(states[0], 48));
    for(var i in states) {
        console.log(states[i], shifts[i], reductions[i]);
    }
    
    for(var i in productions) {
        delete productions[i].right;
    }
    grammar.productions = productions;
}


compileGrammar();
//console.log(grammar);

