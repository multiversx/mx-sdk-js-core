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
        if (this.typeParameters.length > 0) {
            const typeParameters = this.typeParameters.map((typeParameter) => typeParameter.toString()).join(", ");
            const name = `${this.name}<${typeParameters}>`;
            if (this.metadata !== undefined) {
                return `${name}*${this.metadata}*`;
            }
            return name;
        } else {
            if (this.metadata !== undefined) {
                return `${this.name}*${this.metadata}*`;
            }
            return this.name;
        }
    }
}
