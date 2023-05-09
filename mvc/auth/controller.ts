import {createRouter, defineEventHandler} from "h3";
import {identify, login, register, reset, saveNewPassword, logout} from "~/mvc/auth/model";

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

router.post('identity/reset', defineEventHandler(async (event) => {
        return await reset(event)
    }
));

export default useBase('/api/auth', router.handler)