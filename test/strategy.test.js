const BrightspaceStrategy = require('../lib/strategy');
const { expect } = require('chai');

describe('Strategy', function() {
  const strategy = new BrightspaceStrategy({
      clientID: 'ABC123',
      clientSecret: 'brightspace'
    },
    function() {}
  );

  it('should be named brightspace', function() {
    expect(strategy.name).to.equal('brightspace');
  });
});
