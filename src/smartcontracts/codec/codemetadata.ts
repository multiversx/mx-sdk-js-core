import { CodeMetadata } from "../codeMetadata";
import { CodeMetadataValue } from "../typesystem/codeMetadata";

export class CodeMetadataCodec {
    decodeNested(buffer: Buffer): [CodeMetadataValue, number] {
        const codeMetadata = CodeMetadata.fromBuffer(buffer);

        return [new CodeMetadataValue(codeMetadata), length];
    }

    decodeTopLevel(buffer: Buffer): CodeMetadataValue {
        const codeMetadata = CodeMetadata.fromBuffer(buffer);

        return new CodeMetadataValue(codeMetadata);
    }

    encodeNested(codeMetadata: CodeMetadataValue): Buffer {
        return codeMetadata.valueOf().toBuffer();
    }

    encodeTopLevel(codeMetadata: CodeMetadataValue): Buffer {
        return codeMetadata.valueOf().toBuffer();
    }
}
