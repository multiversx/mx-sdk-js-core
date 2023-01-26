.PHONY: clean browser-tests

browser-tests: out-browser-tests/tests-unit.js out-browser-tests/tests-localnet.js out-browser-tests/tests-devnet.js out-browser-tests/tests-testnet.js

out-browser-tests/tests-unit.js: out-tests
	npx browserify $(shell find out-tests -type f -name '*.js' ! -name '*.net.spec.*') --require buffer/:buffer -o out-browser-tests/tests-unit.js --standalone tests -p esmify

out-browser-tests/tests-localnet.js: out-tests
	npx browserify $(shell find out-tests -type f -name '*.js' ! -name '*.spec.*') $(shell find out-tests -type f -name '*.local.net.spec.js') --require buffer/:buffer -o out-browser-tests/tests-localnet.js --standalone tests -p esmify

out-browser-tests/tests-devnet.js: out-tests
	npx browserify $(shell find out-tests -type f -name '*.js' ! -name '*.spec.*') $(shell find out-tests -type f -name '*.dev.net.spec.js') --require buffer/:buffer -o out-browser-tests/tests-devnet.js --standalone tests -p esmify

out-browser-tests/tests-testnet.js: out-tests
	npx browserify $(shell find out-tests -type f -name '*.js' ! -name '*.spec.*') $(shell find out-tests -type f -name '*.test.net.spec.js') --require buffer/:buffer -o out-browser-tests/tests-testnet.js --standalone tests -p esmify

out-tests:
	npx tsc -p tsconfig.tests.json

clean:
	rm -rf out-tests
	rm -rf out-browser-tests
