var fs = require("fs");

var grammarPath = process.argv[1];
grammarPath = grammarPath.substr(0, grammarPath.lastIndexOf('/'));
grammarPath += "/grammar.json";
var grammarJSON = fs.readFileSync(grammarPath);
var grammarIn = JSON.parse(grammarJSON);

var startSymbolName = grammarIn.start;

var tokenCodesToNames = grammarIn.tokens;
var tokenNamesToCodes = {};
for(var code in tokenCodesToNames) {
    tokenNamesToCodes[tokenCodesToNames[code]] = code;
}

var nonterminalCodesToNames = [];
for(var nonterminalName in grammarIn.bnf) {
    nonterminalCodesToNames.push(nonterminalName);
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

var productions = [];
var productionsByNonterminal = {};
for(var nonterminalName in grammarIn.bnf) {
    var nonterminalCode = nonterminalNamesToCodes[nonterminalName];
    var productionsIn = grammarIn.bnf[nonterminalName];
    
    productionsByNonterminal[nonterminalCode] = [];
    
    for(var i in productionsIn) {
        var productionIn = productionsIn[i];
        
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
        
        productionsByNonterminal[nonterminalCode].push(soFar);
        
        productions.push({
            leftHandSide: nonterminalCode,
            rightHandSide: soFar,
        });
    }
}

for(var nonterminalName in nonterminalNamesToCodes) {
}

var grammarOut = {
    symbols: symbolCodesToNames,
    productions: productionsByNonterminal,
};

console.log(JSON.stringify(grammarOut));
