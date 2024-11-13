import { CodeMetadata, CodeMetadataLength } from "../codeMetadata";
import { CodeMetadataValue } from "../typesystem/codeMetadata";

export class CodeMetadataCodec {
    decodeNested(buffer: Buffer): [CodeMetadataValue, number] {
        const codeMetadata = CodeMetadata.fromBuffer(buffer.slice(0, CodeMetadataLength));
        return [new CodeMetadataValue(codeMetadata), CodeMetadataLength];
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
