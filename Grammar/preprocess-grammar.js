var fs = require("fs");

var grammarPath = process.argv[1];
grammarPath = grammarPath.substr(0, grammarPath.lastIndexOf('/'));
grammarPath += "/grammar.json";
var grammarJSON = fs.readFileSync(grammarPath);
var grammarIn = JSON.parse(grammarJSON);

var startSymbolName = grammarIn.start;

var tokenCodesToNames = grammarIn.tokens;
var tokenNamesToCodes = {};
var nTokens = 0;
for(var code in tokenCodesToNames) {
    tokenNamesToCodes[tokenCodesToNames[code]] = code;
    nTokens++;
}

var nonterminalCodesToNames = [];
var nNonterminals = 0;
for(var nonterminalName in grammarIn.bnf) {
    nonterminalCodesToNames.push(nonterminalName);
    nNonterminals++;
}
var nonterminalNamesToCodes = {};
for(var code in nonterminalCodesToNames) {
    nonterminalNamesToCodes[nonterminalCodesToNames[code]] = code;
}

var symbolCodesToNames = ["end"].concat
    (tokenCodesToNames, nonterminalCodesToNames);
var symbolNamesToCodes = {};
for(var code in symbolCodesToNames) {
    symbolNamesToCodes[symbolCodesToNames[code]] = code;
}
var nSymbols = 1 + nTokens + nNonterminals;

var stringTable = [].concat(symbolCodesToNames);
var flattenedGrammar = [];
flattenedGrammar.push(tokenCodesToNames.length);
flattenedGrammar.push(nonterminalCodesToNames.length);
for(var nonterminalName in grammarIn.bnf) {
    var nonterminalCode = nonterminalNamesToCodes[nonterminalName];
    var productionsIn = grammarIn.bnf[nonterminalName];
    
    flattenedGrammar.push(productionsIn.length);
    
    for(var i in productionsIn) {
        var resultIn = productionsIn[i][0];
        var productionIn = productionsIn[i][1];
        
        var headSoFar = [];
        var bodySoFar = [];
        
        var resultType = resultIn[0];
        if(resultType == "null") {
            headSoFar.push(0);
        } else if(resultType == "id") {
            headSoFar.push(1);

            var headIndex = null;
            for(var j in productionIn) {
                var symbolName = productionIn[j];
                var key = null;
                if(symbolName[0] == "@") {
                    symbolName = symbolName.substr(1);
                    if(headIndex === null) {
                        headIndex = parseInt(j, 10);
                    }
                }
                productionIn[j] = symbolName;
            }
            if(headIndex === null) headIndex = 255;
            headSoFar.push(headIndex);
        } else if(resultType == "array") {
            headSoFar.push(2);
            
            var headIndex = null;
            var variableFieldMap = [];
            for(var j in productionIn) {
                var symbolName = productionIn[j];
                var key = null;
                if(symbolName[0] == "@") {
                    symbolName = symbolName.substr(1);
                    if(headIndex === null) headIndex = parseInt(j, 10);
                } else {
                    var colonIndex = symbolName.indexOf(":");
                    if(colonIndex != -1) {
                        var key = symbolName.substr(0, colonIndex);
                        key = parseInt(key, 10);
                        symbolName = symbolName.substr(colonIndex + 1);
                        variableFieldMap[key] = j;
                    }
                }
                productionIn[j] = symbolName;
            }
            if(headIndex === null) headIndex = 255;
             
            var variableFieldCount = variableFieldMap.length;
            
            headSoFar.push(headIndex);
            
            headSoFar.push(variableFieldCount);
            
            for(var key in variableFieldMap) {
                var index = variableFieldMap[key];
                if(typeof index === "undefined") index = 255;
                else index = parseInt(index, 10);
                
                headSoFar.push(index);
            }
        } else if(resultType == "object") {
            headSoFar.push(3);
            
            var constantFieldMap = {};
            for(var j = 1; j < resultIn.length; j++) {
                var constantFieldIn = resultIn[j];
                var colonIndex = constantFieldIn.indexOf(":");
                var key = constantFieldIn.slice(0, colonIndex);
                var value = constantFieldIn.slice(colonIndex + 1);
                
                constantFieldMap[key] = value;
            }
            
            var headIndex = null;
            var variableFieldMap = {};
            for(var j in productionIn) {
                var symbolName = productionIn[j];
                var key = null;
                if(symbolName[0] == "@") {
                    symbolName = symbolName.substr(1);
                    if(headIndex === null) headIndex = parseInt(j, 10);
                } else {
                    var colonIndex = symbolName.indexOf(":");
                    if(colonIndex != -1) {
                        var key = symbolName.substr(0, colonIndex);
                        symbolName = symbolName.substr(colonIndex + 1);
                        variableFieldMap[key] = j;
                    }
                }
                productionIn[j] = symbolName;
            }
            if(headIndex === null) headIndex = 255;
            
            var constantFieldCount = 0;
            for(var key in constantFieldMap) {
                constantFieldCount++;
            }
             
            var variableFieldCount = 0;
            for(var key in variableFieldMap) {
                variableFieldCount++;
            }
            
            headSoFar.push(headIndex);
            
            headSoFar.push(constantFieldCount);

            for(var key in constantFieldMap) {
                var value = constantFieldMap[key];
                
                for(var stringCode = 0;
                    stringCode < stringTable.length;
                    stringCode++)
                {
                    if(stringTable[stringCode] == key) break;
                }
                if(stringCode == stringTable.length) {
                    stringTable.push(key);
                }
                headSoFar.push(stringCode);
                
                for(var stringCode = 0;
                    stringCode < stringTable.length;
                    stringCode++)
                {
                    if(stringTable[stringCode] == value) break;
                }
                if(stringCode == stringTable.length) {
                    stringTable.push(value);
                }
                headSoFar.push(stringCode);
            }
            
            headSoFar.push(variableFieldCount);
            
            for(var key in variableFieldMap) {
                var index = parseInt(variableFieldMap[key], 10);
                
                for(var stringCode = 0;
                    stringCode < stringTable.length;
                    stringCode++)
                {
                    if(stringTable[stringCode] == key) break;
                }
                if(stringCode == stringTable.length) {
                    stringTable.push(key);
                }
                headSoFar.push(stringCode);
                
                headSoFar.push(index);
            }
        }
        
        for(var j in productionIn) {
            var symbolName = productionIn[j];
            var isOptional = false;
            var key = null;
            if(symbolName[symbolName.length - 1] == "?") {
                symbolName = symbolName.substr(0, symbolName.length - 1);
                isOptional = true;
            }
            var symbolCode = symbolNamesToCodes[symbolName];
            symbolCode = parseInt(symbolCode, 10);
            
            if(!isOptional) {
                bodySoFar.push(symbolCode);
            } else {
                bodySoFar.push(symbolCode + nSymbols);
            }
        }
        
        flattenedGrammar.push(headSoFar.length);
        for(var j in headSoFar) {
            flattenedGrammar.push(headSoFar[j]);
        }
        flattenedGrammar.push(bodySoFar.length);
        for(var j in bodySoFar) {
            flattenedGrammar.push(bodySoFar[j]);
        }
    }
}


Base64 = {
encode: function(input) {
    var output = "";
    for(var i = 0; i < input.length; i += 3) {
        var valueA = input[i];
        var valueB = input[i + 1] || 0;
        var valueC = input[i + 2] || 0;
        var bitBundles = [valueA >> 2,
                          (valueA << 4) % 64 + (valueB >> 4),
                          (valueB << 2) % 64 + (valueC >> 6),
                          valueC % 64];
        for(var j in bitBundles) {
            var bitBundle = bitBundles[j];
            if(bitBundle < 26) {
                output += String.fromCharCode
                    (bitBundle + 'A'.charCodeAt(0));
            } else if(bitBundle < 52) {
                output += String.fromCharCode
                    (bitBundle - 26 + 'a'.charCodeAt(0));
            } else if(bitBundle < 62) {
                output += String.fromCharCode
                    (bitBundle - 52 + '0'.charCodeAt(0));
            } else if(bitBundle == 62) {
                output += "+";
            } else if(bitBundle == 63) {
                output += "/";
            }
        }
    }
    if(input.length % 3 == 1) {
        output += "=";
    } else if(input.length % 3 == 2) {
        output += "==";
    }
    return output;
}
};


var grammarOut = {
    strings: stringTable,
    compressed: Base64.encode(flattenedGrammar),
};

console.log(JSON.stringify(grammarOut));
