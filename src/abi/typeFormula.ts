export class TypeFormula {
    name: string;
    metadata: any;
    typeParameters: TypeFormula[];

    constructor(name: string, typeParameters: TypeFormula[], metadata?: any) {
        this.name = name;
        this.typeParameters = typeParameters;
        this.metadata = metadata;
    }

    toString(): string {
        const hasTypeParameters = this.typeParameters.length > 0;
        const typeParameters = hasTypeParameters
            ? `<${this.typeParameters.map((tp) => tp.toString()).join(", ")}>`
            : "";
        const baseName = `${this.name}${typeParameters}`;

        return this.metadata !== undefined ? `${baseName}*${this.metadata}*` : baseName;
    }
}
