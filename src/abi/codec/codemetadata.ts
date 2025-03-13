import { CodeMetadata, CodeMetadataLength } from "../../core/codeMetadata";
import { CodeMetadataValue } from "../typesystem/codeMetadata";

export class CodeMetadataCodec {
    decodeNested(buffer: Buffer): [CodeMetadataValue, number] {
        const codeMetadata = CodeMetadata.newFromBytes(buffer.slice(0, CodeMetadataLength));
        return [new CodeMetadataValue(codeMetadata), CodeMetadataLength];
    }

    decodeTopLevel(buffer: Buffer): CodeMetadataValue {
        const codeMetadata = CodeMetadata.newFromBytes(buffer);
        return new CodeMetadataValue(codeMetadata);
    }

    encodeNested(codeMetadata: CodeMetadataValue): Buffer {
        return Buffer.from(codeMetadata.valueOf().toBytes());
    }

    encodeTopLevel(codeMetadata: CodeMetadataValue): Buffer {
        return Buffer.from(codeMetadata.valueOf().toBytes());
    }
}
