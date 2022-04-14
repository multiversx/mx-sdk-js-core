.PHONY: clean browser-tests

browser-tests: out-browser-tests/erdjs-tests-unit.js out-browser-tests/erdjs-tests-unit-min.js out-browser-tests/erdjs-tests-localnet.js out-browser-tests/erdjs-tests-devnet.js out-browser-tests/erdjs-tests-testnet.js

out-browser-tests/erdjs-tests-unit.js: out-tests
	npx browserify $(shell find out-tests -type f -name '*.js' ! -name '*.net.spec.*') --require buffer/:buffer -o out-browser-tests/erdjs-tests-unit.js --standalone erdjs-tests -p esmify

out-browser-tests/erdjs-tests-unit-min.js: out-tests
	npx browserify $(shell find out-tests -type f -name '*.js' ! -name '*.net.spec.*') --require buffer/:buffer -o out-browser-tests/erdjs-tests-unit-min.js --standalone erdjs-tests -p esmify -p tinyify

out-browser-tests/erdjs-tests-localnet.js: out-tests
	npx browserify $(shell find out-tests -type f -name '*.js' ! -name '*.spec.*') $(shell find out-tests -type f -name '*.local.net.spec.js') --require buffer/:buffer -o out-browser-tests/erdjs-tests-localnet.js --standalone erdjs-tests -p esmify

out-browser-tests/erdjs-tests-devnet.js: out-tests
	npx browserify $(shell find out-tests -type f -name '*.js' ! -name '*.spec.*') $(shell find out-tests -type f -name '*.dev.net.spec.js') --require buffer/:buffer -o out-browser-tests/erdjs-tests-devnet.js --standalone erdjs-tests -p esmify

out-browser-tests/erdjs-tests-testnet.js: out-tests
	npx browserify $(shell find out-tests -type f -name '*.js' ! -name '*.spec.*') $(shell find out-tests -type f -name '*.test.net.spec.js') --require buffer/:buffer -o out-browser-tests/erdjs-tests-testnet.js --standalone erdjs-tests -p esmify

out-tests:
	npx tsc -p tsconfig.tests.json

publish-erdjs-beta:
	npm publish --tag=beta --access=public

publish-erdjs:
	npm publish --access=public

clean:
	rm -rf out-tests
	rm -rf out-browser-tests
