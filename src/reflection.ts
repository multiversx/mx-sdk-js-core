export function getJavascriptPrototypesInHierarchy(obj: any, filter: (prototype: any) => boolean): any[] {
    let prototypes: any[] = [];
    let prototype: any = Object.getPrototypeOf(obj);

    while (prototype && filter(prototype)) {
        prototypes.push(prototype);
        prototype = Object.getPrototypeOf(prototype);
    }

    return prototypes;
}
