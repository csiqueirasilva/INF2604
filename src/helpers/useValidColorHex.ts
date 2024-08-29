import { getRandomColorHex } from "@helpers/RNGUtils";
import { useMemo } from "react";
import { Color, ColorRepresentation } from "three";

export function useValidColorHex(color?: ColorRepresentation) : string {
    let result : string|undefined = undefined;
    if (!color) {
        result = getRandomColorHex();
    } else if (color instanceof Color) {
        result = `#` + color.getHexString();
    }
    return useMemo(() => result || '#000000', [ result ]);
}