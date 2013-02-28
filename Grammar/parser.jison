%lex
%%

\"(([^"\\]|"\\\""|"\\\\")*)\"      return 'string'
\'(([^'\\]|"\\'"|"\\\\")*)\'       return 'string'
\s+                                return 'space'
"{"                                return '{'
"}"                                return '}'
"("                                return '('
")"                                return ')'
"!"                                return '!'
"."                                return '.'
"+"                                return '+'
"-"                                return '-'
"*"                                return '*'
"/"                                return '/'
"%"                                return '%'
"<="                               return '<='
">="                               return '>='
"<"                                return '<'
">"                                return '>'
"=="                               return '=='
"!="                               return '!='
"&&"                               return '&&'
"||"                               return '||'
"if"                               return 'if'
"else"                             return 'else'
"for"                              return 'for'
"fill"                             return 'fill'
([a-zA-Z_]|[^\x01-\x7F])([a-zA-Z_0-9]|[^\x0a-\x7F])* return 'identifier'
<<EOF>>                            return 'end'
.+                                 return 'raw-content'

/lex
%start top-level
%%

top-level
    : statement-list end
    ;

block
    : '{' statement-list '}'
    ;

statement-list
    :
    | statement-list statement
    | statement-list content statement
    ;

statement
    : '(' expression ')'
    | if '(' expression ')' block
    | if '(' expression ')' block else block
    | for identifier '(' expression ')' block
    | fill identifier '(' expression ')'
    ;

expression
    : expression6
    ;

expression6
    : expression6 '&&' expression5
    | expression6 '||' expression5
    | expression5
    ;

expression5
    : expression5 '==' expression4
    | expression5 '!=' expression4
    | expression5 '<' expression4
    | expression5 '>' expression4
    | expression5 '<=' expression4
    | expression5 '>=' expression4
    | expression4
    ;

expression4
    : expression4 '+' expression3
    | expression4 '-' expression3
    | expression3
    ;

expression3
    : expression3 '*' expression2
    | expression3 '/' expression2
    | expression3 '%' expression2
    | expression2
    ;

expression2
    : expression2 '.' expression1
    | expression1
    ;

expression1
    : string
    | identifier
    | '(' expression ')'
    ;

content
    : content2
    ;

content2
    : content2 S content1
    | content1
    ;

content1
    : string
    | operator
    | identifier
    | raw-content
    ;

operator
    : '!'
    | '.'
    | '+'
    | '-'
    | '*'
    | '/'
    | '%'
    | '<='
    | '>='
    | '<'
    | '>'
    | '=='
    | '!='
    | '&&'
    | '||'
    ;

S
    :
    | S space
    ;
