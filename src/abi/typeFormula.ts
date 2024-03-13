export class TypeFormula {
    name: string;
    typeParameters: TypeFormula[];

    constructor(name: string, typeParameters: TypeFormula[]) {
        this.name = name;
        this.typeParameters = typeParameters;
    }

    toString(): string {
        if (this.typeParameters.length > 0) {
            const typeParameters = this.typeParameters.map((typeParameter) => typeParameter.toString()).join(", ");
            return `${this.name}<${typeParameters}>`;
        } else {
            return this.name;
        }
    }
}
