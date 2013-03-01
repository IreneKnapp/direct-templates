var grammar =
{"strings":["end","if","else","for","fill","identifier","space","{","}","(",")","!","&&","||","==","!=","<",">","<=",">=","+","-","*","/","%",".","string","raw-content","top-level","block","statement-list","statement","if-statement","if-statement-head","else-clause","for-statement","fill-statement","parenthesized-expression","expression","expression6","expression5","expression4","expression3","expression2","expression1","content","content1","operator","S","0","1","type"],"compressed":"GxUBAgEBBGEeYQACAwL/AAMHYQgCAQIFB2EeYQgEBAL/AQIDHmEfBQL/AgIEBR5hLWEfBAL/AQABHwUC/wIAAgMtYR8EAgH/ASUCAf8BIAIB/wEjAgH/ASQBCAP/AAExADIAAyFhIgEKA/8BMwECMQAyAAUBYSVhHQECAQIDAmEdAQoD/wEzAwIxADIABwNhBWElYR0BCgP/ATMEAjEAMgAFBGEFYSUBAgECBAlhJgoBAgH/AidhAwoD/wEzDAIxADIABCcMYSgKA/8BMw0CMQAyAAQnDWEoAgH/ASgHCgP/ATMOADEAMgAEKA5hKQoD/wEzDwAxADIABCgPYSkKA/8BMxAAMQAyAAQoEGEpCgP/ATMRADEAMgAEKBFhKQoD/wEzEgAxADIABCgSYSkKA/8BMxMAMQAyAAQoE2EpAgH/ASkDCgP/ATMUADEAMgAEKRRhKgoD/wEzFQAxADIABCkVYSoCAf8BKgQKA/8BMxYAMQAyAAQqFmErCgP/ATMXADEAMgAEKhdhKwoD/wEzGAAxADIABCoYYSsCAf8BKwIKA/8BMxkAMQAyAAQrGWEsAgH/ASwDAgH/ARoCAf8BBQIB/wElAwQC/wEBAi0uBQL/AgECAy0wLgQC/wEAAS4EAgH/ARoCAf8BLwIB/wEFAgH/ARsPAQABCwEAARkBAAEUAQABFQEAARYBAAEXAQABGAEAARIBAAETAQABEAEAAREBAAEOAQABDwEAAQwBAAENAgQC/wEAAQYEAv8BAQIwBgAA="}
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
            var resultType = head.shift();
            var reducerSource;
            if(resultType == 0) {
                reducerSource = "return null;";
            } else if(resultType == 1) {
                var headIndex = head.shift();
                reducerSource = "return arguments[" + headIndex + "];";
            } else if(resultType == 2) {
                var headIndex = head.shift();
                var fieldCount = head.shift();
                var fieldMap = [];
                for(var j = 0; j < fieldCount; j++) {
                    fieldMap.push(head.shift());
                }
                if(headIndex != 255) {
                    reducerSource =
                        "return arguments[" + headIndex + "].concat([";
                } else {
                    reducerSource = "return [";
                }
                for(var j in fieldMap) {
                    if(j > 0) reducerSource += ", ";
                    reducerSource += "arguments[" + fieldMap[j] + "]";
                }
                if(headIndex != 255) {
                    reducerSource += "]);";
                } else {
                    reducerSource += "];";
                }
            } else if(resultType == 3) {
                var headIndex = head.shift();
                var constantFieldCount = head.shift();
                var constantFieldMap = {};
                for(var j = 0; j < constantFieldCount; j++) {
                    var key = grammar.strings[head.shift()];
                    var value = grammar.strings[head.shift()];
                    constantFieldMap[key] = value;
                }
                var variableFieldCount = head.shift();
                var variableFieldMap = {};
                for(var j = 0; j < variableFieldCount; j++) {
                    var key = grammar.strings[head.shift()];
                    var value = head.shift();
                }
                if(headIndex != 255) {
                    reducerSource =
                        "var result = arguments[" + headIndex + "]; ";
                    for(var key in constantFieldMap) {
                        var value = constantFieldMap[key];
                        reducerSource +=
                            "result[\"" + key + "\"] = \"" + value + "\"; ";
                    }
                    for(var key in variableFieldMap) {
                        var value = variableFieldMap[key];
                        reducerSource +=
                            "result[\"" + key + "\"] = arguments[" + value
                            + "]; ";
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
                            " \"" + key + "\": arguments[" + value + "],";
                    }
                    reducerSource += " };";
                }
            }
            var reducer = new Function([], reducerSource);
            
            var nSymbolsHere = flattened.shift();
            var productionsHere = [[]];
            for(var j = 0; j < nSymbolsHere; j++) {
                var symbolCode = flattened.shift();
                var isOptional = false;
                if(symbolCode >= nSymbols) {
                    symbolCode -= nSymbols;
                    isOptional = true;
                }
                
                var newProductionsHere = [];
                if(!isOptional) {
                    for(var k in productionsHere) {
                        newProductionsHere.push
                            (productionsHere[k].concat([symbolCode]));
                    }
                } else {
                    for(var k in productionsHere) {
                        newProductionsHere.push(productionsHere[k]);
                        newProductionsHere.push
                            (productionsHere[k].concat([symbolCode]));
                    }
                }
                
                productionsHere = newProductionsHere;
            }
            
            for(var j in productionsHere) {
                productionsByNonterminal[nonterminalCode].push
                    (productionsHere[j]);
                productions.push({
                    left: nonterminalCode,
                    arity: productionsHere[j].length,
                    reducer: reducer,
                    right: productionsHere[j], // DEBUG
                    reducerSource: reducerSource, // DEBUG
                });
                productionCode++;
            }
        }
    }
    console.log(productions);
}


compileGrammar();
//console.log(grammar);

