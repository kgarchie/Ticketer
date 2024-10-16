import { createRouter, defineEventHandler } from "h3";
import { identify, login, register, reset, saveNewPassword, logout, getUserToken, sendOnboardingEmailValidation } from "~/mvc/auth/functions";
import { getUserFromName, getOnboardingUser } from "../user/queries";
import { z } from 'zod';
import { getRegisteredUser } from "./queries";
import { getCompanyByName } from "../company/queries";

const router = createRouter();

router.post('/login', defineEventHandler(async (event) => {
    return await login(event)
}
));

router.post("/onboard/email", defineEventHandler(async event => {
    const schema = z.object({
        email: z.string().email(),
        origin: z.string().url()
    });

    const { data, error } = await readValidatedBody(event, schema.safeParse);
    if (!data || error) {
        return createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: error.message,
            data: error
        })
    }

    const user = await getRegisteredUser({ email: data.email });
    if (user) {
        return createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "User already exists"
        })
    }

    sendOnboardingEmailValidation({email: data.email, origin: data.origin})

    return createResponse({
        statusCode: 200,
        statusMessage: "OK"
    })
}))


router.post("/onboard/email/verify", defineEventHandler(async event => {
    const schema = z.object({
        code: z.string(),
        email: z.string().email()
    })

    const {data, error} = await readValidatedBody(event, schema.safeParse);
    if (!data || error) {
        return createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: error.message,
            data: error
        })
    }

    const user = await getOnboardingUser({ email: data.email, token: data.code });
    if (!user) {
        return createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
            message: "Invalid token or Email Not Found"
        })
    }

    return createResponse({
        statusCode: 200,
        statusMessage: "OK",
        data: user
    })
}))


router.post("/onboard/name/verify", defineEventHandler(async event => {
    const schema = z.object({
        name: z.string()
    })

    const {data, error} = await readValidatedBody(event, schema.safeParse);

    if (!data || error) {
        return createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: error.message,
            data: error
        })
    }
    
    const company = await getCompanyByName(data.name);
    if (company) {
        return createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Company already exists"
        })
    }

    return createResponse({
        statusCode: 200,
        statusMessage: "OK"
    })
}))

router.post('/logout', defineEventHandler(async (event) => {
    return await logout(event)
}
));

router.get('/identity', defineEventHandler(async (event) => {
    return await identify(event)
}
));

router.post('/identity/new', defineEventHandler(async (event) => {
    return await saveNewPassword(event)
}
));

router.post('/identity/register', defineEventHandler(async (event) => {
    return await register(event)
}
));

router.post("/onboard/signup", defineEventHandler(async event => {
    const schema = z.object({
        email: z.string().email(),
        name: z.string(),
        invites: z.array(z.object({
            email: z.string().email()
        })),
        settings: z.object({
            requireApproval: z.boolean(),
            emailExtension: z.string().optional(),
            allowDomain: z.boolean(),
            allowedDomains: z.array(z.string()).optional(),
            chat: z.object({
                enabled: z.boolean()
            }).optional()
        })
    })

    const {data, error} = await readValidatedBody(event, schema.safeParse);
    if (!data || error) {
        return createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: error.message,
            data: error
        })
    }

    
}))

router.post('/identity/reset', defineEventHandler(async (event) => {
    return await reset(event)
}
));

router.get('/identity/:user_id/:token', defineEventHandler(async (event) => {
    return await getUserToken(event)
}));

router.get('/find/:name', defineEventHandler(async (event) => {
    const name = event.context.params?.name
    if (!name) return { statusCode: 400, body: 'Name not provided' }

    const user = await getUserFromName(name)
    if (!user) return { statusCode: 404, body: 'User not found' }

    return { statusCode: 200, body: user }
}));

export default useBase('/api/auth', router.handler)