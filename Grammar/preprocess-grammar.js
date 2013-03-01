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

var productions = [];
var productionsByNonterminal = {};
for(var nonterminalName in grammarIn.bnf) {
    var nonterminalCode = nonterminalNamesToCodes[nonterminalName];
    var productionsIn = grammarIn.bnf[nonterminalName];
    
    productionsByNonterminal[nonterminalCode] = [];
    
    for(var i in productionsIn) {
        var productionIn = productionsIn[i];
        
        /*
        var soFar = [[]];
        for(var j in productionIn) {
            var symbolName = productionIn[j];
            
            var newSoFar = [];
            if(symbolName[symbolName.length - 1] == "?") {
                symbolName = symbolName.substr(0, symbolName.length - 1);
                var symbolCode = symbolNamesToCodes[symbolName];
                for(var k in soFar) {
                    newSoFar.push(soFar[k]);
                    newSoFar.push(soFar[k].concat([symbolCode]));
                }
            } else {
                for(var k in soFar) {
                    var symbolCode = symbolNamesToCodes[symbolName];
                    newSoFar.push(soFar[k].concat([symbolCode]));
                }
            }
            
            soFar = newSoFar;
        }
        */
        
        var soFar = [];
        for(var j in productionIn) {
            var symbolName = productionIn[j];
            var isOptional = false;
            if(symbolName[symbolName.length - 1] == "?") {
                symbolName = symbolName.substr(0, symbolName.length - 1);
                isOptional = true;
            }
            var symbolCode = symbolNamesToCodes[symbolName];
            symbolCode = parseInt(symbolCode, 10);
            if(isOptional) symbolCode += nSymbols;
            soFar.push(symbolCode);
        }
        
        productionsByNonterminal[nonterminalCode].push(soFar);
        
        productions.push({
            leftHandSide: nonterminalCode,
            rightHandSide: soFar,
        });
    }
}

var flattenedGrammar = [];
flattenedGrammar.push(tokenCodesToNames.length);
flattenedGrammar.push(nonterminalCodesToNames.length);
for(var nonterminalCode in nonterminalCodesToNames) {
    var nonterminalName = nonterminalCodesToNames[nonterminalCode];
    var symbolCode = symbolNamesToCodes[nonterminalName];
    flattenedGrammar.push(productionsByNonterminal[nonterminalCode].length);
    for(var i in productionsByNonterminal[nonterminalCode]) {
        var rightHandSide = productionsByNonterminal[nonterminalCode][i];
        flattenedGrammar.push(rightHandSide.length);
        for(var j in rightHandSide) {
            flattenedGrammar.push(rightHandSide[j]);
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
    symbols: symbolCodesToNames,
    compressed: Base64.encode(flattenedGrammar),
};

console.log(JSON.stringify(grammarOut));
