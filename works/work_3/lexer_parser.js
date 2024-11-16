const LEX_DIG_0 = 0;
const LEX_DIG_1 = 1;
const LEX_DIG_2 = 2;
const LEX_DIG_3 = 3;
const LEX_DIG_4 = 4;
const LEX_DIG_5 = 5;
const LEX_DIG_6 = 6;
const LEX_DIG_7 = 7;
const LEX_DIG_8 = 8;
const LEX_DIG_9 = 9;
const LEX_PLUS  = 10;
const LEX_MINUS = 11;
const LEX_MULT  = 12;
const LEX_DIV   = 13;
const LEX_POW   = 14;
const LEX_LPAR  = 15;
const LEX_RPAR  = 16;
const LEX_POINT = 17;

/**
 * Just simple calculator symbols for now
 * 
 * lexer - string -> [token]
 * 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 = Dig0, Dig1, ..., Dig9
 * +, -, *, /                   = SymPlus, SymMinus, SymMultiply, SymDivide
 * ^                            = SymPower
 * (, )                         = LPar, RPar
 * .                            = SymPoint
 * 
 */

// string -> [token]
function lexer(eqString) {
    tokens = []
    for (let i = 0; i < eqString.length; ++i) {
        let ch = eqString[i];
        switch (ch) {
            case ' ':
                break;
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                tokens.push(ch - 0);
                break;
            case '+':
                tokens.push(LEX_PLUS);
                break;
            case '-':
                tokens.push(LEX_MINUS);
                break;
            case '*':
                tokens.push(LEX_MULT);
                break;
            case '/':
                tokens.push(LEX_DIV);
                break;
            case '^':
                tokens.push(LEX_POW);
                break;
            case '(':
                tokens.push(LEX_LPAR);
                break;
            case ')':
                tokens.push(LEX_RPAR);
                break;
            case '.':
                tokens.push(LEX_POINT);
                break;
            default:
                console.log("ERROR: Unrecognized token: " + ch);
                return;
        }
    }

    return tokens;
}
