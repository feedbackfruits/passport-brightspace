const BrightspaceStrategy = require('../dist/strategy').default;
const { expect } = require('chai');

describe('Strategy OAuth Configuration', function() {
  let strategy;

  beforeEach(function() {
    strategy = new BrightspaceStrategy({
      host: 'https://api.brightspace.im',
      clientID: 'ABC123',
      clientSecret: 'secret'
    }, function() {});
  });

  describe('OAuth2 configuration', function() {
    it('should configure OAuth2 to use authorization header for GET requests', function() {
      expect(strategy._oauth2._useAuthorizationHeaderForGET).to.be.true;
    });

    it('should have overridden getOAuthAccessToken method', function() {
      expect(strategy._oauth2.getOAuthAccessToken).to.be.a('function');
      // The method should be different from the default OAuth2Strategy method
      expect(strategy._oauth2.getOAuthAccessToken.toString()).to.include('Basic');
    });

    it('should have access token URL configured', function() {
      expect(strategy._oauth2._getAccessTokenUrl).to.be.a('function');
    });
  });

  describe('URL configuration', function() {
    it('should set correct authorization URL', function() {
      expect(strategy._oauth2._authorizeUrl).to.equal('https://auth.brightspace.com/oauth2/auth');
    });

    it('should set correct access token URL', function() {
      expect(strategy._oauth2._accessTokenUrl).to.equal('https://auth.brightspace.com/core/connect/token');
    });

    it('should allow custom URLs', function() {
      const customStrategy = new BrightspaceStrategy({
        host: 'https://api.brightspace.im',
        clientID: 'ABC123',
        clientSecret: 'secret',
        authorizationURL: 'https://custom.brightspace.com/oauth2/auth',
        tokenURL: 'https://custom.brightspace.com/oauth2/token'
      }, function() {});

      expect(customStrategy._oauth2._authorizeUrl).to.equal('https://custom.brightspace.com/oauth2/auth');
      expect(customStrategy._oauth2._accessTokenUrl).to.equal('https://custom.brightspace.com/oauth2/token');
    });
  });

  describe('client credentials configuration', function() {
    it('should store client ID and secret', function() {
      expect(strategy._oauth2._clientId).to.equal('ABC123');
      expect(strategy._oauth2._clientSecret).to.equal('secret');
    });

    it('should configure different client credentials', function() {
      const differentStrategy = new BrightspaceStrategy({
        host: 'https://api.brightspace.im',
        clientID: 'XYZ789',
        clientSecret: 'different-secret'
      }, function() {});

      expect(differentStrategy._oauth2._clientId).to.equal('XYZ789');
      expect(differentStrategy._oauth2._clientSecret).to.equal('different-secret');
    });
  });
});
