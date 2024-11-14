const { expect } = require('chai');
const fs = require('fs');
const parse = require('../lib/profile').parse;

describe('profile.parse', function() {
  describe('example profile', function() {
    var profile;

    before(function(done) {
      fs.readFile('test/data/example.json', 'utf8', function(err, data) {
        if (err) { return done(err); }
        profile = parse(data);
        done();
      });
    });

    it('should parse profile', function() {
      expect(profile.id).to.equal('1');
      expect(profile.displayName).to.equal('monalisa octocat');
    });
  });
});
