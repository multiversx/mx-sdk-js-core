export function hasJavascriptConstructor(obj: Object, javascriptConstructorName: string): boolean {
    return obj.constructor.name == javascriptConstructorName;
}

export function getJavascriptConstructorsNamesInHierarchy(obj: Object, filter: (prototype: any) => boolean): string[] {
    let prototypes = getJavascriptPrototypesInHierarchy(obj, filter);
    let constructorNames = prototypes.map(prototype => prototype.constructor.name);
    return constructorNames;
}

export function getJavascriptPrototypesInHierarchy(obj: Object, filter: (prototype: any) => boolean): Object[] {
    let prototypes: Object[] = [];
    let prototype: any = Object.getPrototypeOf(obj);

    while (prototype && filter(prototype)) {
        prototypes.push(prototype);
        prototype = Object.getPrototypeOf(prototype);
    }

    return prototypes;
}
