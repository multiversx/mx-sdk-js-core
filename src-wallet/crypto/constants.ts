// In a future PR, improve versioning infrastructure for key-file objects in erdjs.
export const Version = 4;
export const CipherAlgorithm = "aes-128-ctr";
export const DigestAlgorithm = "sha256";
export const KeyDerivationFunction = "scrypt";

// X25519 public key encryption
export const PubKeyEncVersion = 1;
export const PubKeyEncCipher = "x25519-xsalsa20-poly1305";
