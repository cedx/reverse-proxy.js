import {strict as assert} from "assert";
import {Application, Server} from "../lib/index.js";

/** Tests the features of the `Application` class. */
describe("Application", function() {
	describe(".debug", function() {
		it("should be `false` in production environment", function() {
			process.env.NODE_ENV = "production";
			assert.equal(new Application().debug, false);
		});

		it("should be `true` in development environment", function() {
			process.env.NODE_ENV = "development";
			assert(new Application().debug);
		});
	});

	describe(".environment", function() {
		it("should be 'development' if the `NODE_ENV` environment variable is not set", function() {
			delete process.env.NODE_ENV;
			assert.equal(new Application().environment, "development");
		});

		it("should equal the value of `NODE_ENV` environment variable when it is set", function() {
			process.env.NODE_ENV = "production";
			assert.equal(new Application().environment, "production");
		});
	});

	describe(".init()", function() {
		it("should initialize the `servers` property from the command line arguments", async function() {
			const app = new Application;
			await app.init({port: 80, target: 3000});
			expect(app.servers).to.be.an("array").and.have.lengthOf(1);
			assert.equal(app.servers[0].port, 80);
		});

		it("should initialize the `servers` property from the JSON configuration", async function() {
			const app = new Application;
			await app.init({config: `${__dirname}/fixtures/config.json`});
			expect(app.servers).to.be.an("array").and.have.lengthOf(1);
			assert.equal(app.servers[0].port, 80);
		});

		it("should initialize the `servers` property from the YAML configuration", async function() {
			const app = new Application;
			await app.init({config: `${__dirname}/fixtures/config.yaml`});
			expect(app.servers).to.be.an("array").and.have.lengthOf(1);
			assert.equal(app.servers[0].port, 80);
		});
	});

	describe("._parseConfiguration()", function() {
		it("should reject if the configuration has an invalid format", function() {
			assert.rejects(Application._parseConfig('"FooBar"'), TypeError);
		});

		it("should reject if the parsed JSON configuration has no `routes` and no `target` properties", function() {
			assert.rejects(Application._parseConfig('{"port": 80}'), TypeError);
		});

		it("should reject if the parsed YAML configuration has no `routes` and no `target` properties", function() {
			assert.rejects(Application._parseConfig("port: 80"), TypeError);
		});

		it("should completes with an array if the parsed JSON configuration is valid", async function() {
			const config = await Application._parseConfig('{"port": 80, "target": 3000}');
			expect(config).to.be.an("array").and.have.lengthOf(1);
			assert(config[0] instanceof Server);
			assert.equal(config[0].port, 80);
		});

		it("should completes with an array if the parsed YAML configuration is valid", async function() {
			const config = await Application._parseConfig("port: 80\ntarget: 3000");
			expect(config).to.be.an("array").and.have.lengthOf(1);
			assert(config[0] instanceof Server);
			assert.equal(config[0].port, 80);
		});

		it("should handle the loading of certificate files", async function() {
			const settings = `{
				"target": 3000,
				"ssl": {
					"cert": "test/fixtures/cert.pem",
					"key": "test/fixtures/key.pem"
				}
			}`;

			const config = await Application._parseConfig(settings);
			expect(config).to.be.an("array").and.have.lengthOf(1);
			assert(config[0] instanceof Server);

			const cert = config[0]._options.ssl.cert;
			assert(cert instanceof Buffer);
			assert(cert.toString().includes("-----BEGIN CERTIFICATE-----"));

			const key = config[0]._options.ssl.key;
			assert(key instanceof Buffer);
			assert(key.toString().includes("-----BEGIN ENCRYPTED PRIVATE KEY-----"));
		});
	});
});
