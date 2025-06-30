"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const passport_oauth2_1 = __importStar(require("passport-oauth2"));
class Strategy extends passport_oauth2_1.default {
    constructor(options, verify) {
        options.authorizationURL = options.authorizationURL || 'https://auth.brightspace.com/oauth2/auth';
        options.tokenURL = options.tokenURL || 'https://auth.brightspace.com/core/connect/token';
        options.scopeSeparator = options.scopeSeparator || ' ';
        options.customHeaders = options.customHeaders || {};
        super(options, verify);
        this.options = options;
        console.log('Configuring strategy with options:', this.options);
        this.name = 'brightspace';
        this._userProfileURL = options.userProfileURL || `${this.options.host}/d2l/api/lp/1.31/users/whoami`;
        this._oauth2.useAuthorizationHeaderforGET(true);
        this._oauth2.getOAuthAccessToken = (code, params, callback) => {
            if (typeof params === 'function') {
                callback = params;
                params = {};
            }
            const actualParams = params;
            const actualCallback = callback;
            const codeParam = (actualParams.grant_type === 'refresh_token') ? 'refresh_token' : 'code';
            actualParams[codeParam] = code;
            const post_data = new URLSearchParams(actualParams).toString();
            const post_headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${this.options.clientID}:${this.options.clientSecret}`).toString('base64')
            };
            this._oauth2._request('POST', this._oauth2._getAccessTokenUrl(), post_headers, post_data, null, function (error, data, response) {
                if (error) {
                    actualCallback(error);
                }
                else {
                    let results;
                    try {
                        results = JSON.parse(data);
                    }
                    catch (e) {
                        results = Object.fromEntries(new URLSearchParams(data.toString()));
                    }
                    const access_token = results['access_token'];
                    const refresh_token = results['refresh_token'];
                    delete results['refresh_token'];
                    callback(null, access_token, refresh_token, results);
                }
            });
        };
    }
    userProfile(accessToken, done) {
        this._oauth2.get(this._userProfileURL, accessToken, (err, body, res) => {
            let json;
            if (err) {
                return done(new passport_oauth2_1.InternalOAuthError('Failed to fetch user profile', err));
            }
            try {
                json = JSON.parse(body);
            }
            catch (ex) {
                return done(new Error('Failed to parse user profile'));
            }
            const profile = this.parse(json);
            profile.provider = 'brightspace';
            profile._raw = body;
            profile._json = json;
            done(null, profile);
        });
    }
    ;
    parse(json) {
        if (typeof json === 'string') {
            json = JSON.parse(json);
        }
        if (json instanceof Array) {
            json = json[0];
        }
        const profile = {};
        const assertedJson = json;
        profile.id = assertedJson.Identifier;
        profile.displayName = `${assertedJson.FirstName} ${assertedJson.LastName}`;
        if (assertedJson.Email && assertedJson.Email.length) {
            profile.emails = [{ value: assertedJson.Email }];
        }
        return profile;
    }
    ;
}
exports.default = Strategy;
//# sourceMappingURL=strategy.js.map