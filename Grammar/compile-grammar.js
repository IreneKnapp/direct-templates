var grammar =
{"symbols":["end","if","else","for","fill","identifier","space","{","}","(",")","!","&&","||","==","!=","<",">","<=",">=","+","-","*","/","%",".","string","raw-content","top-level","block","statement-list","statement","if-statement","if-statement-head","else-clause","for-statement","fill-statement","parenthesized-expression","expression","expression6","expression5","expression4","expression3","expression2","expression1","content","content1","operator","S"],"compressed":"GxUBBGEeYQACAwdhCAUHYR5hCAQDHmEfBR5hLWEfAR8DLWEfBAElASABIwEkAQMhYSIBBQFhJWEdAQMCYR0BBwNhBWElYR0BBQRhBWElAQQJYSYKAQInYQMEJwxhKAQnDWEoASgHBCgOYSkEKA9hKQQoEGEpBCgRYSkEKBJhKQQoE2EpASkDBCkUYSoEKRVhKgEqBAQqFmErBCoXYSsEKhhhKwErAgQrGWEsASwDARoBBQElAwItLgMtMC4BLgQBGgEvAQUBGw8BCwEZARQBFQEWARcBGAESARMBEAERAQ4BDwEMAQ0CAQYCMAYA=="}
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
                });
                productionCode++;
            }
        }
    }
    console.log(productions);
}


compileGrammar();
//console.log(grammar);

