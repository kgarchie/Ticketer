/*
    Note: these files are ran in alphabetical order, it's imperative that this file is ran before webSocket.client.ts
 */
import {UserAuth} from "~/types";

export default defineNuxtPlugin(async () => {
    let _user_id: string | null = null
    const userState = useUser()

    if (userState.value.user_id) return

    // @ts-ignore
    let user = await useCookie('auth')?.value as UserAuth

    if (user == null || user?.user_id == '') {
        const {data: response} = await useFetch('/api/auth/identity')

        if (response?.value?.statusCode !== 200) {
            console.log("User could not be fetched")
            return
        }

        user = response.value.body as UserAuth
        _user_id = user.user_id

        // @ts-ignore
        let auth_user_token = await useCookie('auth').value?.auth_key

        if (auth_user_token === '') {
            useCookie<UserAuth | undefined>('auth', {expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10)}).value = {
                // @ts-ignore
                auth_key: response.value.body.auth_key,
                user_id: _user_id,
                // @ts-ignore
                is_admin: response.value.body.is_admin,
            } as UserAuth
            console.log('Auth cookie set | forcefully')
        }

        console.log('User fetched')
        userState.value = user

    } else {
        console.log('User Cookie found | Checking if valid...')
        const {data: response} = await useFetch(`/api/auth/identity/${user.user_id}/${user.auth_key}`)

        if (response?.value?.statusCode === 200) {
            console.log('User is found and valid')
            userState.value = user
        } else {
            console.log('User is invalid | Removing cookie')
            useCookie('auth').value = null
            alert('Your session has expired, please login again')
            window.location.reload()
        }
    }
})