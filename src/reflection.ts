export function getJavascriptPrototypesInHierarchy(obj: Object, filter: (prototype: any) => boolean): Object[] {
    let prototypes: Object[] = [];
    let prototype: any = Object.getPrototypeOf(obj);

    while (prototype && filter(prototype)) {
        prototypes.push(prototype);
        prototype = Object.getPrototypeOf(prototype);
    }

    return prototypes;
}
