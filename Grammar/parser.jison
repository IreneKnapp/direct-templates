{"tokens": ["if", "else", "for", "fill", "identifier", "space", "{", "}",
            "(", ")", "&&", "||", "==", "!=", "<", ">", "<=", ">=", "+",
            "-", "*", "/", "%", "."],
"start": "top-level",
"bnf": {
"top-level": [
    "statement-list end",
    "statement-list S end",
    "S statement-list end",
    "S statement-list S end"
],
"block": [
    "{ }",
    "{ S }",
    "{ statement-list }",
    "{ statement-list S }",
    "{ S statement-list }",
    "{ S statement-list S }"
],
"statement-list": [
    "statement-list statement",
    "statement-list S statement",
    "statement-list content statement",
    "statement-list content S statement",
    "statement-list S content statement",
    "statement-list S content S statement",
    "statement",
    "content statement",
    "content S statement"
],
"statement": [
    "parenthesized-expression",
    "if-statement",
    "for-statement",
    "fill-statement"
],
"if-statement": [
    "if-statement-head else-clause",
    "if-statement-head S else-clause"
],
"if-statement-head": [
    "if parenthesized-expression block",
    "if parenthesized-expression S block",
    "if S parenthesized-expression block",
    "if S parenthesized-expression S block"
],
"else-clause": [
    "else block",
    "else S block"
],
"for-statement": [
    "for identifier parenthesized-expression block",
    "for identifier parenthesized-expression S block",
    "for identifier S parenthesized-expression block",
    "for identifier S parenthesized-expression S block",
    "for S identifier parenthesized-expression block",
    "for S identifier parenthesized-expression S block",
    "for S identifier S parenthesized-expression block",
    "for S identifier S parenthesized-expression S block"
],
"fill-statement": [
    "fill identifier parenthesized-expression",
    "fill identifier S parenthesized-expression",
    "fill S identifier parenthesized-expression",
    "fill S identifier S parenthesized-expression"
],
"parenthesized-expression": [
    "( expression )",
    "( S expression )"
],
"expression": [
    "expression6",
    "expression6 S"
],
"expression6": [
    "expression6 && expression5",
    "expression6 && S expression5",
    "expression6 || expression5",
    "expression6 || S expression5",
    "expression5"
],
"expression5": [
    "expression5 == expression4",
    "expression5 == S expression4",
    "expression5 != expression4",
    "expression5 != S expression4",
    "expression5 < expression4",
    "expression5 < S expression4",
    "expression5 > expression4",
    "expression5 > S expression4",
    "expression5 <= expression4",
    "expression5 <= S expression4",
    "expression5 >= expression4",
    "expression5 >= S expression4",
    "expression4"
],
"expression4": [
    "expression4 + expression3",
    "expression4 + S expression3",
    "expression4 - expression3",
    "expression4 - S expression3",
    "expression3"
],
"expression3": [
    "expression3 * expression2",
    "expression3 * S expression2",
    "expression3 / expression2",
    "expression3 / S expression2",
    "expression3 % expression2",
    "expression3 % S expression2",
    "expression2"
],
"expression2": [
    "expression2 . expression1",
    "expression2 . S expression1",
    "expression1"
],
"expression1": [
    "string",
    "identifier",
    "parenthesized-expression"
],
"content": [
    "content content1",
    "content S content1",
    "content1"
],
"content1": [
    "string",
    "operator",
    "identifier",
    "raw-content"
],
"operator": [
    "!",
    ".",
    "+",
    "-",
    "*",
    "/",
    "%",
    "<=",
    ">=",
    "<",
    ">",
    "==",
    "!=",
    "&&",
    "||"
],
"S": [
    "space",
    "S space"
]}}
