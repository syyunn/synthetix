require('.'); // import common test scaffolding

const { currentTime, fastForward } = require('../utils/testUtils');

const OneWeekSetup = artifacts.require('OneWeekSetup');

contract('LimitedSetup', accounts => {
	const [deployerAccount, owner] = accounts;

	let instance;
	let timestamp;
	beforeEach(async () => {
		timestamp = await currentTime();
		// the owner is the associated contract, so we can simulate
		instance = await OneWeekSetup.new(owner, {
			from: deployerAccount,
		});
	});
	describe('when mixed into a contract with one week setup', () => {
		it('then the time is the current time plus one week', async () => {
			assert.equal(
				(await instance.publicSetupExpiryTime()).toString(),
				(+timestamp + 3600 * 24 * 7).toString()
			);
		});
		describe('when a test function is invoked that is only allowed during setup', () => {
			it('then it succeeds', async () => {
				await instance.testFunc();
			});
			describe('when 6 days pass', () => {
				beforeEach(async () => {
					await fastForward(3600 * 24 * 6);
				});
				it('then it still succeeds', async () => {
					await instance.testFunc();
				});
				describe('when another day and change passes', () => {
					beforeEach(async () => {
						await fastForward(Math.round(3600 * 24 * 1.1));
					});
					it('then it fails as the setup period has expired', async () => {
						await assert.revert(instance.testFunc());
					});
				});
			});
		});
	});
});
