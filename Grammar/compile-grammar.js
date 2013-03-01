var grammarIn =
{"symbols":["end","if","else","for","fill","identifier","space","{","}","(",")","!","&&","||","==","!=","<",">","<=",">=","+","-","*","/","%",".","string","raw-content","top-level","block","statement-list","statement","if-statement","if-statement-head","else-clause","for-statement","fill-statement","parenthesized-expression","expression","expression6","expression5","expression4","expression3","expression2","expression1","content","content1","operator","S"],"productions":"GBQBBGQeYAACAAxhCAQHYBhhCAADHGQfBBhhLGQfABwDLGQfBAQlACABIAQkAAwhYCgBBARhJGQdAAwCYBQBBAxhBGQlYBQBBABhBGQlAAAJYCgKAAgnYAwEJABhKAAnDGQoACAHBCAOYCQEKAxhKAAoEGQpBCARYCQEKBhhKAAoEGQpACQDBCQUYCgEKBRhKAQqBAAqFGQrBCgXYCwEKBBhKAQrAAArGGQsACADABgBBAQlAAgtLAwtMCgBLAABGAQvAAQBGAwBCAQZABABFAQWABwBGAQSABwBEAQRAAgBDAQMAAQCAAgCMAg"};

Base64 = {
decode: function(input) {
    var output = [];
    for(var i = 0; i < input.length; i += 3) {
        var valueA = input[i];
        var valueB = input[i + 1];
        var valueC = input[i + 2];
        var bitBundles = [valueA >> 2,
                          (valueA << 6) % 64 + (valueB >> 4),
                          (valueB << 4) % 64 + (valueC >> 6),
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
    } else if(input.length %2 == 2) {
        output += "==";
    }
    return output;
}
};