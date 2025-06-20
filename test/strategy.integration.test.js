const passport = require('passport');
const BrightspaceStrategy = require('../dist/strategy').default;
const { expect, assert } = require('chai');

describe('Strategy Integration with Passport', function() {
  beforeEach(function() {
    // Clear any existing strategies
    passport._strategies = {};
  });

  describe('passport.use()', function() {
    it('should register strategy with passport', function() {
      const strategy = new BrightspaceStrategy({
        host: 'https://api.brightspace.im',
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});

      passport.use(strategy);

      expect(passport._strategies.brightspace).to.exist;
      expect(passport._strategies.brightspace).to.be.an.instanceOf(BrightspaceStrategy);
    });

    it('should register strategy with custom name', function() {
      const strategy = new BrightspaceStrategy({
        host: 'https://api.brightspace.im',
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});

      passport.use('custom-brightspace', strategy);

      expect(passport._strategies['custom-brightspace']).to.exist;
      expect(passport._strategies['custom-brightspace']).to.be.an.instanceOf(BrightspaceStrategy);
    });
  });

  describe('authentication flow', function() {
    let strategy;
    let authenticateOptions;
    let redirectedToUrl;

    beforeEach(function() {
      strategy = new BrightspaceStrategy({
        host: 'https://api.brightspace.im',
        clientID: 'ABC123',
        clientSecret: 'secret',
        callbackURL: 'https://example.com/auth/brightspace/callback'
      }, function(accessToken, refreshToken, profile, done) {
        // Verify callback receives expected parameters
        expect(accessToken).to.be.a('string');
        expect(refreshToken).to.be.a('string');
        expect(profile).to.be.an('object');
        expect(profile.provider).to.equal('brightspace');
        done(null, { id: profile.id, name: profile.displayName });
      });

      strategy.error = function(err) {
        assert.fail('Strategy should not call error method in this test: ' + err.message);
      };

      strategy.redirect = function(url) {
        redirectedToUrl = url;
      };

      passport.use(strategy);
    });

    it('should generate authorization URL', function() {
      // Mock request and response objects
      const req = {
        query: {},
        session: {}
      };
      const res = {
        redirect: function(url) {
          expect(url).to.include('https://auth.brightspace.com/oauth2/auth');
          expect(url).to.include('client_id=ABC123');
          expect(url).to.include('response_type=code');
          expect(url).to.include('redirect_uri=');
        }
      };

      strategy.authenticate(req, authenticateOptions);
    });
  });

  describe('verify callback function', function() {
    it('should call verify function with correct parameters', function(done) {
      const mockAccessToken = 'access_token_123';
      const mockRefreshToken = 'refresh_token_123';
      const mockProfile = {
        id: '1',
        displayName: 'Test User',
        provider: 'brightspace'
      };

      const strategy = new BrightspaceStrategy({
        host: 'https://api.brightspace.im',
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function(accessToken, refreshToken, profile, cb) {
        expect(accessToken).to.equal(mockAccessToken);
        expect(refreshToken).to.equal(mockRefreshToken);
        expect(profile).to.deep.equal(mockProfile);
        expect(cb).to.be.a('function');
        cb(null, { id: profile.id });
        done();
      });

      // Directly call the verify function to test it
      strategy._verify(mockAccessToken, mockRefreshToken, mockProfile, function() {});
    });

    it('should handle verify function errors', function(done) {
      const strategy = new BrightspaceStrategy({
        host: 'https://api.brightspace.im',
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function(accessToken, refreshToken, profile, cb) {
        cb(new Error('User not found'));
      });

      strategy._verify('token', 'refresh', {}, function(err, user) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('User not found');
        expect(user).to.be.undefined;
        done();
      });
    });

    it('should handle verify function returning false', function(done) {
      const strategy = new BrightspaceStrategy({
        host: 'https://api.brightspace.im',
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function(accessToken, refreshToken, profile, cb) {
        cb(null, false); // Authentication failed
      });

      strategy._verify('token', 'refresh', {}, function(err, user) {
        expect(err).to.be.null;
        expect(user).to.be.false;
        done();
      });
    });
  });

  describe('strategy inheritance', function() {
    it('should inherit from OAuth2Strategy', function() {
      const strategy = new BrightspaceStrategy({
        host: 'https://api.brightspace.im',
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});

      expect(strategy).to.be.an.instanceOf(require('passport-oauth2'));
    });

    it('should have required OAuth2Strategy methods', function() {
      const strategy = new BrightspaceStrategy({
        host: 'https://api.brightspace.im',
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});

      expect(strategy.authenticate).to.be.a('function');
      expect(strategy.userProfile).to.be.a('function');
    });
  });
});
