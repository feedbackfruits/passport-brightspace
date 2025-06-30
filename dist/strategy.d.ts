import OAuth2Strategy, { StrategyOptions, VerifyFunction } from 'passport-oauth2';
type BrightspaceStrategyOptions = StrategyOptions & {
    host: string;
    userProfileURL?: string;
};
export default class Strategy extends OAuth2Strategy {
    options: BrightspaceStrategyOptions;
    _userProfileURL: string;
    constructor(options: BrightspaceStrategyOptions, verify: VerifyFunction);
    userProfile(accessToken: string, done: (error: any, profile?: any) => void): void;
    parse(json: string | Record<string, unknown>): Record<string, unknown>;
}
export {};
