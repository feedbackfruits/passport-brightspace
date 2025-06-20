// @ts-nocheck
import BrightspaceStrategy from '../src';
import { expect } from 'chai';

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

  describe('getOAuthAccessToken method override', function() {
    let strategy;
    let originalRequest;

    beforeEach(function() {
      strategy = new BrightspaceStrategy({
        host: 'https://api.brightspace.im',
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});

      // Mock the internal _request method
      originalRequest = strategy._oauth2._request;
    });

    afterEach(function() {
      if (originalRequest) {
        strategy._oauth2._request = originalRequest;
      }
    });

    it('should handle successful JSON token response', function(done) {
      const mockTokenResponse = {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      strategy._oauth2._request = function(method, url, headers, data, accessToken, callback) {
        expect(method).to.equal('POST');
        expect(headers['Content-Type']).to.equal('application/x-www-form-urlencoded');
        expect(headers['Authorization']).to.include('Basic');

        // Verify the Authorization header contains base64 encoded client credentials
        const expectedAuth = 'Basic ' + Buffer.from('ABC123:secret').toString('base64');
        expect(headers['Authorization']).to.equal(expectedAuth);

        callback(null, JSON.stringify(mockTokenResponse), null);
      };

      strategy._oauth2.getOAuthAccessToken('authorization_code', {}, function(error, accessToken, refreshToken, results) {
        expect(error).to.be.null;
        expect(accessToken).to.equal('mock_access_token');
        expect(refreshToken).to.equal('mock_refresh_token');
        expect(results.token_type).to.equal('Bearer');
        expect(results.expires_in).to.equal(3600);
        expect(results.refresh_token).to.be.undefined; // Should be deleted from results
        done();
      });
    });

    it('should handle URL-encoded token response fallback', function(done) {
      const urlEncodedResponse = 'access_token=url_encoded_token&refresh_token=url_refresh_token&token_type=Bearer&expires_in=7200';

      strategy._oauth2._request = function(method, url, headers, data, accessToken, callback) {
        // Simulate a response that's not valid JSON but is URL-encoded
        callback(null, urlEncodedResponse, null);
      };

      strategy._oauth2.getOAuthAccessToken('authorization_code', {}, function(error, accessToken, refreshToken, results) {
        expect(error).to.be.null;
        expect(accessToken).to.equal('url_encoded_token');
        expect(refreshToken).to.equal('url_refresh_token');
        expect(results.token_type).to.equal('Bearer');
        expect(results.expires_in).to.equal('7200');
        expect(results.refresh_token).to.be.undefined; // Should be deleted from results
        done();
      });
    });

    it('should handle refresh token flow', function(done) {
      const mockTokenResponse = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        token_type: 'Bearer'
      };

      strategy._oauth2._request = function(method, url, headers, data, accessToken, callback) {
        expect(data).to.include('refresh_token=old_refresh_token');
        expect(data).to.include('grant_type=refresh_token');
        callback(null, JSON.stringify(mockTokenResponse), null);
      };

      strategy._oauth2.getOAuthAccessToken('old_refresh_token', { grant_type: 'refresh_token' }, function(error, accessToken, refreshToken, results) {
        expect(error).to.be.null;
        expect(accessToken).to.equal('new_access_token');
        expect(refreshToken).to.equal('new_refresh_token');
        done();
      });
    });

    it('should handle authorization code flow', function(done) {
      const mockTokenResponse = {
        access_token: 'code_access_token',
        refresh_token: 'code_refresh_token'
      };

      strategy._oauth2._request = function(method, url, headers, data, accessToken, callback) {
        expect(data).to.include('code=authorization_code_value');
        expect(data).not.to.include('grant_type=refresh_token');
        callback(null, JSON.stringify(mockTokenResponse), null);
      };

      strategy._oauth2.getOAuthAccessToken('authorization_code_value', {}, function(error, accessToken, refreshToken, results) {
        expect(error).to.be.null;
        expect(accessToken).to.equal('code_access_token');
        expect(refreshToken).to.equal('code_refresh_token');
        done();
      });
    });

    it('should handle callback function as second parameter', function(done) {
      const mockTokenResponse = {
        access_token: 'callback_token',
        refresh_token: 'callback_refresh'
      };

      strategy._oauth2._request = function(method, url, headers, data, accessToken, callback) {
        callback(null, JSON.stringify(mockTokenResponse), null);
      };

      // Test overload where second parameter is the callback
      strategy._oauth2.getOAuthAccessToken('test_code', function(error, accessToken, refreshToken, results) {
        expect(error).to.be.null;
        expect(accessToken).to.equal('callback_token');
        expect(refreshToken).to.equal('callback_refresh');
        done();
      });
    });

    it('should handle network errors', function(done) {
      const networkError = new Error('Network connection failed');

      strategy._oauth2._request = function(method, url, headers, data, accessToken, callback) {
        callback(networkError);
      };

      strategy._oauth2.getOAuthAccessToken('test_code', {}, function(error, accessToken, refreshToken, results) {
        expect(error).to.equal(networkError);
        expect(accessToken).to.be.undefined;
        expect(refreshToken).to.be.undefined;
        expect(results).to.be.undefined;
        done();
      });
    });

    it('should handle malformed JSON gracefully with URL-encoded fallback', function(done) {
      const malformedResponse = 'access_token=fallback_token&malformed=json{incomplete';

      strategy._oauth2._request = function(method, url, headers, data, accessToken, callback) {
        callback(null, malformedResponse, null);
      };

      strategy._oauth2.getOAuthAccessToken('test_code', {}, function(error, accessToken, refreshToken, results) {
        expect(error).to.be.null;
        expect(accessToken).to.equal('fallback_token');
        expect(results.malformed).to.equal('json{incomplete');
        done();
      });
    });
  });
});
