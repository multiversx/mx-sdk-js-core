import { Balance } from "../..";

export function print(balance: Balance) {
    let nonceString = balance.token.isFungible() ? '' : ` nonce: ${balance.getNonce()}`;
    console.log(`${balance.toCurrencyString()}${nonceString}`);
}

export function printList(balanceList: Balance[]) {
    balanceList.forEach((balance) => print(balance));
}

export function minutesToNonce(minutes: number): number {
    // the nonce is incremented every 6 seconds - in a minute the nonce increases by 10
    return minutes * 10;
}

export function now(): number {
    return Math.floor(Date.now() / 1000);
}

export function hours(hours: number): number {
    let asMinutes = hours * 60;
    return minutes(asMinutes);
}

export function minutes(minutes: number): number {
    let seconds = minutes * 60;
    return seconds;
}
