import { OtpType } from '@activepieces/ee-shared'
import { ActivepiecesError, ApEdition, ApFlagId, assertNotNullOrUndefined, AuthenticationResponse, ErrorCode, isNil, PlatformRole, UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flagService } from '../flags/flag.service'
import { system } from '../helper/system/system'
import { platformService } from '../platform/platform.service'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
import { userInvitationsService } from '../user-invitations/user-invitation.service'
import { authenticationUtils } from './authentication-utils'
import { userIdentityService } from './user-identity/user-identity-service'
import { otpService } from '../ee/authentication/otp/otp-service'



export const authenticationService = (log: FastifyBaseLogger) => ({
    async signUp(params: SignUpParams): Promise<AuthenticationResponse> {
        if (!isNil(params.platformId)) {
            await authenticationUtils.assertEmailAuthIsEnabled({
                platformId: params.platformId,
                provider: params.provider,
            })
            await authenticationUtils.assertDomainIsAllowed({
                email: params.email,
                platformId: params.platformId,
            })
        }
        if (isNil(params.platformId)) {
            const userIdentity = await userIdentityService(log).create(params)

            const user = await userService.create({
                identityId: userIdentity.id,
                platformRole: PlatformRole.ADMIN,
                platformId: null,
            })
            const platform = await platformService.create({
                ownerId: user.id,
                name: userIdentity.firstName + '\'s Platform',
            })
            await userService.addOwnerToPlatform({
                platformId: platform.id,
                id: user.id,
            })
            const defaultProject = await projectService.create({
                displayName: 'Default Project',
                ownerId: user.id,
                platformId: platform.id,
            })

            const cloudEdition = system.getEdition()
            switch (cloudEdition) {
                case ApEdition.CLOUD:
                    await otpService(log).createAndSend({
                        platformId: platform.id,
                        email: params.email,
                        type: OtpType.EMAIL_VERIFICATION,
                    })
                    break
                case ApEdition.COMMUNITY:
                case ApEdition.ENTERPRISE:
                    await userIdentityService(log).verify(userIdentity.id)
                    break
            }

            await flagService.save({
                id: ApFlagId.USER_CREATED,
                value: true,
            })
            await authenticationUtils.sendTelemetry({
                identity: userIdentity,
                user: user,
                project: defaultProject,
                log,
            })
            await authenticationUtils.saveNewsLetterSubscriber(user, platform.id, userIdentity, log)

            return authenticationUtils.getProjectAndToken({
                userId: user.id,
                platformId: platform.id,
                projectId: defaultProject.id,
            })
        }

        await authenticationUtils.assertUserIsInvitedToPlatformOrProject(log, {
            email: params.email,
            platformId: params.platformId,
        })
        const userIdentity = await userIdentityService(log).create(params)
        await userIdentityService(log).verify(userIdentity.id)
        const user = await userService.create({
            identityId: userIdentity.id,
            platformRole: PlatformRole.MEMBER,
            platformId: params.platformId,
        })
        await userInvitationsService(log).provisionUserInvitation({
            email: params.email,
        })

        return authenticationUtils.getProjectAndToken({
            userId: user.id,
            platformId: params.platformId,
            projectId: null,
        })
    },
    async signInWithPassword(params: SignInWithPasswordParams): Promise<AuthenticationResponse> {
        const identity = await userIdentityService(log).verifyIdenityPassword(params)
        const platformId = isNil(params.predefinedPlatformId) ? await getPersonalPlatformIdForIdentity(identity.id) : params.predefinedPlatformId
        if (isNil(platformId)) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHENTICATION,
                params: {
                    message: 'No platform found for identity',
                },
            })
        }
        await authenticationUtils.assertEmailAuthIsEnabled({
            platformId,
            provider: UserIdentityProvider.EMAIL,
        })
        await authenticationUtils.assertDomainIsAllowed({
            email: params.email,
            platformId,
        })
        const user = await userService.getOneByIdentityAndPlatform({
            identityId: identity.id,
            platformId,
        })
        assertNotNullOrUndefined(user, 'User not found')
        return authenticationUtils.getProjectAndToken({
            userId: user.id,
            platformId,
            projectId: null,
        })
    },
    async federatedAuthn(params: FederatedAuthnParams): Promise<AuthenticationResponse> {
        const identity = await userIdentityService(log).verifyFederatedAuthn(params)
        const oldestPlatform = await platformService.getOldestPlatform()
        assertNotNullOrUndefined(oldestPlatform, 'Oldest platform not found')
        const user = await userService.getOneByIdentityAndPlatform({
            identityId: identity.id,
            platformId: oldestPlatform.id,
        })
        assertNotNullOrUndefined(user, 'User not found')
        return authenticationUtils.getProjectAndToken({
            userId: user.id,
            platformId: oldestPlatform.id,
            projectId: null,
        })
    },
    async switchPlatform(params: SwitchPlatformParams): Promise<AuthenticationResponse> {
        const platforms = await platformService.listPlatformsForIdentity({ identityId: params.identityId })
        const platform = platforms.find((platform) => platform.id === params.platformId)
        const allowToSwitch = !isNil(platform) && !platform.ssoEnabled && !platform.embeddingEnabled
        if (!allowToSwitch) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHENTICATION,
                params: {
                    message: 'Platform not found',
                },
            })
        }
        assertNotNullOrUndefined(platform, 'Platform not found')
        const user = await userService.getOneByIdentityAndPlatform({
            identityId: params.identityId,
            platformId: platform.id,
        })
        assertNotNullOrUndefined(user, 'User not found')
        return authenticationUtils.getProjectAndToken({
            userId: user.id,
            platformId: platform.id,
            projectId: null,
        })
    },
    async switchProject(params: SwitchProjectParams): Promise<AuthenticationResponse> {
        return authenticationUtils.getProjectAndToken({
            userId: params.userId,
            platformId: params.platformId,
            projectId: params.projectId,
        })
    },
})


async function getPersonalPlatformIdForIdentity(identityId: string): Promise<string | null> {
    const edition = system.getEdition()
    if (edition === ApEdition.CLOUD) {
        const platforms = await platformService.listPlatformsForIdentity({ identityId })
        const platform = platforms.find((platform) => !platform.ssoEnabled && !platform.embeddingEnabled)
        return platform?.id ?? null;
    }
    return null;
}

type FederatedAuthnParams = {
    email: string
    firstName: string
    lastName: string
    newsLetter: boolean
    trackEvents: boolean
    provider: UserIdentityProvider
}

type SignUpParams = {
    email: string
    firstName: string
    lastName: string
    password: string
    platformId: string | null
    trackEvents: boolean
    newsLetter: boolean
    provider: UserIdentityProvider
}

type SignInWithPasswordParams = {
    email: string
    password: string
    predefinedPlatformId: string | null
}

type SwitchPlatformParams = {
    identityId: string
    platformId: string
}

type SwitchProjectParams = {
    userId: string
    platformId: string
    projectId: string
}