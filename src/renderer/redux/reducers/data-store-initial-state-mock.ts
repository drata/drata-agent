import { RendererDataStore } from '../../../types/renderer-data-store';

export const initialMockState: RendererDataStore = {
    hasAccessToken: true,
    lastCheckedAt: '2021-08-06T14:47:38.814Z',
    // deepcode ignore HardcodedNonCryptoSecret: this is testing fake data
    appVersion: '0.0.0',
    user: {
        id: 50,
        entryId: '59f74572-66c4-445a-bb3b-c793cecff8bf',
        // file deepcode ignore NoHardcodedCredentials: all this data is LOCAL. This file is only used to mock a UI state.
        email: 'DoNotReply@drata.com',
        firstName: 'John',
        lastName: 'Doe',
        drataTermsAgreedAt: '2021-08-05T19:49:55.476Z',
        createdAt: '2021-08-05T19:49:28.192Z',
        updatedAt: '2021-08-05T19:49:55.000Z',
        avatarUrl:
            'https://img-prod.dratacdn.com/7b50e039-cab0-4f4b-891a-a8982d2c864a/avatars/c4607951-b1e3-4e60-9a56-a3634005aeeb/DanielSosa.jpg',
        signature:
            '169761b6207ac2a06e868b2b2667d3cf60c35e7f96ab62d622e8b0d7d6571d50',
        roles: ['EMPLOYEE', 'ADMIN'],
    },
};
