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

var nonterminalsByName = {};
for(var nonterminalName in grammarIn.bnf) {
    var productionsIn = grammarIn.bnf[nonterminalName];
    
    var productionsOut = [];
    for(var i in productionsIn) {
        var productionIn = productionsIn[i];
        
        var soFar = [[]];
        for(var j in productionIn) {
            var symbol = productionIn[j];
            
            var newSoFar = [];
            if(symbol[symbol.length - 1] == "?") {
                symbol = symbol.substr(0, symbol.length - 1);
                for(var k in soFar) {
                    newSoFar.push(soFar[k]);
                    newSoFar.push(soFar[k].concat([symbol]));
                }
            } else {
                for(var k in soFar) {
                    newSoFar.push(soFar[k].concat([symbol]));
                }
            }
            
            soFar = newSoFar;
        }
        
        productionsOut = productionsOut.concat(soFar);
    }
    
    nonterminalsByName[nonterminalName] = productionsOut;
}

var grammarOut = {
    tokens: tokenCodesToNames,
    start: startSymbolName,
    bnf: nonterminalsByName,
};

console.log(JSON.stringify(grammarOut));
