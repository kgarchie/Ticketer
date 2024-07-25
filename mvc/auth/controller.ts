import { createRouter, defineEventHandler } from "h3";
import { identify, login, register, reset, saveNewPassword, logout, getUserToken } from "~/mvc/auth/functions";
import { getUserFromName } from "../user/queries";

const router = createRouter();

router.post('/login', defineEventHandler(async (event) => {
    return await login(event)
}
));

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