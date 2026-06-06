import initMath, { add, multiply, factorial } from '../../rust-utils/math-utils/pkg/math_utils.js';
import initString, { reverse_string, count_vowels, to_snake_case } from '../../rust-utils/string-utils/pkg/string_utils.js';

let mathReady = false;
let stringReady = false;

export async function loadWasmUtils() {
    if (!mathReady) {
        await initMath();
        mathReady = true;
    }
    if (!stringReady) {
        await initString();
        stringReady = true;
    }
}

export const mathUtils = {
    add,
    multiply,
    factorial,
};

export const stringUtils = {
    reverse: reverse_string,
    countVowels: count_vowels,
    toSnakeCase: to_snake_case,
};
