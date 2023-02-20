import * as errors from "../../errors";
import { AddressType } from "./address";
import { OptionalType } from "./algebraic";
import { BooleanType } from "./boolean";
import { BytesType } from "./bytes";
import { CodeMetadataType } from "./codeMetadata";
import { CompositeType } from "./composite";
import { EnumType, EnumVariantDefinition } from "./enum";
import { FieldDefinition } from "./fields";
import { ListType, OptionType } from "./generic";
import { ArrayVecType } from "./genericArray";
import { H256Type } from "./h256";
import { NothingType } from "./nothing";
import {
    BigIntType,
    BigUIntType,
    I16Type,
    I32Type,
    I64Type,
    I8Type,
    U16Type,
    U32Type,
    U64Type,
    U8Type
} from "./numerical";
import { StringType } from "./string";
import { StructType } from "./struct";
import { TokenIdentifierType } from "./tokenIdentifier";
import { TupleType } from "./tuple";
import { CustomType, Type } from "./types";
import { VariadicType } from "./variadic";

type TypeFactory = (...typeParameters: Type[]) => Type;

export class TypeMapper {
    private readonly openTypesFactories: Map<string, TypeFactory>;
    private readonly closedTypesMap: Map<string, Type>;
    private readonly learnedTypesMap: Map<string, Type>;

    constructor(learnedTypes: CustomType[] = []) {
        this.openTypesFactories = new Map<string, TypeFactory>([
            ["Option", (...typeParameters: Type[]) => new OptionType(typeParameters[0])],
            ["List", (...typeParameters: Type[]) => new ListType(typeParameters[0])],
            // For the following open generics, we use a slightly different typing than the one defined by mx-sdk-rs (temporary workaround).
            ["VarArgs", (...typeParameters: Type[]) => new VariadicType(typeParameters[0])],
            ["MultiResultVec", (...typeParameters: Type[]) => new VariadicType(typeParameters[0])],
            ["variadic", (...typeParameters: Type[]) => new VariadicType(typeParameters[0])],
            ["OptionalArg", (...typeParameters: Type[]) => new OptionalType(typeParameters[0])],
            ["optional", (...typeParameters: Type[]) => new OptionalType(typeParameters[0])],
            ["OptionalResult", (...typeParameters: Type[]) => new OptionalType(typeParameters[0])],
            ["multi", (...typeParameters: Type[]) => new CompositeType(...typeParameters)],
            ["MultiArg", (...typeParameters: Type[]) => new CompositeType(...typeParameters)],
            ["MultiResult", (...typeParameters: Type[]) => new CompositeType(...typeParameters)],
            ["multi", (...typeParameters: Type[]) => new CompositeType(...typeParameters)],
            // Perhaps we can adjust the ABI generator to only output "tuple", instead of "tupleN"?
            ["tuple", (...typeParameters: Type[]) => new TupleType(...typeParameters)],
            ["tuple2", (...typeParameters: Type[]) => new TupleType(...typeParameters)],
            ["tuple3", (...typeParameters: Type[]) => new TupleType(...typeParameters)],
            ["tuple4", (...typeParameters: Type[]) => new TupleType(...typeParameters)],
            ["tuple5", (...typeParameters: Type[]) => new TupleType(...typeParameters)],
            ["tuple6", (...typeParameters: Type[]) => new TupleType(...typeParameters)],
            ["tuple7", (...typeParameters: Type[]) => new TupleType(...typeParameters)],
            ["tuple8", (...typeParameters: Type[]) => new TupleType(...typeParameters)],
            // Known-length arrays.
            // TODO: Handle these in typeExpressionParser!
            ["array20", (...typeParameters: Type[]) => new ArrayVecType(20, typeParameters[0])],
            ["array32", (...typeParameters: Type[]) => new ArrayVecType(32, typeParameters[0])],
            ["array46", (...typeParameters: Type[]) => new ArrayVecType(46, typeParameters[0])],
            ["array64", (...typeParameters: Type[]) => new ArrayVecType(64, typeParameters[0])],
        ]);

        // For closed types, we hold actual type instances instead of type constructors / factories (no type parameters needed).
        this.closedTypesMap = new Map<string, Type>([
            ["u8", new U8Type()],
            ["u16", new U16Type()],
            ["u32", new U32Type()],
            ["u64", new U64Type()],
            ["U64", new U64Type()],
            ["BigUint", new BigUIntType()],
            ["i8", new I8Type()],
            ["i16", new I16Type()],
            ["i32", new I32Type()],
            ["i64", new I64Type()],
            ["Bigint", new BigIntType()],
            ["BigInt", new BigIntType()],
            ["bool", new BooleanType()],
            ["bytes", new BytesType()],
            ["Address", new AddressType()],
            ["H256", new H256Type()],
            ["utf-8 string", new StringType()],
            ["TokenIdentifier", new TokenIdentifierType()],
            ["EgldOrEsdtTokenIdentifier", new TokenIdentifierType()],
            ["CodeMetadata", new CodeMetadataType()],
            ["nothing", new NothingType()],
            ["AsyncCall", new NothingType()]
        ]);

        this.learnedTypesMap = new Map<string, Type>();

        // Boostrap from previously learned types, if any.
        for (const type of learnedTypes) {
            this.learnedTypesMap.set(type.getName(), type);
        }
    }

    /**
     * Maps a "raw type" object to a "known (specific) type" object.
     * In the process, it also learns the new type.
     * Can only map types if their dependencies were previously learned (through mapping).
     */
    mapType(type: Type): Type {
        let mappedType = this.mapTypeRecursively(type);
        if (mappedType) {
            // We do not learn generic types (that also have type parameters),
            // we only learn closed, non-generic types.
            // Reason: in the ABI, generic types are unnamed.
            // E.g.: two occurrences of List<Foobar> aren't recognized as a single type (simplification).
            if (!mappedType.isGenericType()) {
                this.learnType(mappedType);
            }

            return mappedType;
        }

        throw new errors.ErrTypingSystem(`Cannot map the type "${type.getName()}" to a known type`);
    }

    private mapTypeRecursively(type: Type): Type | null {
        let isGeneric = type.isGenericType();

        let previouslyLearnedType = this.learnedTypesMap.get(type.getName());
        if (previouslyLearnedType) {
            return previouslyLearnedType;
        }

        let knownClosedType = this.closedTypesMap.get(type.getName());
        if (knownClosedType) {
            return knownClosedType;
        }

        if (type.hasExactClass(EnumType.ClassName)) {
            // This will call mapType() recursively, for all the enum variant fields.
            return this.mapEnumType(<EnumType>type);
        }

        if (type.hasExactClass(StructType.ClassName)) {
            // This will call mapType() recursively, for all the struct's fields.
            return this.mapStructType(<StructType>type);
        }

        if (isGeneric) {
            // This will call mapType() recursively, for all the type parameters.
            return this.mapGenericType(type);
        }

        return null;
    }

    private learnType(type: Type): void {
        this.learnedTypesMap.delete(type.getName());
        this.learnedTypesMap.set(type.getName(), type);
    }

    private mapStructType(type: StructType): StructType {
        let mappedFields = this.mappedFields(type.getFieldsDefinitions());
        let mappedStruct = new StructType(type.getName(), mappedFields);
        return mappedStruct;
    }

    private mapEnumType(type: EnumType): EnumType {
        let variants = type.variants.map(
            (variant) =>
                new EnumVariantDefinition(
                    variant.name,
                    variant.discriminant,
                    this.mappedFields(variant.getFieldsDefinitions())
                )
        );
        let mappedEnum = new EnumType(type.getName(), variants);
        return mappedEnum;
    }

    private mappedFields(definitions: FieldDefinition[]): FieldDefinition[] {
        return definitions.map(
            (definition) => new FieldDefinition(definition.name, definition.description, this.mapType(definition.type))
        );
    }

    private mapGenericType(type: Type): Type {
        let typeParameters = type.getTypeParameters();
        let mappedTypeParameters = typeParameters.map((item) => this.mapType(item));

        let factory = this.openTypesFactories.get(type.getName());
        if (!factory) {
            throw new errors.ErrTypingSystem(`Cannot map the generic type "${type.getName()}" to a known type`);
        }

        return factory(...mappedTypeParameters);
    }
}
