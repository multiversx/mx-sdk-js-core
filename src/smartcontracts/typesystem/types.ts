import { getJavascriptConstructorsNamesInHierarchy, getJavascriptPrototypesInHierarchy, hasJavascriptConstructor } from "../../reflection";
import { guardTrue, guardValueIsSet } from "../../utils";

/**
 * An abstraction that represents a Type. Handles both generic and non-generic types.
 * Once instantiated as a Type, a generic type is "closed" (as opposed to "open").
 */
export class Type {
    private readonly name: string;
    private readonly typeParameters: Type[];
    protected readonly cardinality: TypeCardinality;

    public constructor(name: string, typeParameters: Type[] = [], cardinality: TypeCardinality = TypeCardinality.fixed(1)) {
        guardValueIsSet("name", name);

        this.name = name;
        this.typeParameters = typeParameters;
        this.cardinality = cardinality;
    }

    getName(): string {
        return this.name;
    }

    /**
     * Gets the fully qualified name of the type, to allow for better (efficient and non-ambiguous) type comparison within erdjs' typesystem.
     */
    getFullyQualifiedName(): string {
        let joinedTypeParameters = this.getTypeParameters().map(type => type.getFullyQualifiedName()).join(", ");

        return this.isGenericType() ? 
            `erdjs:types:${this.getName()}<${joinedTypeParameters}>` : 
            `erdjs:types:${this.getName()}`;
    }

    hasJavascriptConstructor(javascriptConstructorName: string): boolean {
        return hasJavascriptConstructor(this, javascriptConstructorName);
    }

    hasJavascriptConstructorInHierarchy(javascriptConstructorName: string): boolean {
        return getJavascriptConstructorsNamesInHierarchy(this, prototype => prototype.belongsToTypesystem).includes(javascriptConstructorName);
    }

    getTypeParameters(): Type[] {
        return this.typeParameters;
    }

    isGenericType(): boolean {
        return this.typeParameters.length > 0;
    }

    getFirstTypeParameter(): Type {
        guardTrue(this.typeParameters.length > 0, "type parameters length > 0");
        return this.typeParameters[0];
    }

    /**
     * Generates type expressions similar to elrond-wasm-rs. 
     */
    toString() {
        let typeParameters: string = this.getTypeParameters().map(type => type.toString()).join(", ");
        let typeParametersExpression = typeParameters ? `<${typeParameters}>` : "";
        return `${this.name}${typeParametersExpression}`;
    }

    equals(other: Type): boolean {
        return Type.equals(this, other);
    }

    static equals(a: Type, b: Type): boolean {
        return a.getFullyQualifiedName() == b.getFullyQualifiedName();
    }

    static equalsMany(a: Type[], b: Type[]) {
        return a.every((type: Type, i: number) => type.equals(b[i]));
    }

    static isAssignableFromMany(a: Type[], b: Type[]) {
        return a.every((type: Type, i: number) => type.isAssignableFrom(b[i]));
    }

    differs(other: Type): boolean {
        return !this.equals(other);
    }

    valueOf() {
        return this.name;
    }

    /**
     * Inspired from: https://docs.microsoft.com/en-us/dotnet/api/system.type.isassignablefrom
     * For (most) generics, type invariance is expected (assumed) - neither covariance, nor contravariance are supported yet (will be supported in a next release).
     * 
     * One exception though: for {@link OptionType}, we simulate covariance for missing (not provided) values.
     * For example, Option<u32> is assignable from Option<?>.
     * For more details, see the implementation of {@link OptionType} and @{@link OptionalType}.
     * 
     * Also see:
     *  - https://en.wikipedia.org/wiki/Covariance_and_contravariance_(computer_science)
     *  - https://docs.microsoft.com/en-us/dotnet/standard/generics/covariance-and-contravariance
     */
    isAssignableFrom(other: Type): boolean {
        let invariantTypeParameters = Type.equalsMany(this.getTypeParameters(), other.getTypeParameters());
        if (!invariantTypeParameters) {
            return false;
        }

        let fullyQualifiedNameOfThis = this.getFullyQualifiedName();
        let fullyQualifiedNamesInHierarchyOfOther = Type.getFullyQualifiedNamesInHierarchy(other);
        if (fullyQualifiedNamesInHierarchyOfOther.includes(fullyQualifiedNameOfThis)) {
            return true;
        }

        let javascriptConstructorNameOfThis = this.constructor.name;
        let javascriptConstructorNamesInHierarchyOfOther = getJavascriptConstructorsNamesInHierarchy(other, prototype => prototype.belongsToTypesystem);
        if (javascriptConstructorNamesInHierarchyOfOther.includes(javascriptConstructorNameOfThis)) {
            return true;
        }

        return false;
    }

    private static getFullyQualifiedNamesInHierarchy(type: Type): string[] {
        let prototypes: any[] = getJavascriptPrototypesInHierarchy(type, prototype => prototype.belongsToTypesystem);
        let fullyQualifiedNames = prototypes.map(prototype => prototype.getFullyQualifiedName.call(type));
        return fullyQualifiedNames;
    }

    /**
     * Converts the account to a pretty, plain JavaScript object.
     */
    toJSON(): any {
        return {
            name: this.name,
            typeParameters: this.typeParameters.map(item => item.toJSON())
        };
    }

    getCardinality(): TypeCardinality {
        return this.cardinality;
    }

    /**
     * A special marker for types within erdjs' typesystem.
     */
    private belongsToTypesystem() {}
}

/**
 * TODO: Simplify this class, keep only what is needed.
 * 
 * An abstraction for defining and operating with the cardinality of a (composite or simple) type.
 * 
 * Simple types (the ones that are directly encodable) have a fixed cardinality: [lower = 1, upper = 1].
 * Composite types (not directly encodable) do not follow this constraint. For example:
 *  - VarArgs: [lower = 0, upper = *]
 *  - OptionalResult: [lower = 0, upper = 1]
 */
export class TypeCardinality {
    /**
     * An arbitrarily chosen, reasonably large number.
     */
    private static MaxCardinality: number = 4096;

    private readonly lowerBound: number;
    private readonly upperBound?: number;

    private constructor(lowerBound: number, upperBound?: number) {
        this.lowerBound = lowerBound;
        this.upperBound = upperBound;
    }

    static fixed(value: number): TypeCardinality {
        return new TypeCardinality(value, value);
    }

    static variable(value?: number) {
        return new TypeCardinality(0, value);
    }

    isSingular(): boolean {
        return this.lowerBound == 1 && this.upperBound == 1;
    }

    isSingularOrNone(): boolean {
        return this.lowerBound == 0 && this.upperBound == 1;
    }

    isComposite(): boolean {
        return this.upperBound != 1;
    }

    isFixed(): boolean {
        return this.lowerBound == this.upperBound;
    }

    getLowerBound(): number {
        return this.lowerBound;
    }

    getUpperBound(): number {
        return this.upperBound || TypeCardinality.MaxCardinality;
    }
}

export class PrimitiveType extends Type {
    constructor(name: string) {
        super(name);
    }
}

export abstract class CustomType extends Type {
}

export abstract class TypedValue {
    private readonly type: Type;

    constructor(type: Type) {
        this.type = type;
    }

    getType(): Type {
        return this.type;
    }

    abstract equals(other: any): boolean;
    abstract valueOf(): any;

    hasJavascriptConstructor(javascriptConstructorName: string): boolean {
        return hasJavascriptConstructor(this, javascriptConstructorName);
    }

    hasJavascriptConstructorInHierarchy(javascriptConstructorName: string): boolean {
        return getJavascriptConstructorsNamesInHierarchy(this, prototype => prototype.belongsToTypesystem).includes(javascriptConstructorName);
    }

    /**
     * A special marker for values within erdjs' typesystem.
     */
     private belongsToTypesystem() {}
}

export abstract class PrimitiveValue extends TypedValue {
    constructor(type: Type) {
        super(type);
    }
}

export function isTyped(value: any) {
    return value.belongsToTypesystem !== undefined;
}

export class TypePlaceholder extends Type {
    constructor() {
        super("...");
    }
}


export class NullType extends Type {
    constructor() {
        super("?");
    }
}
