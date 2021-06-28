import { ScArgumentsParser } from "../../scArgumentsParser";

export function debugTxData(data: string) {
    let { functionName, args } = ScArgumentsParser.parseSmartContractCallDataField(data);
    let parsedArgs = args.map((rawHex) => {
        let asNumber = parseInt(rawHex, 16);
        let asString = Buffer.from(rawHex, "hex").toString();
        return [asString, asNumber, rawHex];
    });
    return { functionName, parsedArgs };
}
