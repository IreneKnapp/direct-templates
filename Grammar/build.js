var fs = require("fs");
var Jison = require("jison");

var grammarPath = process.argv[1];
grammarPath = grammarPath.substr(0, grammarPath.lastIndexOf('/'));
grammarPath += "/parser.jison";
var grammarJSON = fs.readFileSync(grammarPath);
var grammarIn = JSON.parse(grammarJSON);

var generator = new Jison.Generator(grammarIn, {
    type: "lalr",
    noDefaultResolve: true,
});
generator.computeLookaheads();

var flattenedTable = [];
flattenedTable.push(0);
flattenedTable.push(generator.productions.length);
for(var stateIndex = 0; stateIndex < generator.table.length; stateIndex++) {
    var state = generator.table[stateIndex];
    for(var symbolIndex = 0;
        symbolIndex < generator.symbols.length;
        symbolIndex++)
    {
        var action = state[symbolIndex];
        if(typeof action === "undefined") {
            flattenedTable.push(128);
            flattenedTable.push(0);
        } else if(action.length === 2) {
            if(action[0] == 1) {
                flattenedTable.push(128);
                flattenedTable.push(action[1]);
            } else if(action[0] == 2) {
                flattenedTable.push(0);
                flattenedTable.push(action[1]);
            }
        } else if(action === 3) {
            flattenedTable.push(0);
            flattenedTable.push(0);
        } else {
            flattenedTable.push(128);
            flattenedTable.push(0);
        }
    }
}


var runLengthEncodedTable = [];
var count = 0;
var valueHigh = null;
for(var i = 0; i < flattenedTable.length; i += 2) {
    var incomingValueHigh = flattenedTable[i];
    var incomingValueLow = flattenedTable[i + 1];
    if(count > 0) {
        if((incomingValueHigh == valueHigh) && (incomingValueLow == valueLow))
        {
            count++;
        } else {
            runLengthEncodedTable.push(count + valueHigh);
            runLengthEncodedTable.push(valueLow);
            count = 1;
            valueHigh = incomingValueHigh;
            valueLow = incomingValueLow;
        }
    } else {
        count = 1;
        valueHigh = incomingValueHigh;
        valueLow = incomingValueLow;
    }
}
if(count > 0) {
   runLengthEncodedTable.push(count + valueHigh);
   runLengthEncodedTable.push(valueLow);
}


var lempelZivWelchEncodedTable = [];
var dictionary = [];
for(var i = 0; i < 16; i++) {
    dictionary.push([i]);
}
var dictionaryPoint = 16;
var holdingArea = [];
for(var i in runLengthEncodedTable) {
    var value = runLengthEncodedTable[i];
    var bitBundles = [value >> 4, value % 16];
    for(var j in bitBundles) {
        var bitBundle = bitBundles[j];
        holdingArea.push(bitBundle);
    }
}
while(holdingArea.length > 0) {
    var lastMatch = null;
    for(var foundIndex = 0; foundIndex < dictionary.length; foundIndex++) {
        var code = dictionary[foundIndex];
        if(code.length <= holdingArea.length) {
            for(var k = 0; k < code.length; k++) {
                if(code[k] != holdingArea[k]) break;
            }
            if(k == code.length) lastMatch = foundIndex;
        }
    }
    var code = dictionary[lastMatch];
    var codeLength = code.length;
    var newCode = holdingArea.slice(0, codeLength + 2);
    
    lempelZivWelchEncodedTable.push(lastMatch);
    if(dictionary.length < 255) {
        dictionary.push(newCode);
    } else {
        dictionary[dictionaryPoint] = newCode;
    }
    dictionaryPoint = dictionaryPoint + 1;
    if(dictionaryPoint == 256) dictionaryPoint = 16;
    
    holdingArea = holdingArea.slice(codeLength);
}


var stringifiedTable = "";
for(var i = 0; i < runLengthEncodedTable.length; i += 3) {
    var valueA = runLengthEncodedTable[i];
    var valueB = runLengthEncodedTable[i + 1];
    var valueC = runLengthEncodedTable[i + 2];
    var bitBundles = [valueA >> 2,
                      (valueA << 6) % 64 + (valueB >> 4),
                      (valueB << 4) % 64 + (valueC >> 6),
                      valueC % 64];
    for(var j in bitBundles) {
        var bitBundle = bitBundles[j];
        if(bitBundle < 26) {
            stringifiedTable += String.fromCharCode
                (bitBundle + 'A'.charCodeAt(0));
        } else if(bitBundle < 52) {
            stringifiedTable += String.fromCharCode
                (bitBundle - 26 + 'a'.charCodeAt(0));
        } else if(bitBundle < 62) {
            stringifiedTable += String.fromCharCode
                (bitBundle - 52 + '0'.charCodeAt(0));
        } else if(bitBundle == 62) {
            stringifiedTable += "+";
        } else if(bitBundle == 63) {
            stringifiedTable += "/";
        }
    }
}
if(runLengthEncodedTable.length % 3 == 1) {
    stringifiedTable += "=";
} else if(runLengthEncodedTable.length %2 == 2) {
    stringifiedTable += "==";
}


var lineifiedTable = "";
var i = 0;
while(i < stringifiedTable.length) {
    var final = true;
    var length = stringifiedTable.length - i;
    if(length > 70) {
        length = 70;
        final = false;
    }
    lineifiedTable += "  \"";
    lineifiedTable += stringifiedTable.substr(i, length);
    lineifiedTable += "\"";
    if(!final) lineifiedTable += " +";
    lineifiedTable += "\n";
    i += length;
}

console.log(lineifiedTable);


/*
generator.symbols.forEach(function(symbol) {
    console.log(generator.symbols_[symbol], symbol);
});
generator.productions.forEach(function(production) {
    console.log(production.id, production.symbol, production.handle);
});
*/
